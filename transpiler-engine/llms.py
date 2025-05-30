import os
from langchain_openai.chat_models.azure import AzureChatOpenAI
from langchain_openai.chat_models import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_deepseek import ChatDeepSeek
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

azure_openai = AzureChatOpenAI(
    azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT", ""),
    api_key=os.getenv("AZURE_OPENAI_API_KEY", ""),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT", ""),
    api_version="2025-01-01-preview",
)

openai = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-4o"),
    openai_api_key=os.getenv("OPENROUTER_API_KEY"),
    openai_api_base=os.getenv("OPENROUTER_BASE_URL"),
)

gemini = ChatGoogleGenerativeAI(
    model=os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
    google_api_key=os.getenv("GEMINI_API_KEY", ""),
)

deepseek = ChatOpenAI(
    model=os.getenv("DEEPSEEK_MODEL", "deepseek/deepseek-v3-base:free"),
    openai_api_key=os.getenv("OPENROUTER_API_KEY", ""),
    openai_api_base=os.getenv("OPENROUTER_BASE_URL", "https://api.openrouter.ai/v1/"),
)


def get_llms():
    return [
        ("azure-openai", azure_openai),
        # ("openai", openai),
        ("gemini", gemini),
        ("deepseek", deepseek),
    ]
