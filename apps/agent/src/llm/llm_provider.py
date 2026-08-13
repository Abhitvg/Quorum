from abc import ABC, abstractmethod
import json
import os
import logging
from typing import Optional
from openai import AsyncOpenAI

logger = logging.getLogger("quorum-llm-provider")

SYSTEM_PROMPT = """You are Quo, a meeting assistant. You must ONLY answer questions using the `search_sources` tool.
If the tool returns no relevant information, you MUST reply exactly with: 'I could not verify that.'
Do not fabricate answers. Do not use your pre-trained knowledge under any circumstances."""

class LLMProvider(ABC):
    @abstractmethod
    async def generate_response(self, text: str) -> str:
        """Generates a string response for the given input text, utilizing the provided function context."""
        pass

class OpenAIProvider(LLMProvider):
    def __init__(self, model="gpt-4o-mini"):
        self.model = model
        self.client = AsyncOpenAI()
        
    async def generate_response(self, text: str) -> str:
        # Import the mock KB tool here to avoid circular imports if any
        from src.tools import MOCK_KB
        
        async def search_sources(query: str) -> str:
            query_lower = query.lower()
            results = []
            for key, fact in MOCK_KB.items():
                if key in query_lower:
                    results.append(fact)
                    
            if not results:
                return "No relevant information found."
            return "\n".join(results)

        tools = [
            {
                "type": "function",
                "function": {
                    "name": "search_sources",
                    "description": "Search the knowledge base for facts to answer the user's question.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "The search query or keyword to look up in the knowledge base."
                            }
                        },
                        "required": ["query"]
                    }
                }
            }
        ]

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text}
        ]

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=tools,
            tool_choice="auto",
        )

        message = response.choices[0].message
        
        # If no tool calls, just return the content
        if not message.tool_calls:
            return message.content or ""

        # Execute tool calls
        messages.append(message)
        
        for tool_call in message.tool_calls:
            if tool_call.function.name == "search_sources":
                args = json.loads(tool_call.function.arguments)
                query = args.get("query", "")
                tool_result = await search_sources(query)
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": tool_call.function.name,
                    "content": tool_result
                })

        # Second call to get the final answer after tool execution
        second_response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
        )

        return second_response.choices[0].message.content or ""
