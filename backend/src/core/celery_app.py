from celery import Celery

from src.core.config import settings

celery_app = Celery(
    "file_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_BROKER_URL,
    include=["src.tasks.file_tasks"],
)
