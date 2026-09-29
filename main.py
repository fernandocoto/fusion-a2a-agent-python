"""A2A server for the customer support demo agent (agent 2 of the Fusion showcase)."""

import os

import uvicorn
from a2a.helpers import get_message_text, new_text_message
from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.routes import create_agent_card_routes, create_jsonrpc_routes
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import AgentCapabilities, AgentCard, AgentInterface, AgentSkill
from starlette.applications import Starlette

from support_agent import answer

PORT = int(os.getenv("PORT", "8000"))


def public_url() -> str:
    """URL published in the agent card: explicit, Codespaces-forwarded, or local."""
    if os.getenv("PUBLIC_URL"):
        return os.environ["PUBLIC_URL"].rstrip("/")
    name = os.getenv("CODESPACE_NAME")
    domain = os.getenv("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN")
    if name and domain:
        return f"https://{name}-{PORT}.{domain}"
    return f"http://localhost:{PORT}"


class SupportAgentExecutor(AgentExecutor):
    async def execute(self, context: RequestContext, event_queue: EventQueue) -> None:
        text = get_message_text(context.message) or ""
        await event_queue.enqueue_event(new_text_message(answer(text)))

    async def cancel(self, context: RequestContext, event_queue: EventQueue) -> None:
        raise NotImplementedError("Cancel is not supported.")


def skill(id_: str, name: str, description: str, examples: list[str]) -> AgentSkill:
    return AgentSkill(
        id=id_,
        name=name,
        description=description,
        tags=["atendimento"],
        examples=examples,
        input_modes=["text/plain"],
        output_modes=["text/plain"],
    )


AGENT_CARD = AgentCard(
    name="customer-support-agent-python",
    description="Agente de atendimento ao cliente em Python (a2a-sdk), virtualizado pelo Axway Amplify Fusion.",
    version="1.0.0",
    default_input_modes=["text/plain"],
    default_output_modes=["text/plain"],
    capabilities=AgentCapabilities(streaming=False),
    supported_interfaces=[AgentInterface(protocol_binding="JSONRPC", url=public_url(), protocol_version="1.0")],
    skills=[
        skill("register-complaint", "Registrar Reclamação", "Registra reclamações e gera protocolo.", ["Quero registrar uma reclamação sobre um produto com defeito."]),
        skill("collect-suggestion", "Registrar Sugestão", "Coleta sugestões e feedbacks.", ["Tenho uma sugestão para o aplicativo."]),
        skill("check-order-status", "Consultar Status da Compra", "Informa o status de um pedido.", ["Qual o status do pedido 12345?"]),
        skill("track-delivery", "Rastrear Entrega", "Informa transportadora, código e previsão.", ["Onde está a entrega do pedido 12345?"]),
        skill("cancel-order", "Cancelar Pedido", "Cancela pedidos ainda não enviados.", ["Quero cancelar o pedido 23456."]),
        skill("exchange-product", "Solicitar Troca", "Inicia a troca de um produto.", ["Quero trocar o produto do pedido 34567."]),
    ],
)


def build_app() -> Starlette:
    handler = DefaultRequestHandler(
        agent_executor=SupportAgentExecutor(),
        task_store=InMemoryTaskStore(),
        agent_card=AGENT_CARD,
    )
    routes = []
    routes.extend(create_agent_card_routes(AGENT_CARD))
    # Accept both A2A 1.0 (SendMessage) and 0.3 (message/send) clients.
    routes.extend(create_jsonrpc_routes(handler, "/", enable_v0_3_compat=True))
    return Starlette(routes=routes)


if __name__ == "__main__":
    print(f"Agent card URL: {public_url()}")
    uvicorn.run(build_app(), host="0.0.0.0", port=PORT)
