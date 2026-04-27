from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.alerts import Alert


async def list_alerts(db: AsyncSession, limit: int, offset: int) -> tuple[
    list[Alert], int]:
    total_result = await db.execute(
        select(func.count()).select_from(Alert)
    )
    total = total_result.scalar_one()

    result = await db.execute(
        select(Alert)
        .order_by(Alert.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    return list(result.scalars().all()), total


async def create_alert(db: AsyncSession, file_id: str, level: str,
                       message: str) -> Alert:
    alert = Alert(file_id=file_id, level=level, message=message)
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert
