from agno.agent import Agent
from agno.knowledge.text import TextKnowledgeBase
from agno.vectordb.pgvector import PgVector
from agno.models.anthropic import Claude
from agno.tools.reasoning import ReasoningTools

knowledge_base = TextKnowledgeBase(
    path="data",
    vector_db=PgVector(
        table_name="text_documents",
        db_url=f"postgresql+psycopg://postgres:password@localhost:5532/chester",
    ),
)

rag_agent = Agent(
    name="Agno Assist",
    model=Claude(id="claude-3-7-sonnet-latest"),
    instructions=[
        "Use tables to display data.",
        "Include sources in your response.",
        "Search your knowledge before answering the question.",
        "Only include the output in your response. No other text.",
    ],
    knowledge_base=knowledge_base,
    search_knowledge=True,
    tools=[ReasoningTools(add_instructions=True)],
    add_datetime_to_instructions=True,
    markdown=True,
)