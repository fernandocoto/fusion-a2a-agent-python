// Prints one line per HTTP request in the terminal: time, caller, route, JSON-RPC method,
// user text, agent reply, and whether the call succeeded or failed.
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const short = (s, n = 120) => (s && s.length > n ? `${s.slice(0, n)}...` : s || '');

// Collects every text found under "parts" (A2A 0.3 "text" and A2A 1.0 "content.value").
function partsText(node) {
  const found = [];
  const walk = (v) => {
    if (!v || typeof v !== 'object') return;
    if (Array.isArray(v.parts)) {
      for (const p of v.parts) {
        if (typeof p?.text === 'string') found.push(p.text);
        else if (typeof p?.content?.value === 'string') found.push(p.content.value);
      }
    }
    for (const k of Object.keys(v)) if (k !== 'parts') walk(v[k]);
  };
  walk(node);
  return found.join(' ').trim();
}

function parseJson(buf) {
  try {
    return JSON.parse(buf.toString('utf8'));
  } catch {
    return undefined;
  }
}

export function requestLogger(req, res, next) {
  const start = Date.now();
  const reqChunks = [];
  const resChunks = [];
  req.on('data', (c) => reqChunks.push(Buffer.from(c)));

  const write = res.write;
  const end = res.end;
  res.write = function (chunk, ...args) {
    if (chunk && typeof chunk !== 'function') resChunks.push(Buffer.from(chunk));
    return write.call(this, chunk, ...args);
  };
  res.end = function (chunk, ...args) {
    if (chunk && typeof chunk !== 'function') resChunks.push(Buffer.from(chunk));
    return end.call(this, chunk, ...args);
  };

  res.on('finish', () => {
    const ms = Date.now() - start;
    const time = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const caller = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const agent = short(req.headers['user-agent'] || '', 40);
    const reqBody = parseJson(Buffer.concat(reqChunks));
    const resBody = parseJson(Buffer.concat(resChunks));
    const rpcError = resBody?.error;
    const ok = res.statusCode < 400 && !rpcError;

    let line = `${DIM}[${time}]${RESET} ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms} ms) `;
    line += ok ? `${GREEN}SUCESSO${RESET}` : `${RED}ERRO${RESET}`;
    line += `  ${DIM}de ${caller} ${agent}${RESET}`;
    console.log(line);

    if (reqBody?.method) {
      const asked = partsText(reqBody.params);
      console.log(`    metodo: ${reqBody.method}${asked ? `  pergunta: "${short(asked)}"` : ''}`);
    }
    if (rpcError) {
      console.log(`    ${RED}erro JSON-RPC ${rpcError.code}: ${short(rpcError.message, 200)}${RESET}`);
    } else if (reqBody?.method) {
      const reply = partsText(resBody?.result ?? resBody);
      if (reply) console.log(`    resposta: "${short(reply)}"`);
    }
  });

  next();
}
