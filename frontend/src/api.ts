import type { AlertItem, FileItem, PaginatedResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchFiles(limit: number, offset: number) {
  const response = await fetch(`${API_BASE_URL}/files?limit=${limit}&offset=${offset}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Не удалось загрузить данные");
  }

  return await response.json() as PaginatedResponse<FileItem>;
}

export async function fetchAlerts(limit: number, offset: number) {
  const response = await fetch(`${API_BASE_URL}/alerts?limit=${limit}&offset=${offset}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Не удалось загрузить данные");
  }

  return await response.json() as PaginatedResponse<AlertItem>;
}

export async function uploadFile(formData: FormData) {
  const response = await fetch(`${API_BASE_URL}/files`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Не удалось загрузить файл");
  }

  return await response.json() as FileItem;
}
