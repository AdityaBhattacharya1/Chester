import os

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_API_VERSION = "2023-05-15"
AZURE_OPENAI_DEPLOYMENT_NAME = "your-deployment-name"

# Iteration Settings
MAX_ITERATIONS = 1

# Paths
C_EXECUTABLE_PATH = "./temp_c.out"
CHESTER_EXECUTABLE = "chester"  # Ensure 'chester' is in your PATH or provide full path
