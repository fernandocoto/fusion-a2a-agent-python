# Customer support A2A agent (Python)

Agent 2 of the Axway Amplify Fusion A2A showcase. A real A2A server built with the official `a2a-sdk` (1.2.0), rule-based on purpose, meant to run in a GitHub Codespace and be virtualized by Fusion.

It speaks A2A 1.0 (`SendMessage`) and A2A 0.3 (`message/send`) over JSON-RPC at `/`, and serves its agent card at `/.well-known/agent-card.json`.

## Run in a GitHub Codespace

1. Push this folder to a GitHub repository (it must be the repository root, so `.devcontainer/` is found).
2. On GitHub: **Code → Codespaces → Create codespace on main**. The container installs the requirements and starts the agent on port 8000 (log in `agent.log`).
3. Make port 8000 public. In the Codespace terminal:

   ```bash
   gh codespace ports visibility 8000:public -c "$CODESPACE_NAME"
   ```

   Or in VS Code: **Ports** tab → right-click port 8000 → **Port Visibility → Public**.
4. The public URL is `https://$CODESPACE_NAME-8000.$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN`. Print it with:

   ```bash
   echo "https://$CODESPACE_NAME-8000.$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN"
   ```

   Use this URL as the backend of the A2A agent in Fusion.

The Codespace stops after the idle timeout (30 minutes by default). Open it before a demo. If you recreate it, the URL changes and the Fusion backend connection must be updated.

## Run locally

```bash
pip install -r requirements.txt
python main.py
```

Environment variables: `PORT` (default 8000), `PUBLIC_URL` (URL published in the agent card; defaults to the Codespaces URL or `http://localhost:<port>`).

## Test

```bash
curl -s https://<public-url>/.well-known/agent-card.json

curl -s -X POST https://<public-url>/ -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"message/send","params":{"message":{"role":"user","messageId":"m1","parts":[{"kind":"text","text":"Qual o status do pedido 12345?"}]}}}'
```

Sample orders: 12345 (enviado), 23456 (processando), 34567 (concluído), 45678 (pago).
