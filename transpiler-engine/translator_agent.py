import os
import asyncio
import pandas as pd
from pathlib import Path
from graphrag.config.enums import ModelType
from graphrag.language_model.manager import ModelManager
from graphrag.config.enums import ModelType
from graphrag.query.structured_search.global_search.community_context import (
    GlobalCommunityContext,
)
from graphrag.query.structured_search.global_search.search import GlobalSearch
from graphrag.query.structured_search.local_search.mixed_context import (
    LocalSearchMixedContext,
)
from graphrag.query.structured_search.local_search.search import LocalSearch
from graphrag.query.indexer_adapters import (
    read_indexer_entities,
    read_indexer_relationships,
    read_indexer_reports,
    read_indexer_text_units,
    read_indexer_covariates,
    read_indexer_report_embeddings,
)
from graphrag.vector_stores.lancedb import LanceDBVectorStore
from graphrag.query.context_builder.entity_extraction import EntityVectorStoreKey
from graphrag.config.models.language_model_config import LanguageModelConfig
from dotenv import load_dotenv, find_dotenv
import tiktoken

load_dotenv(find_dotenv())


class GraphRAGSearcher:
    def __init__(self, input_dir: str = None):
        self.input_dir = input_dir or os.getenv("GRAPHRAG_INPUT_DIR", "./ragtest/input")
        self.community_level = 2  # Default community level
        self.token_encoder = tiktoken.get_encoding("cl100k_base")
        self._load_data()
        self._setup_model_manager()
        self._setup_search_engines()

    def _setup_model_manager(self):
        api_key = os.getenv("AZURE_OPENAI_API_KEY", "")
        llm_model = os.getenv("AZURE_OPENAI_MODEL", "gpt-4")
        embedding_model = os.getenv(
            "AZURE_OPENAI_EMBEDDING_MODEL", "text-embedding-ada-002"
        )

        chat_config = LanguageModelConfig(
            api_key=api_key,
            type=ModelType.OpenAIChat,
            model=llm_model,
            api_base=os.getenv("AZURE_OPENAI_ENDPOINT", ""),
            api_type=ModelType.AzureOpenAIChat,
            api_version="2023-05-15",
            max_retries=20,
        )
        self.chat_model = ModelManager().get_or_create_chat_model(
            name="graphrag_search",
            model_type=ModelType.OpenAIChat,
            config=chat_config,
        )

        embedding_config = LanguageModelConfig(
            api_key=api_key,
            type=ModelType.OpenAIEmbedding,
            model=embedding_model,
            api_base=os.getenv("AZURE_OPENAI_ENDPOINT", ""),
            api_type=ModelType.AzureOpenAIChat,
            api_version="2023-05-15",
            max_retries=20,
        )
        self.text_embedder = ModelManager().get_or_create_embedding_model(
            name="graphrag_embedding",
            model_type=ModelType.OpenAIEmbedding,
            config=embedding_config,
        )

    def _load_data(self):
        self.entity_df = pd.read_parquet(
            f"{self.input_dir}/create_final_entities.parquet"
        )
        self.community_df = pd.read_parquet(
            f"{self.input_dir}/create_final_communities.parquet"
        )
        self.relationship_df = pd.read_parquet(
            f"{self.input_dir}/create_final_relationships.parquet"
        )
        self.text_unit_df = pd.read_parquet(
            f"{self.input_dir}/create_final_text_units.parquet"
        )
        self.report_df = pd.read_parquet(
            f"{self.input_dir}/create_final_community_reports.parquet"
        )
        self.covariate_df = pd.read_parquet(
            f"{self.input_dir}/create_final_covariates.parquet"
        )

        self.entities = read_indexer_entities(
            self.entity_df, self.community_df, self.community_level
        )

        db_uri = os.path.join(self.input_dir, "lancedb")

        self.description_embedding_store = LanceDBVectorStore(
            collection_name="default-entity-description"
        )
        self.description_embedding_store.connect(db_uri=db_uri)

        self.full_content_embedding_store = LanceDBVectorStore(
            collection_name="default-community-full_content"
        )
        self.full_content_embedding_store.connect(db_uri=db_uri)

        self.relationships = read_indexer_relationships(self.relationship_df)
        self.text_units = read_indexer_text_units(self.text_unit_df)
        self.covariates = read_indexer_covariates(self.covariate_df)

        self.reports = read_indexer_reports(
            self.report_df,
            self.community_df,
            self.community_level,
            content_embedding_col="full_content_embeddings",
        )
        read_indexer_report_embeddings(self.reports, self.full_content_embedding_store)

    def _setup_search_engines(self):
        self.local_context_builder = LocalSearchMixedContext(
            community_reports=self.reports,
            text_units=self.text_units,
            entities=self.entities,
            relationships=self.relationships,
            covariates=self.covariates,
            entity_text_embeddings=self.description_embedding_store,
            embedding_vectorstore_key=EntityVectorStoreKey.ID,
            text_embedder=self.text_embedder,
            token_encoder=self.token_encoder,
        )

        self.local_search_engine = LocalSearch(
            llm=self.chat_model,
            context_builder=self.local_context_builder,
            token_encoder=self.token_encoder,
            llm_params={"max_tokens": 2000, "temperature": 0.0},
            context_builder_params={
                "text_unit_prop": 0.5,
                "community_prop": 0.1,
                "conversation_history_max_turns": 5,
                "conversation_history_user_turns_only": True,
                "top_k_mapped_entities": 10,
                "top_k_relationships": 10,
                "include_entity_rank": True,
                "include_relationship_weight": True,
                "include_community_rank": False,
                "return_candidate_context": False,
                "embedding_vectorstore_key": EntityVectorStoreKey.ID,
                "max_tokens": 12000,
            },
            response_type="multiple paragraphs",
        )

        self.global_context_builder = GlobalCommunityContext(
            community_reports=self.reports,
            entities=self.entities,
            token_encoder=self.token_encoder,
        )

        self.global_search_engine = GlobalSearch(
            llm=self.chat_model,
            context_builder=self.global_context_builder,
            token_encoder=self.token_encoder,
            max_data_tokens=12000,
            map_llm_params={"max_tokens": 1000, "temperature": 0.0},
            reduce_llm_params={"max_tokens": 2000, "temperature": 0.0},
            allow_general_knowledge=False,
            json_mode=False,
            context_builder_params={
                "use_community_summary": False,
                "shuffle_data": True,
                "include_community_rank": True,
                "min_community_rank": 0,
                "community_rank_name": "rank",
                "include_community_weight": True,
                "community_weight_name": "occurrence weight",
                "normalize_community_weight": True,
                "max_tokens": 12000,
                "context_name": "Reports",
            },
            concurrent_coroutines=32,
            response_type="multiple paragraphs",
        )


def build_graphrag_searcher() -> GraphRAGSearcher:
    return GraphRAGSearcher()


searcher = build_graphrag_searcher()


async def get_relevant_examples(c_code: str):
    queries = [
        f"C to Chester translation examples: {c_code}",
        "Chester programming language syntax",
        "C to Chester conversion parallel examples",
        f"translate C code {c_code} to Chester",
    ]

    all_results = []
    for query in queries:
        local_result = await searcher.local_search_engine.asearch(query)
        global_result = await searcher.global_search_engine.asearch(query)
        all_results.extend([local_result.response, global_result.response])

    unique_results = list(set(all_results))
    return unique_results


def get_relevant_examples_sync(c_code: str):
    return asyncio.run(get_relevant_examples(c_code))
