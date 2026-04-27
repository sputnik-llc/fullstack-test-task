from pathlib import Path

from src.core.async_utils import run_async
from src.core.celery_app import celery_app
from src.core.storage import STORAGE_DIR
from src.db.session import async_session_maker
from src.models.alerts import Alert
from src.models.files import StoredFile


async def _mark_file_processing_failed(file_id: str, details: str) -> None:
    async with async_session_maker() as session:
        file_item = await session.get(StoredFile, file_id)
        if not file_item:
            return

        scan_details = details[:500]
        file_item.processing_status = "failed"
        file_item.scan_status = "failed"
        file_item.scan_details = scan_details
        file_item.requires_attention = True
        session.add(Alert(
            file_id=file_id,
            level="critical",
            message=f"File processing failed: {scan_details}"[:500],
        ))
        await session.commit()


def _run_file_task(file_id: str, coroutine) -> None:
    try:
        run_async(coroutine)
    except Exception as exc:
        run_async(_mark_file_processing_failed(file_id, str(exc)))
        raise


async def _scan_file_for_threats(file_id: str) -> None:
    async with async_session_maker() as session:
        file_item = await session.get(StoredFile, file_id)
        if not file_item:
            return

        file_item.processing_status = "processing"
        reasons: list[str] = []
        extension = Path(file_item.original_name).suffix.lower()

        if extension in {".exe", ".bat", ".cmd", ".sh", ".js"}:
            reasons.append(f"suspicious extension {extension}")

        if file_item.size > 10 * 1024 * 1024:
            reasons.append("file is larger than 10 MB")

        if extension == ".pdf" and file_item.mime_type not in {"application/pdf",
                                                               "application/octet-stream"}:
            reasons.append("pdf extension does not match mime type")

        file_item.scan_status = "suspicious" if reasons else "clean"
        file_item.scan_details = ", ".join(reasons) if reasons else "no threats found"
        file_item.requires_attention = bool(reasons)
        await session.commit()

    extract_file_metadata.delay(file_id)


async def _extract_file_metadata(file_id: str) -> None:
    async with async_session_maker() as session:
        file_item = await session.get(StoredFile, file_id)
        if not file_item:
            return

        stored_path = STORAGE_DIR / file_item.stored_name
        if not stored_path.exists():
            file_item.processing_status = "failed"
            file_item.scan_status = file_item.scan_status or "failed"
            file_item.scan_details = "stored file not found during metadata extraction"
            await session.commit()
            send_file_alert.delay(file_id)
            return

        metadata = {
            "extension": Path(file_item.original_name).suffix.lower(),
            "size_bytes": file_item.size,
            "mime_type": file_item.mime_type,
        }

        if file_item.mime_type.startswith("text/"):
            content = stored_path.read_text(encoding="utf-8", errors="ignore")
            metadata["line_count"] = len(content.splitlines())
            metadata["char_count"] = len(content)
        elif file_item.mime_type == "application/pdf":
            content = stored_path.read_bytes()
            metadata["approx_page_count"] = max(content.count(b"/Type /Page"), 1)

        file_item.metadata_json = metadata
        file_item.processing_status = "processed"
        await session.commit()

    send_file_alert.delay(file_id)


async def _send_file_alert(file_id: str) -> None:
    async with async_session_maker() as session:
        file_item = await session.get(StoredFile, file_id)
        if not file_item:
            return

        if file_item.processing_status == "failed":
            alert = Alert(file_id=file_id, level="critical",
                          message="File processing failed")
        elif file_item.requires_attention:
            alert = Alert(
                file_id=file_id,
                level="warning",
                message=f"File requires attention: {file_item.scan_details}",
            )
        else:
            alert = Alert(file_id=file_id, level="info",
                          message="File processed successfully")

        session.add(alert)
        await session.commit()


@celery_app.task
def scan_file_for_threats(file_id: str) -> None:
    _run_file_task(file_id, _scan_file_for_threats(file_id))


@celery_app.task
def extract_file_metadata(file_id: str) -> None:
    _run_file_task(file_id, _extract_file_metadata(file_id))


@celery_app.task
def send_file_alert(file_id: str) -> None:
    _run_file_task(file_id, _send_file_alert(file_id))
