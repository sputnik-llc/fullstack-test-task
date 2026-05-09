from celery import chain
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from src.schemas import AlertItem, FileItem, FileUpdate
from src.service import (
    create_file,
    delete_file,
    get_file,
    get_file_for_download,
    list_alerts,
    list_files,
    update_file,
)
from src.tasks import extract_file_metadata, scan_file_for_threats, send_file_alert

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/files", response_model=list[FileItem])
async def list_files_view():
    return await list_files()


@app.get("/alerts", response_model=list[AlertItem])
async def list_alerts_view():
    return await list_alerts()


@app.post("/files", response_model=FileItem, status_code=201)
async def create_file_view(
    title: str = Form(...),
    file: UploadFile = File(...),
):
    file_item = await create_file(title=title, upload_file=file)
    chain(
        scan_file_for_threats.si(file_item.id),
        extract_file_metadata.si(file_item.id),
        send_file_alert.si(file_item.id),
    ).delay()
    return file_item


@app.get("/files/{file_id}", response_model=FileItem)
async def get_file_view(file_id: str):
    return await get_file(file_id)


@app.patch("/files/{file_id}", response_model=FileItem)
async def update_file_view(
    file_id: str,
    payload: FileUpdate,
):
    return await update_file(file_id=file_id, title=payload.title)


@app.get("/files/{file_id}/download")
async def download_file_view(file_id: str):
    file_item, stored_path = await get_file_for_download(file_id)
    return FileResponse(
        path=stored_path,
        media_type=file_item.mime_type,
        filename=file_item.original_name,
    )


@app.delete("/files/{file_id}", status_code=204)
async def delete_file_view(file_id: str):
    await delete_file(file_id)
