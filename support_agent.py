"""Customer support logic for the A2A demo agent.

Rule-based on purpose: the demo shows Fusion virtualizing a real A2A service,
not model quality. Orders are in-memory sample data.
"""

import re
import unicodedata
import uuid

ORDERS = {
    "12345": {"status": "enviado", "carrier": "Correios", "tracking": "BR123456789SP", "eta": "02/10/2026"},
    "23456": {"status": "processando", "carrier": None, "tracking": None, "eta": "06/10/2026"},
    "34567": {"status": "concluído", "carrier": "Jadlog", "tracking": "JD987654321", "eta": "entregue em 25/09/2026"},
    "45678": {"status": "pago", "carrier": None, "tracking": None, "eta": "08/10/2026"},
}


def _normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", text.lower())
    return "".join(c for c in text if not unicodedata.combining(c))


def _order_id(text: str) -> str | None:
    match = re.search(r"\b(\d{5})\b", text)
    return match.group(1) if match else None


def _protocol() -> str:
    return "ATD-" + uuid.uuid4().hex[:8].upper()


def answer(text: str) -> str:
    t = _normalize(text)
    order_id = _order_id(t)
    order = ORDERS.get(order_id) if order_id else None

    if any(w in t for w in ("reclama", "defeito", "pessimo", "insatisfeito")):
        return f"Sua reclamação foi registrada com o protocolo {_protocol()}. Nossa equipe responde em até 2 dias úteis."

    if any(w in t for w in ("sugest", "ideia", "melhoria", "feedback")):
        return "Obrigado pela sugestão! Ela foi encaminhada para a equipe de produto."

    if "cancel" in t:
        if not order:
            return "Para cancelar, informe o número do pedido (5 dígitos)."
        if order["status"] in ("processando", "pago"):
            return f"Pedido {order_id} cancelado. Protocolo {_protocol()}. O estorno aparece em até 7 dias úteis."
        return f"O pedido {order_id} está '{order['status']}' e não pode mais ser cancelado. Você pode solicitar uma troca ou devolução."

    if "troca" in t or "trocar" in t:
        if not order:
            return "Para solicitar troca, informe o número do pedido (5 dígitos)."
        return f"Troca do pedido {order_id} iniciada. Protocolo {_protocol()}. Enviaremos a etiqueta de postagem por e-mail."

    if any(w in t for w in ("rastre", "entrega", "onde esta", "chega")):
        if not order:
            return "Para rastrear a entrega, informe o número do pedido (5 dígitos)."
        if not order["tracking"]:
            return f"O pedido {order_id} ainda não foi despachado (status: {order['status']}). Previsão: {order['eta']}."
        return f"Pedido {order_id} com {order['carrier']}, código {order['tracking']}. Previsão: {order['eta']}."

    if any(w in t for w in ("status", "pedido", "compra")):
        if not order:
            return "Informe o número do pedido (5 dígitos) para consultar o status. Exemplos: 12345, 23456."
        return f"O pedido {order_id} está com status '{order['status']}'. Previsão: {order['eta']}."

    return (
        "Sou o agente de atendimento (Python, a2a-sdk). Posso registrar reclamações, "
        "coletar sugestões, consultar status, rastrear entregas, cancelar pedidos e iniciar trocas."
    )
