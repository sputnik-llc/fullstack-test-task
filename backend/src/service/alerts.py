from sqlalchemy import select, func

from src.db.session import async_session_maker
from src.models.alerts import Alert


async def list_alerts(limit: int, offset: int) -> tuple[list[Alert], int]:
    async with async_session_maker() as session:
        total_result = await session.execute(
            select(func.count()).select_from(Alert)
        )
        total = total_result.scalar_one()

        result = await session.execute(
            select(Alert)
            .order_by(Alert.created_at.desc())
            .offset(offset)
            .limit(limit)
        )

        return list(result.scalars().all()), total


async def create_alert(file_id: str, level: str, message: str) -> Alert:
    alert = Alert(file_id=file_id, level=level, message=message)
    async with async_session_maker() as session:
        session.add(alert)
        await session.commit()
        await session.refresh(alert)
        return alert
