"""AI helpers for chat.

Temporary heuristic stubs so the API pipeline works until real models are wired in.
"""

from typing import Any

from app.utils.datetime_ist import now_ist


def _has_recall_signal(text: str) -> bool:
    lowered = text.lower()
    recall_markers = (
        "what did i",
        "what was i",
        "did i do",
        "remind me",
        "recall",
        "yesterday",
        "last week",
        "on monday",
        "on tuesday",
        "on wednesday",
        "on thursday",
        "on friday",
        "on saturday",
        "on sunday",
    )
    return any(marker in lowered for marker in recall_markers) or (
        "?" in text and any(w in lowered for w in ("what", "when", "where", "how"))
    )


def _has_daily_life_signal(text: str) -> bool:
    lowered = text.lower()
    daily_markers = (
        "i went",
        "i did",
        "i had",
        "i worked",
        "i met",
        "today i",
        "this morning",
        "this evening",
        "i ate",
        "i finished",
    )
    return any(marker in lowered for marker in daily_markers) or len(text.strip()) > 0


async def classify_intent(raw_data: str) -> int:
    """
    Classify user speech into a chat intent.

    Returns:
        0 — user is telling about daily life
        1 — user is asking what they did on a particular date
        2 — user is both telling about the day and asking about the past
    """
    text = (raw_data or "").strip()
    if not text:
        return 0

    is_recall = _has_recall_signal(text)
    is_daily = _has_daily_life_signal(text) and not text.endswith("?")

    if is_recall and is_daily:
        return 2
    if is_recall:
        return 1
    return 0


async def extract_daily_life(raw_data: str) -> dict[str, Any]:
    """
    Extract structured daily-life fields from raw speech.

    Returns:
        {
            "date": datetime,  # IST datetime for the day being described
            "summary": str,
        }
    """
    text = (raw_data or "").strip()
    return {
        "date": now_ist(),
        "summary": text or "No details shared.",
    }


async def generate_daily_reply(
    raw_data: str,
    conversation_history: list[dict[str, Any]] | None = None,
) -> str:
    """
    Generate a conversational reply for a daily-life (type 0) message.
    """
    _ = conversation_history
    text = (raw_data or "").strip()
    if not text:
        return "Got it — tell me a bit more about your day when you're ready."
    return f"Got it. I've noted that for today: {text}"


async def extract_recall_query(raw_data: str) -> dict[str, Any]:
    """
    Extract the date and specifics to fetch for a recall (type 1) question.

    Returns:
        {
            "date": datetime,  # IST datetime for the day to recall
            "specifics_to_fetch": str,
        }
    """
    text = (raw_data or "").strip()
    return {
        "date": now_ist(),
        "specifics_to_fetch": text or "what I did",
    }


async def generate_recall_reply(
    summaries: list[dict[str, Any]],
    specifics_to_fetch: str,
    conversation_history: list[dict[str, Any]] | None = None,
) -> str:
    """
    Generate a conversational reply from stored type-0 summaries.
    """
    _ = conversation_history
    if not summaries:
        return "I don't have anything for that day."

    bits: list[str] = []
    for item in summaries:
        summary = (item.get("summary") or "").strip()
        if summary:
            bits.append(summary)

    joined = "; ".join(bits) if bits else "some notes from that day"
    focus = specifics_to_fetch.strip() or "that day"
    return f"About {focus}: {joined}"


async def merge_replies(reply_from_type_0: str, reply_from_type_1: str) -> str:
    """
    Merge daily-life and recall replies into one chat reply (type 2).
    """
    left = (reply_from_type_0 or "").strip()
    right = (reply_from_type_1 or "").strip()
    if left and right:
        return f"{left}\n\n{right}"
    return left or right or "Okay."


async def generate_period_summary_reply(summaries: list[dict[str, Any]]) -> str:
    """
    Generate a period summary reply from type-0 day summaries.
    """
    # Temporary stub until the real model is wired in.
    if not summaries:
        return "I don't have enough day notes for that period yet."

    lines: list[str] = []
    for item in summaries:
        entry_date = item.get("entry_date") or item.get("date") or "unknown day"
        summary = (item.get("summary") or item.get("reply") or "").strip()
        if summary:
            lines.append(f"- {entry_date}: {summary}")
        else:
            lines.append(f"- {entry_date}")

    return (
        "Here's a quick look at that period based on your saved day notes:\n"
        + "\n".join(lines)
    )


async def score_summary_productivity(reply: str) -> float:
    """
    Score how productive the user was based on the final summary reply.

    Returns:
        score: Float in [-1, 1].
    """
    # Temporary stub until the real model is wired in.
    _ = reply
    return 0.0
