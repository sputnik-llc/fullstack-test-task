import mimetypes
import os
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from src.models import Alert, StoredFile


BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage" / "files"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
CHUNK_SIZE = 1024 * 1024
MAX_UPLOAD_SIZE = int(os.environ.get("MAX_UPLOAD_SIZE_BYTES", str(25 * 1024 * 1024)))
DEFAULT_ALLOWED_EXTENSIONS = "txt,pdf,jpg,jpeg,png,csv,json"
ALLOWED_EXTENSIONS = {
    item.strip().lower()
    for item in os.environ.get("ALLOWED_EXTENSIONS", DEFAULT_ALLOWED_EXTENSIONS).split(",")
    if item.strip()
}
ALLOWED_MIME_TYPES = {
    "text/plain",
    "application/pdf",
    "image/jpeg",
    "image/png",
    "text/csv",
    "application/json",
}
DB_URL = (
    f"postgresql+asyncpg://{os.environ.get('POSTGRES_USER')}:"
    f"{os.environ.get('POSTGRES_PASSWORD')}@{os.environ.get('POSTGRES_HOST')}:"
    f"{os.environ.get('PGPORT')}/{os.environ.get('POSTGRES_DB')}"
)
engine = create_async_engine(DB_URL)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)


def _normalize_extension(filename: str | None) -> str:
    suffix = Path(filename or "").suffix.lower()
    return suffix[1:] if suffix.startswith(".") else suffix


def _validate_upload_type(filename: str | None, content_type: str | None) -> None:
    extension = _normalize_extension(filename)
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported extension: .{extension or 'unknown'}",
        )

    if content_type and content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported mime type: {content_type}",
        )


async def list_files(limit: int = 50, offset: int = 0) -> list[StoredFile]:
    async with async_session_maker() as session:
        result = await session.execute(
            select(StoredFile)
            .order_by(StoredFile.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())


async def list_alerts(limit: int = 50, offset: int = 0) -> list[Alert]:
    async with async_session_maker() as session:
        result = await session.execute(
            select(Alert)
            .order_by(Alert.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())


async def get_file(file_id: str) -> StoredFile:
    async with async_session_maker() as session:
        file_item = await session.get(StoredFile, file_id)
        if not file_item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
        return file_item


async def create_file(title: str, upload_file: UploadFile) -> StoredFile:
    _validate_upload_type(upload_file.filename, upload_file.content_type)

    file_id = str(uuid4())
    suffix = Path(upload_file.filename or "").suffix
    stored_name = f"{file_id}{suffix}"
    stored_path = STORAGE_DIR / stored_name
    total_size = 0
    is_empty = True
    first_chunk: bytes | None = None
    try:
        with open(stored_path, "wb") as stored_file:
            while True:
                chunk = await upload_file.read(CHUNK_SIZE)
                if not chunk:
                    break
                if first_chunk is None:
                    first_chunk = chunk
                is_empty = False
                total_size += len(chunk)
                if total_size > MAX_UPLOAD_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File is too large. Limit is {MAX_UPLOAD_SIZE} bytes",
                    )
                stored_file.write(chunk)
    except HTTPException:
        if stored_path.exists():
            stored_path.unlink()
        raise

    if is_empty:
        if stored_path.exists():
            stored_path.unlink()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is empty")

    if (upload_file.content_type or "").lower() == "application/pdf":
        if first_chunk is None or not first_chunk.startswith(b"%PDF"):
            if stored_path.exists():
                stored_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PDF signature",
            )

    file_item = StoredFile(
        id=file_id,
        title=title,
        original_name=upload_file.filename or stored_name,
        stored_name=stored_name,
        mime_type=upload_file.content_type or mimetypes.guess_type(stored_name)[0] or "application/octet-stream",
        size=total_size,
        processing_status="uploaded",
    )
    async with async_session_maker() as session:
        session.add(file_item)
        await session.commit()
        await session.refresh(file_item)
    return file_item


async def update_file(file_id: str, title: str) -> StoredFile:
    async with async_session_maker() as session:
        file_item = await session.get(StoredFile, file_id)
        if not file_item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
        file_item.title = title
        await session.commit()
        await session.refresh(file_item)
        return file_item


async def delete_file(file_id: str) -> None:
    async with async_session_maker() as session:
        file_item = await session.get(StoredFile, file_id)
        if not file_item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
        stored_path = STORAGE_DIR / file_item.stored_name
        if stored_path.exists():
            stored_path.unlink()
        await session.delete(file_item)
        await session.commit()


async def get_file_path(file_id: str) -> tuple[StoredFile, Path]:
    file_item = await get_file(file_id)
    stored_path = STORAGE_DIR / file_item.stored_name
    if not stored_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stored file not found")
    return file_item, stored_path


async def create_alert(file_id: str, level: str, message: str) -> Alert:
    alert = Alert(file_id=file_id, level=level, message=message)
    async with async_session_maker() as session:
        session.add(alert)
        await session.commit()
        await session.refresh(alert)
        return alert
