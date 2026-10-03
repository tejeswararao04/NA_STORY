"""NA Story AI service — free-key now, finetuned model later.

Contract (frozen — mobile app depends on this):
  POST /generate {name, prompt} -> {story, source}
  GET  /health -> {ok}

If GEMINI_API_KEY is set, calls Gemini free tier.
Otherwise returns a mock story ($0, offline-safe).
Swap the inside of generate_story() with your finetuned model later —
the endpoint shape never changes.
"""
import os

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="NA Story AI")


class GenerateIn(BaseModel):
    name: str = ""
    prompt: str = ""


def mock_story(name: str, prompt: str) -> str:
    hero = name.strip() or "our hero"
    idea = prompt.strip() or "a magical journey"
    return (
        f"Once upon a time, {hero} discovered {idea}.\n\n"
        "Along the way there were photos to remember, voice notes to keep, "
        "and a little courage that grew with every step.\n\n"
        "And from that day, every evening became a new story. (mock)"
    )


async def gemini_story(name: str, prompt: str, api_key: str) -> str:
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.0-flash:generateContent?key={api_key}"
    )
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": (
                            f"Write a short warm bedtime story (150-200 words) for "
                            f"{name or 'a child'} about: {prompt}. "
                            "Simple language, happy ending."
                        )
                    }
                ]
            }
        ]
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(url, json=payload)
        r.raise_for_status()
        data = r.json()
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    return "".join(p.get("text", "") for p in parts) or mock_story(name, prompt)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/generate")
async def generate(body: GenerateIn):
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if key:
        try:
            story = await gemini_story(body.name, body.prompt, key)
            return {"story": story, "source": "gemini-direct"}
        except Exception:
            pass  # fall through to mock — never 500 in MVP
    return {"story": mock_story(body.name, body.prompt), "source": "mock"}
