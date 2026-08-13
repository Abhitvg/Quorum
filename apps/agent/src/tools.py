import logging
from typing import Annotated
from livekit.agents import llm

logger = logging.getLogger("quorum-tools")

# Mock knowledge base, fictional facts so they don't overlap with pre-trained knowledge.
MOCK_KB = {
    "cyberdyne": "Q3 revenue for CyberDyne was $40M.",
    "acme": "Acme Corp announced a merger with Globex in 2026."
}

class AssistantFnc(llm.FunctionContext):
    @llm.ai_callable(
        description="Search the knowledge base for facts to answer the user's question."
    )
    async def search_sources(
        self,
        query: Annotated[
            str,
            "The search query or keyword to look up in the knowledge base."
        ]
    ) -> str:
        query_lower = query.lower()
        results = []
        for key, fact in MOCK_KB.items():
            if key in query_lower:
                results.append(fact)
                
        if not results:
            logger.info(f"search_sources returned empty for query: {query}")
            return "No relevant information found."
            
        logger.info(f"search_sources returned results for query: {query}")
        return "\n".join(results)

def assistant_fnc():
    return AssistantFnc()
