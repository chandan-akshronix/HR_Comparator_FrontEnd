"""
Configuration for AI Agent integration
"""
import os
from dotenv import load_dotenv

load_dotenv()

# AI Agent Configuration
AI_AGENT_URL = os.getenv("AI_AGENT_URL", "http://localhost:9000")
AI_AGENT_TIMEOUT = int(os.getenv("AI_AGENT_TIMEOUT", "120"))
AI_AGENT_ENABLED = os.getenv("AI_AGENT_ENABLED", "true").lower() == "true"

print(f"🤖 AI Agent Config: URL={AI_AGENT_URL}, Timeout={AI_AGENT_TIMEOUT}s, Enabled={AI_AGENT_ENABLED}")

