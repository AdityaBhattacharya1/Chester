import os


from langchain_openai.embeddings.azure import AzureOpenAIEmbeddings
from langchain_community.vectorstores import PGVector
from langchain_community.document_loaders import TextLoader, DirectoryLoader

from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())


def build_vectorstore() -> PGVector:
    embedder = AzureOpenAIEmbeddings(
        api_key=os.getenv("AZURE_OPENAI_API_EMBEDDINGS_KEY", ""),
        azure_endpoint=os.getenv("AZURE_OPENAI_EMBEDDINGS_ENDPOINT", ""),
        api_version="2023-05-15",
        model="text-embedding-3-small",
    )

    loader = DirectoryLoader(
        os.getenv("EXAMPLES_PATH", "./data/"),
        glob="**/*.md",
        loader_cls=TextLoader,
    )
    docs = loader.load()

    vectorstore = PGVector(
        connection_string=os.getenv(
            "PGVECTOR_CONNECTION_STRING",
            "postgresql+psycopg://postgres:password@localhost:5432/chester",
        ),
        collection_name=os.getenv("PGVECTOR_COLLECTION_NAME", "grammar_docs"),
        embedding_function=embedder,
    )

    vectorstore.add_documents(docs)
    return vectorstore


vectorstore = build_vectorstore()


def get_relevant_examples(c_code: str):
    queries = [
        f"C to Chester translation examples: {c_code}",
        "Chester programming language syntax",
        "C to Chester conversion parallel examples",
        f"translate C code {c_code} to Chester",
    ]

    all_docs = []
    for query in queries:
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
        docs = retriever.get_relevant_documents(query)
        all_docs.extend(docs)

    unique_docs = {}
    for doc in all_docs:
        content_hash = hash(doc.page_content)
        if content_hash not in unique_docs:
            unique_docs[content_hash] = doc

    return list(unique_docs.values())
