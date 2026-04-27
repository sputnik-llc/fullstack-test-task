import mimetypes
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from src.core.storage import STORAGE_DIR
from src.models.files import StoredFile


async def list_files(db: AsyncSession, limit: int, offset: int):
    query = (
        select(
            StoredFile,
            func.count().over().label("total_count")
        )
        .order_by(StoredFile.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    result = await db.execute(query)
    rows = result.all()

    if not rows:
        return [], 0

    files = [row[0] for row in rows]
    total = rows[0][1]

    return files, total


async def get_file(db: AsyncSession, file_id: str) -> StoredFile:
    file_item = await db.get(StoredFile, file_id)
    if not file_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="File not found")
    return file_item


async def create_file(db: AsyncSession, title: str,
                      upload_file: UploadFile) -> StoredFile:
    content = await upload_file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="File is empty")

    file_id = str(uuid4())
    suffix = Path(upload_file.filename or "").suffix
    stored_name = f"{file_id}{suffix}"
    stored_path = STORAGE_DIR / stored_name
    stored_path.write_bytes(content)

    file_item = StoredFile(
        id=file_id,
        title=title,
        original_name=upload_file.filename or stored_name,
        stored_name=stored_name,
        mime_type=upload_file.content_type or mimetypes.guess_type(stored_name)[
            0] or "application/octet-stream",
        size=len(content),
        processing_status="uploaded",
    )
    db.add(file_item)
    try:
        await db.commit()
        await db.refresh(file_item)
    except Exception:
        await db.rollback()
        if stored_path.exists():
            stored_path.unlink()
        raise
    return file_item


async def update_file(db: AsyncSession, file_id: str, title: str) -> StoredFile:
    file_item = await db.get(StoredFile, file_id)
    if not file_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="File not found")
    file_item.title = title
    await db.commit()
    await db.refresh(file_item)
    return file_item


async def delete_file(db: AsyncSession, file_id: str) -> None:
    file_item = await db.get(StoredFile, file_id)
    if not file_item:
        raise HTTPException(status_code=404)
    stored_name = file_item.stored_name

    await db.delete(file_item)
    await db.commit()
    stored_path = STORAGE_DIR / stored_name
    if stored_path.exists():
        stored_path.unlink()


async def get_file_path(db: AsyncSession, file_id: str) -> tuple[StoredFile, Path]:
    file_item = await get_file(db=db, file_id=file_id)
    stored_path = STORAGE_DIR / file_item.stored_name
    if not stored_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Stored file not found")
    return file_item, stored_path


async def mark_file_processing_failed(db: AsyncSession, file_id: str,
                                      details: str) -> StoredFile:
    file_item = await db.get(StoredFile, file_id)
    if not file_item:
        raise HTTPException(status_code=404, detail="File not found")

    file_item.processing_status = "failed"
    file_item.scan_status = "failed"
    file_item.scan_details = details[:500]
    file_item.requires_attention = True

    await db.commit()
    await db.refresh(file_item)
    return file_item
