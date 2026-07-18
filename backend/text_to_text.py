"""Gemini text-to-text.

Takes text in and returns LLM-generated text out (e.g. summaries, replies,
rewrites). This is the plain text->text counterpart to the speech-to-text
(transcription) module.
"""

import requests

from app.config import GEMINI_API_BASE, GEMINI_API_KEY, GEMINI_MODEL

DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant. Respond with plain text only."


def text_to_text(
    text: str,
    system_prompt: str = DEFAULT_SYSTEM_PROMPT,
    temperature: float = 0.4,
    max_tokens: int = 512,
) -> str:
    """Send text to Gemini and return the generated text.

    Args:
        text: The user text to send to the model.
        system_prompt: Instruction that steers how the model responds.
        temperature: Sampling temperature (0 = deterministic).
        max_tokens: Maximum number of tokens in the reply.

    Returns:
        The model's reply as plain text.
    """
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "CURSOR_API_KEY (or GEMINI_API_KEY) is not set in the .env file."
        )

    url = f"{GEMINI_API_BASE}/models/{GEMINI_MODEL}:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
    }
    body = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": text}]}],
        "generationConfig": {
            "temperature": temperature,
            "thinkingConfig": {"thinkingBudget": 0},
            "maxOutputTokens": max(max_tokens, 64),
        },
    }

    response = requests.post(url, headers=headers, json=body, timeout=120)
    response.raise_for_status()

    payload = response.json()
    try:
        parts = payload["candidates"][0]["content"]["parts"]
        texts = [p["text"] for p in parts if isinstance(p, dict) and p.get("text")]
        if not texts:
            raise KeyError("parts")
        return "\n".join(texts).strip()
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(f"Unexpected Gemini response: {payload}") from exc
