from fastapi import APIRouter, Query
from fastapi import File, Form, UploadFile
from starlette.responses import FileResponse

from src.schemas.files import FileItem, FileUpdate, FilesPage
from src.service.files import get_file_path
from src.service.files import list_files, create_file, get_file, update_file, \
    delete_file
from src.tasks.file_tasks import scan_file_for_threats

router = APIRouter(prefix="/files", tags=["files"])


@router.get("", response_model=FilesPage)
async def list_files_view(
        limit: int = Query(20, ge=1, le=100),
        offset: int = Query(0, ge=0),
):
    files, total = await list_files(limit=limit, offset=offset)

    return FilesPage(
        items=[FileItem.model_validate(file) for file in files],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=FileItem, status_code=201)
async def create_file_view(
        title: str = Form(...),
        file: UploadFile = File(...)):
    file_item = await create_file(title=title, upload_file=file)
    scan_file_for_threats.delay(file_item.id)
    return file_item


@router.get("/{file_id}", response_model=FileItem)
async def get_file_view(file_id: str):
    return await get_file(file_id)


@router.patch("/{file_id}", response_model=FileItem)
async def update_file_view(
        file_id: str,
        payload: FileUpdate,
):
    return await update_file(file_id=file_id, title=payload.title)


@router.get("/{file_id}/download")
async def download_file(file_id: str):
    file_item, stored_path = await get_file_path(file_id)

    return FileResponse(
        path=stored_path,
        media_type=file_item.mime_type,
        filename=file_item.original_name,
    )


@router.delete("/{file_id}", status_code=204)
async def delete_file_view(file_id: str):
    await delete_file(file_id)
