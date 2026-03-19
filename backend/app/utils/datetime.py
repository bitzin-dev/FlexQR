from datetime import datetime, timedelta


def filter_recent_timestamps(
    timestamps: list[datetime],
    *,
    now: datetime,
    window_seconds: int,
) -> list[datetime]:
    """Return only timestamps inside the requested time window."""

    threshold = now - timedelta(seconds=window_seconds)
    return [timestamp for timestamp in timestamps if timestamp > threshold]
