"""Groq text-to-text.

Takes text in and returns LLM-generated text out (e.g. summaries, replies,
rewrites). This is the plain text->text counterpart to the speech-to-text
(transcription) and text-to-speech modules.
"""

import requests

from app.config import GROQ_API_KEY, GROQ_CHAT_URL, GROQ_MODEL

DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant. Respond with plain text only."


def text_to_text(
    text: str,
    system_prompt: str = DEFAULT_SYSTEM_PROMPT,
    temperature: float = 0.4,
    max_tokens: int = 512,
) -> str:
    """Send text to the Groq chat model and return the generated text.

    Args:
        text: The user text to send to the model.
        system_prompt: Instruction that steers how the model responds.
        temperature: Sampling temperature (0 = deterministic).
        max_tokens: Maximum number of tokens in the reply.

    Returns:
        The model's reply as plain text.
    """
    if not GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY (or CURSOR_API_KEY) is not set in the .env file."
        )

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    response = requests.post(GROQ_CHAT_URL, headers=headers, json=body, timeout=120)
    response.raise_for_status()

    payload = response.json()
    return payload["choices"][0]["message"]["content"].strip()
