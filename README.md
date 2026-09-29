# Customer support A2A agent (Node.js)

Agent 2 of the Axway Amplify Fusion A2A showcase: a real A2A server built with the official `@a2a-js/sdk`, rule-based on purpose, virtualized by Fusion.

It speaks A2A 1.0 (`SendMessage`) and A2A 0.3 (`message/send`) over JSON-RPC at `/`, and serves its agent card at `/.well-known/agent-card.json`.

## Run (GitHub Codespaces or local)

```bash
cp .env.example .env
npm install
npm start
```

In a Codespace, make the port public so Fusion can reach it: **Ports** tab → right-click port 3000 → **Port Visibility → Public**, or:

```bash
gh codespace ports visibility 3000:public -c "$CODESPACE_NAME"
```

The public URL is `https://<codespace-name>-3000.app.github.dev`. Use it as the backend of the A2A agent in Fusion.

## Configuration (`.env`)

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `PUBLIC_URL` | Codespaces URL or `http://localhost:<PORT>` | URL published in the agent card |

## Test

```bash
curl -s https://<public-url>/.well-known/agent-card.json

curl -s -X POST https://<public-url>/ -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"message/send","params":{"message":{"role":"user","messageId":"m1","parts":[{"kind":"text","text":"Qual o status do pedido 12345?"}]}}}'
```

Sample orders: 12345 (enviado), 23456 (processando), 34567 (concluído), 45678 (pago).
