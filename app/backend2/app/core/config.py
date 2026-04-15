import os

class Config:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", None)
    MODEL = "gpt-4o-mini"

config = Config()