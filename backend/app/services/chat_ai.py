"""AI helpers for chat, backed by the Groq chat-completions API.

These implement the text-to-text flow: raw user text in, LLM-generated text
out. Prompt wording lives in the top-level ``prompt`` module so it can be tuned
without touching this logic.
"""

import asyncio
import re
from datetime import datetime, time
from typing import Any

import requests

import prompt as prompts
from app.config import GROQ_API_KEY, GROQ_CHAT_URL, GROQ_MODEL
from app.utils.datetime_ist import IST, ist_date, now_ist, to_ist


async def _groq_chat(
    system_prompt: str,
    user_prompt: str,
    *,
    temperature: float = 0.3,
    max_tokens: int = 512,
) -> str:
    """Call the Groq chat-completions API and return the reply text."""
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
            {"role": "user", "content": user_prompt},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    def _call() -> dict[str, Any]:
        response = requests.post(GROQ_CHAT_URL, headers=headers, json=body, timeout=60)
        response.raise_for_status()
        return response.json()

    payload = await asyncio.to_thread(_call)
    return payload["choices"][0]["message"]["content"].strip()


def _format_history(conversation_history: list[dict[str, Any]] | None) -> str:
    """Render recent turns as simple 'User:'/'Assistant:' lines."""
    if not conversation_history:
        return ""
    lines: list[str] = []
    for turn in conversation_history:
        speaker = "User" if turn.get("type") == "asked" else "Assistant"
        lines.append(f"{speaker}: {turn.get('message', '')}")
    return "\n".join(lines)


def _parse_date(text: str) -> datetime:
    """Parse a YYYY-MM-DD reply into an IST datetime, defaulting to today."""
    match = re.search(r"\d{4}-\d{2}-\d{2}", text or "")
    if not match:
        return now_ist()
    try:
        parsed = datetime.strptime(match.group(), "%Y-%m-%d").date()
    except ValueError:
        return now_ist()
    return datetime.combine(parsed, time.min, tzinfo=IST)


def _format_memories(summaries: list[dict[str, Any]]) -> str:
    """Render stored day summaries into text for the answer prompt."""
    lines: list[str] = []
    for item in summaries:
        day = item.get("entry_date") or ""
        summary = item.get("summary") or item.get("raw_data") or ""
        lines.append(f"[{day}] {summary}")
    return "\n".join(lines)


async def classify_intent(raw_data: str) -> int:
    """
    Classify user text into a chat intent.

    Returns:
        0 — user is telling about daily life
        1 — user is asking what they did on a particular date
        2 — user is both telling about the day and asking about the past
    """
    content = await _groq_chat(
        prompts.INTENT_CLASSIFICATION_SYSTEM_PROMPT,
        prompts.build_intent_classification_prompt(raw_data),
        temperature=0.0,
        max_tokens=4,
    )
    for char in content:
        if char in "012":
            return int(char)
    return 0


async def extract_daily_life(raw_data: str) -> dict[str, Any]:
    """
    Extract structured daily-life fields from raw user text.

    Returns:
        {"date": datetime (IST), "summary": str}
    """
    reference_date = ist_date(now_ist()).isoformat()
    date_text = await _groq_chat(
        prompts.DATE_EXTRACTION_SYSTEM_PROMPT,
        prompts.build_date_extraction_prompt(raw_data, reference_date),
        temperature=0.0,
        max_tokens=16,
    )
    summary = await _groq_chat(
        prompts.DAILY_SUMMARY_SYSTEM_PROMPT,
        prompts.build_daily_summary_prompt(raw_data),
        temperature=0.3,
        max_tokens=300,
    )
    return {"date": _parse_date(date_text), "summary": summary}


async def generate_daily_reply(
    raw_data: str,
    conversation_history: list[dict[str, Any]] | None = None,
) -> str:
    """Generate a conversational reply for a daily-life (type 0) message."""
    return await _groq_chat(
        prompts.DAILY_REPLY_SYSTEM_PROMPT,
        prompts.build_daily_reply_prompt(
            raw_data,
            _format_history(conversation_history),
        ),
        temperature=0.6,
        max_tokens=300,
    )


async def extract_recall_query(raw_data: str) -> dict[str, Any]:
    """
    Extract the date and specifics to fetch for a recall (type 1) question.

    Returns:
        {"date": datetime (IST), "specifics_to_fetch": str}
    """
    reference_date = ist_date(now_ist()).isoformat()
    date_text = await _groq_chat(
        prompts.DATE_EXTRACTION_SYSTEM_PROMPT,
        prompts.build_date_extraction_prompt(raw_data, reference_date),
        temperature=0.0,
        max_tokens=16,
    )
    return {"date": _parse_date(date_text), "specifics_to_fetch": raw_data}


async def generate_recall_reply(
    summaries: list[dict[str, Any]],
    specifics_to_fetch: str,
    conversation_history: list[dict[str, Any]] | None = None,
) -> str:
    """Generate a conversational reply from stored type-0 summaries."""
    memories = _format_memories(summaries)
    return await _groq_chat(
        prompts.ANSWER_SYSTEM_PROMPT,
        prompts.build_answer_prompt(specifics_to_fetch, memories),
        temperature=0.4,
        max_tokens=400,
    )


async def merge_replies(reply_from_type_0: str, reply_from_type_1: str) -> str:
    """
    Merge daily-life and recall replies into one chat reply (type 2).

    Params:
        reply_from_type_0: Reply produced by the type-0 flow.
        reply_from_type_1: Reply produced by the type-1 flow
            (including the friendly empty-day message when needed).

    Returns:
        reply: Single merged conversational reply.
    """
    ...


async def generate_period_summary_reply(summaries: list[dict[str, Any]]) -> str:
    """
    Generate a period summary reply from type-0 day summaries.

    Params:
        summaries: Day summaries fetched from DB for the requested range/month.

    Returns:
        reply: Conversational period summary string.
    """
    ...


async def score_summary_productivity(reply: str) -> float:
    """
    Score how productive the user was based on the final summary reply.

    Params:
        reply: Final summary reply text.

    Returns:
        score: Float in [-1, 1].
            Negative — not productive through the period.
            Positive — productive through the period.
    """
    ...
    """Merge daily-life and recall replies into one chat reply (type 2)."""
    return await _groq_chat(
        prompts.MERGE_REPLIES_SYSTEM_PROMPT,
        prompts.build_merge_replies_prompt(reply_from_type_0, reply_from_type_1),
        temperature=0.5,
        max_tokens=400,
    )
