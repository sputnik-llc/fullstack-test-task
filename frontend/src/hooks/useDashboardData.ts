import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "../lib/api";

export type FileItem = {
  id: string;
  title: string;
  original_name: string;
  mime_type: string;
  size: number;
  processing_status: string;
  scan_status: string | null;
  scan_details: string | null;
  metadata_json: Record<string, unknown> | null;
  requires_attention: boolean;
  created_at: string;
  updated_at: string;
};

export type AlertItem = {
  id: number;
  file_id: string;
  level: string;
  message: string;
  created_at: string;
};

const PAGE_SIZE = 50;

export function useDashboardData() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [filesData, alertsData] = await Promise.all([
        apiRequest<FileItem[]>("/files", { query: { limit: PAGE_SIZE, offset: 0 } }),
        apiRequest<AlertItem[]>("/alerts", { query: { limit: PAGE_SIZE, offset: 0 } }),
      ]);
      setFiles(filesData);
      setAlerts(alertsData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return {
    files,
    alerts,
    isLoading,
    errorMessage,
    loadData,
  };
}
