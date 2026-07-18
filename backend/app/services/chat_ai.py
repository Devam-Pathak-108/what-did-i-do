"""AI helpers for chat. Bodies are intentionally empty stubs for now."""

from typing import Any


async def classify_intent(raw_data: str) -> int:
    """
    Classify user speech into a chat intent.

    Params:
        raw_data: Raw speech text from the user.

    Returns:
        0 — user is telling about daily life
        1 — user is asking what they did on a particular date
        2 — user is both telling about the day and asking about the past
    """
    ...


async def extract_daily_life(raw_data: str) -> dict[str, Any]:
    """
    Extract structured daily-life fields from raw speech.

    Params:
        raw_data: Raw speech text from the user.

    Returns:
        {
            "date": datetime,  # IST datetime for the day being described
            "summary": str,
        }
    """
    ...


async def generate_daily_reply(
    raw_data: str,
    conversation_history: list[dict[str, Any]] | None = None,
) -> str:
    """
    Generate a conversational reply for a daily-life (type 0) message.

    Params:
        raw_data: Raw speech text from the user.
        conversation_history: Recent chat turns for context (asked/reply).

    Returns:
        reply: Conversational reply string.
    """
    ...


async def extract_recall_query(raw_data: str) -> dict[str, Any]:
    """
    Extract the date and specifics to fetch for a recall (type 1) question.

    Params:
        raw_data: Raw speech text from the user.

    Returns:
        {
            "date": datetime,  # IST datetime for the day to recall
            "specifics_to_fetch": str,
        }
    """
    ...


async def generate_recall_reply(
    summaries: list[dict[str, Any]],
    specifics_to_fetch: str,
    conversation_history: list[dict[str, Any]] | None = None,
) -> str:
    """
    Generate a conversational reply from stored type-0 summaries.

    Params:
        summaries: Type-0 day summaries fetched for the target date.
        specifics_to_fetch: What the user wants to know.
        conversation_history: Recent chat turns for context.

    Returns:
        reply: Conversational reply string.
    """
    ...


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
