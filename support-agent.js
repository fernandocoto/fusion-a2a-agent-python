// Customer support logic for the A2A demo agent.
// Rule-based on purpose: the demo shows Fusion virtualizing a real A2A service,
// not model quality. Orders are in-memory sample data.
import { randomUUID } from 'node:crypto';

const ORDERS = {
  12345: { status: 'enviado', carrier: 'Correios', tracking: 'BR123456789SP', eta: '02/10/2026' },
  23456: { status: 'processando', carrier: null, tracking: null, eta: '06/10/2026' },
  34567: { status: 'concluído', carrier: 'Jadlog', tracking: 'JD987654321', eta: 'entregue em 25/09/2026' },
  45678: { status: 'pago', carrier: null, tracking: null, eta: '08/10/2026' },
};

const normalize = (text) => text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
const protocol = () => 'ATD-' + randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
const has = (t, words) => words.some((w) => t.includes(w));

export function answer(text) {
  const t = normalize(text);
  const orderId = t.match(/\b(\d{5})\b/)?.[1];
  const order = orderId ? ORDERS[orderId] : undefined;

  if (has(t, ['reclama', 'defeito', 'pessimo', 'insatisfeito'])) {
    return `Sua reclamação foi registrada com o protocolo ${protocol()}. Nossa equipe responde em até 2 dias úteis.`;
  }
  if (has(t, ['sugest', 'ideia', 'melhoria', 'feedback'])) {
    return 'Obrigado pela sugestão! Ela foi encaminhada para a equipe de produto.';
  }
  if (t.includes('cancel')) {
    if (!order) return 'Para cancelar, informe o número do pedido (5 dígitos).';
    if (['processando', 'pago'].includes(order.status)) {
      return `Pedido ${orderId} cancelado. Protocolo ${protocol()}. O estorno aparece em até 7 dias úteis.`;
    }
    return `O pedido ${orderId} está '${order.status}' e não pode mais ser cancelado. Você pode solicitar uma troca ou devolução.`;
  }
  if (has(t, ['troca', 'trocar'])) {
    if (!order) return 'Para solicitar troca, informe o número do pedido (5 dígitos).';
    return `Troca do pedido ${orderId} iniciada. Protocolo ${protocol()}. Enviaremos a etiqueta de postagem por e-mail.`;
  }
  if (has(t, ['rastre', 'entrega', 'onde esta', 'chega'])) {
    if (!order) return 'Para rastrear a entrega, informe o número do pedido (5 dígitos).';
    if (!order.tracking) {
      return `O pedido ${orderId} ainda não foi despachado (status: ${order.status}). Previsão: ${order.eta}.`;
    }
    return `Pedido ${orderId} com ${order.carrier}, código ${order.tracking}. Previsão: ${order.eta}.`;
  }
  if (has(t, ['status', 'pedido', 'compra'])) {
    if (!order) return 'Informe o número do pedido (5 dígitos) para consultar o status. Exemplos: 12345, 23456.';
    return `O pedido ${orderId} está com status '${order.status}'. Previsão: ${order.eta}.`;
  }
  return (
    'Sou o agente de atendimento (Node.js, @a2a-js/sdk). Posso registrar reclamações, ' +
    'coletar sugestões, consultar status, rastrear entregas, cancelar pedidos e iniciar trocas.'
  );
}
