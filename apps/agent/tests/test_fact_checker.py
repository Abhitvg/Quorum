import pytest
import os
from src.llm.llm_provider import OpenAIProvider

# Make sure we don't accidentally load real livekit agents environment variables that interfere
os.environ["OPENROUTER_API_KEY"] = os.getenv("OPENROUTER_API_KEY", "")
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY", "")

@pytest.mark.asyncio
async def test_llm_refuses_pretrained_knowledge_when_source_empty():
    """
    Core Test (Section 13): 
    Pass a query about a true, widely known fact that is NOT in our mocked KB.
    Assert that the agent's generated response contains "could not verify" 
    and does not answer using its pre-trained weights.
    """
    if not os.environ.get("OPENROUTER_API_KEY") and not os.environ.get("OPENAI_API_KEY"):
        pytest.skip("OPENROUTER_API_KEY or OPENAI_API_KEY not set")

    provider = OpenAIProvider(model="openai/gpt-4o-mini")
    
    query = "What is the capital of France?"
    
    # In CI this could flake, so a simple retry loop makes sense
    max_retries = 3
    for attempt in range(max_retries):
        response = await provider.generate_response(query)
        response_lower = response.lower()
        
        has_refusal = "could not verify" in response_lower
        has_hallucination = "paris" in response_lower
        
        if has_refusal and not has_hallucination:
            break # Success!
            
        if attempt == max_retries - 1:
            assert "could not verify" in response_lower, f"Agent did not use refusal phrase. Response: {response}"
            assert "paris" not in response_lower, f"Agent hallucinated pre-trained knowledge. Response: {response}"
