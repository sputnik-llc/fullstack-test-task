from celery import chain
from celery.exceptions import CeleryError
from fastapi import APIRouter, Query, Depends
from fastapi import File, Form, UploadFile
from kombu.exceptions import KombuError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import FileResponse

from src.db.session import get_db
from src.schemas.files import FileItem, FileUpdate, FilesPage
from src.service.files import get_file_path, mark_file_processing_failed
from src.service.files import list_files, create_file, get_file, update_file, \
    delete_file
from src.tasks.file_tasks import scan_file_for_threats, extract_file_metadata, \
    send_file_alert

router = APIRouter(prefix="/files", tags=["files"])


@router.get("", response_model=FilesPage)
async def list_files_view(
        limit: int = Query(20, ge=1, le=100),
        offset: int = Query(0, ge=0),
        db: AsyncSession = Depends(get_db)
):
    files, total = await list_files(db=db, limit=limit, offset=offset)

    return FilesPage(
        items=[FileItem.model_validate(file) for file in files],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=FileItem, status_code=201)
async def create_file_view(
        title: str = Form(...),
        file: UploadFile = File(...),
        db: AsyncSession = Depends(get_db)):
    file_item = await create_file(db=db, title=title, upload_file=file)
    try:
        workflow = chain(
            scan_file_for_threats.s(file_item.id),
            extract_file_metadata.s(file_item.id),
            send_file_alert.s(file_item.id)
        )
        workflow.apply_async()
    except (CeleryError, KombuError):
        file_item = await mark_file_processing_failed(
            db=db,
            file_id=file_item.id,
            details="Failed to enqueue file processing task",
        )
    return file_item


@router.get("/{file_id}", response_model=FileItem)
async def get_file_view(file_id: str, db: AsyncSession = Depends(get_db)):
    return await get_file(db=db, file_id=file_id)


@router.patch("/{file_id}", response_model=FileItem)
async def update_file_view(
        file_id: str,
        payload: FileUpdate,
        db: AsyncSession = Depends(get_db)
):
    return await update_file(db=db, file_id=file_id, title=payload.title)


@router.get("/{file_id}/download")
async def download_file(file_id: str, db: AsyncSession = Depends(get_db)):
    file_item, stored_path = await get_file_path(db=db, file_id=file_id)
    return FileResponse(
        path=stored_path,
        media_type=file_item.mime_type,
        filename=file_item.original_name,
    )


@router.delete("/{file_id}", status_code=204)
async def delete_file_view(file_id: str, db: AsyncSession = Depends(get_db)):
    await delete_file(db=db, file_id=file_id)
