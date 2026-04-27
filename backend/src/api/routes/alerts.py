from fastapi import APIRouter, Query

from src.schemas.alerts import AlertItem, AlertsPage
from src.service.alerts import list_alerts

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=AlertsPage)
async def list_alerts_view(
        limit: int = Query(20, ge=1, le=100),
        offset: int = Query(0, ge=0),
):
    alerts, total = await list_alerts(limit=limit, offset=offset)

    return AlertsPage(
        items=[AlertItem.model_validate(alert) for alert in alerts],
        total=total,
        limit=limit,
        offset=offset,
    )
