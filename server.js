// A2A server for the customer support demo agent (agent 2 of the Fusion showcase).
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { A2A_PROTOCOL_VERSION, AGENT_CARD_PATH, Role } from '@a2a-js/sdk';
import { AgentEvent, DefaultRequestHandler, InMemoryTaskStore } from '@a2a-js/sdk/server';
import { agentCardHandler, jsonRpcHandler, UserBuilder } from '@a2a-js/sdk/server/express';
import { duplicateInterfacesForLegacy } from '@a2a-js/sdk/compat/v0_3';
import { answer } from './support-agent.js';

const PORT = Number(process.env.PORT || 3000);

// URL published in the agent card: explicit, Codespaces-forwarded, or local.
function publicUrl() {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '');
  const { CODESPACE_NAME, GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN } = process.env;
  if (CODESPACE_NAME && GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN) {
    return `https://${CODESPACE_NAME}-${PORT}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`;
  }
  return `http://localhost:${PORT}`;
}

const skill = (id, name, description, example) => ({
  id,
  name,
  description,
  tags: ['atendimento'],
  examples: [example],
  inputModes: ['text/plain'],
  outputModes: ['text/plain'],
  securityRequirements: [],
});

const agentCard = {
  name: 'customer-support-agent-node',
  description: 'Agente de atendimento ao cliente em Node.js (@a2a-js/sdk), virtualizado pelo Axway Amplify Fusion.',
  // Declared at A2A 1.0 and mirrored at 0.3, so the same URL serves both client generations.
  supportedInterfaces: duplicateInterfacesForLegacy(
    [{ url: `${publicUrl()}/`, protocolBinding: 'JSONRPC', tenant: '', protocolVersion: A2A_PROTOCOL_VERSION }],
    ['JSONRPC']
  ),
  provider: { organization: 'Axway LATAM demo', url: 'https://www.axway.com' },
  version: '1.0.0',
  capabilities: { streaming: false, pushNotifications: false, extensions: [], extendedAgentCard: false },
  securitySchemes: {},
  securityRequirements: [],
  defaultInputModes: ['text/plain'],
  defaultOutputModes: ['text/plain'],
  skills: [
    skill('register-complaint', 'Registrar Reclamação', 'Registra reclamações e gera protocolo.', 'Quero registrar uma reclamação sobre um produto com defeito.'),
    skill('collect-suggestion', 'Registrar Sugestão', 'Coleta sugestões e feedbacks.', 'Tenho uma sugestão para o aplicativo.'),
    skill('check-order-status', 'Consultar Status da Compra', 'Informa o status de um pedido.', 'Qual o status do pedido 12345?'),
    skill('track-delivery', 'Rastrear Entrega', 'Informa transportadora, código e previsão.', 'Onde está a entrega do pedido 12345?'),
    skill('cancel-order', 'Cancelar Pedido', 'Cancela pedidos ainda não enviados.', 'Quero cancelar o pedido 23456.'),
    skill('exchange-product', 'Solicitar Troca', 'Inicia a troca de um produto.', 'Quero trocar o produto do pedido 34567.'),
  ],
  documentationUrl: '',
  signatures: [],
};

const textOf = (message) =>
  (message?.parts ?? [])
    .map((p) => (p.content?.$case === 'text' ? p.content.value : ''))
    .join(' ')
    .trim();

class SupportAgentExecutor {
  async execute(requestContext, eventBus) {
    const reply = answer(textOf(requestContext.userMessage));
    eventBus.publish(
      AgentEvent.message({
        messageId: randomUUID(),
        contextId: requestContext.contextId,
        taskId: '',
        role: Role.ROLE_AGENT,
        parts: [{ content: { $case: 'text', value: reply }, metadata: undefined, filename: '', mediaType: 'text/plain' }],
        metadata: undefined,
        extensions: [],
        referenceTaskIds: [],
      })
    );
    eventBus.finished();
  }

  cancelTask = async () => {};
}

const requestHandler = new DefaultRequestHandler(agentCard, new InMemoryTaskStore(), new SupportAgentExecutor());
const app = express();

// legacyCompat: accept A2A 1.0 (SendMessage) and 0.3 (message/send) clients.
app.use(`/${AGENT_CARD_PATH}`, agentCardHandler({ agentCardProvider: requestHandler, legacyCompat: { enabled: true } }));
app.use(jsonRpcHandler({ requestHandler, userBuilder: UserBuilder.noAuthentication, legacyCompat: { enabled: true } }));

app.listen(PORT, () => {
  console.log(`A2A agent listening on port ${PORT}`);
  console.log(`Agent card: ${publicUrl()}/${AGENT_CARD_PATH}`);
});
