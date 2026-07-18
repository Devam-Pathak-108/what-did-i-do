"""AI helpers for chat, backed by the Gemini generateContent API.

These implement the text-to-text flow: raw user text (raw_data) comes in from
the backend, the LLM produces the reply text. Prompt wording lives in the
top-level ``prompt`` module so it can be tuned without touching this logic.
"""

import asyncio
import re
from datetime import datetime, time
from typing import Any

import requests

import prompt as prompts
from app.config import GEMINI_API_BASE, GEMINI_API_KEY, GEMINI_MODEL
from app.utils.datetime_ist import IST, ist_date, now_ist


async def _gemini_chat(
    system_prompt: str,
    user_prompt: str,
    *,
    temperature: float = 0.3,
    max_tokens: int = 512,
) -> str:
    """Call the Gemini generateContent API and return the reply text."""
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
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            # Gemini 2.5+ models spend tokens on "thinking"; keep budget at 0
            # so short classification replies don't hit MAX_TOKENS empty.
            "thinkingConfig": {"thinkingBudget": 0},
            "maxOutputTokens": max(max_tokens, 64),
        },
    }

    def _call() -> dict[str, Any]:
        response = requests.post(url, headers=headers, json=body, timeout=60)
        response.raise_for_status()
        return response.json()

    payload = await asyncio.to_thread(_call)
    try:
        parts = payload["candidates"][0]["content"]["parts"]
        texts = [p["text"] for p in parts if isinstance(p, dict) and p.get("text")]
        if not texts:
            raise KeyError("parts")
        return "\n".join(texts).strip()
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(f"Unexpected Gemini response: {payload}") from exc


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


def _parse_score(text: str) -> float:
    """Parse a productivity score, clamped to the [-1, 1] range."""
    match = re.search(r"-?\d+(?:\.\d+)?", text or "")
    if not match:
        return 0.0
    return max(-1.0, min(1.0, float(match.group())))


def _summaries_as_lines(summaries: list[dict[str, Any]]) -> list[str]:
    """Render stored day summaries as '[date] summary' strings."""
    lines: list[str] = []
    for item in summaries:
        day = item.get("entry_date") or ""
        summary = item.get("summary") or item.get("raw_data") or ""
        lines.append(f"[{day}] {summary}")
    return lines


def _format_memories(summaries: list[dict[str, Any]]) -> str:
    """Render stored day summaries into a single block for the answer prompt."""
    return "\n".join(_summaries_as_lines(summaries))


def _period_label(summaries: list[dict[str, Any]]) -> str:
    """Build a human-readable label for the range covered by the summaries."""
    dates = sorted(s.get("entry_date") for s in summaries if s.get("entry_date"))
    if not dates:
        return "the selected period"
    if dates[0] == dates[-1]:
        return dates[0]
    return f"{dates[0]} to {dates[-1]}"


async def classify_intent(raw_data: str) -> int:
    """
    Classify user text into a chat intent.

    Returns:
        0 — user is telling about daily life
        1 — user is asking what they did on a particular date
        2 — user is both telling about the day and asking about the past
    """
    content = await _gemini_chat(
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
    date_text = await _gemini_chat(
        prompts.DATE_EXTRACTION_SYSTEM_PROMPT,
        prompts.build_date_extraction_prompt(raw_data, reference_date),
        temperature=0.0,
        max_tokens=16,
    )
    summary = await _gemini_chat(
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
    return await _gemini_chat(
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
    date_text = await _gemini_chat(
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
    return await _gemini_chat(
        prompts.ANSWER_SYSTEM_PROMPT,
        prompts.build_answer_prompt(specifics_to_fetch, memories),
        temperature=0.4,
        max_tokens=400,
    )


async def merge_replies(reply_from_type_0: str, reply_from_type_1: str) -> str:
    """Merge daily-life and recall replies into one chat reply (type 2)."""
    return await _gemini_chat(
        prompts.MERGE_REPLIES_SYSTEM_PROMPT,
        prompts.build_merge_replies_prompt(reply_from_type_0, reply_from_type_1),
        temperature=0.5,
        max_tokens=400,
    )


async def generate_period_summary_reply(summaries: list[dict[str, Any]]) -> str:
    """
    Generate a period summary reply from type-0 day summaries.

    Params:
        summaries: Day summaries fetched from DB for the requested range/month.

    Returns:
        reply: Conversational period summary string.
    """
    lines = _summaries_as_lines(summaries)
    return await _gemini_chat(
        prompts.PERIOD_SUMMARY_SYSTEM_PROMPT,
        prompts.build_period_summary_prompt(lines, _period_label(summaries)),
        temperature=0.4,
        max_tokens=500,
    )


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
    content = await _gemini_chat(
        prompts.PRODUCTIVITY_RATING_SYSTEM_PROMPT,
        prompts.build_productivity_rating_prompt([reply]),
        temperature=0.0,
        max_tokens=8,
    )
    return _parse_score(content)
