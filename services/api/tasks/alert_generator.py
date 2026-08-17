import os
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from dotenv import load_dotenv

load_dotenv()
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")

llm_client = ChatNVIDIA(
    model="meta/llama-3.1-8b-instruct",
    api_key=NVIDIA_API_KEY,
    temperature=0.3,
    max_completion_tokens=500
)

async def generate_alert_summary(district: str, risk_label: str, cases_count: int):
    """
    LLM (NVIDIA-hosted) turns a risk spike into a readable brief.
    """
    prompt = f"Write a short, professional public-health alert summary for the {district} district. " \
             f"The current risk label is {risk_label} based on a recent spike of {cases_count} cases. " \
             f"Recommend immediate containment steps. Keep it under 3 sentences."
             
    lc_messages = [{"role": "user", "content": prompt}]
    
    try:
        response = llm_client.invoke(lc_messages, chat_template_kwargs={"enable_thinking": False})
        return response.content
    except Exception as e:
        print(f"Error generating alert: {e}")
        return f"URGENT: High risk detected in {district} ({cases_count} cases). Deploy resources immediately."
