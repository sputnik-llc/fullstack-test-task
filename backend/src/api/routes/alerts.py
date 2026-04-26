from fastapi import APIRouter

from src.schemas.alerts import AlertItem
from src.service.alerts import list_alerts

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertItem])
async def list_alerts_view():
    return await list_alerts()
