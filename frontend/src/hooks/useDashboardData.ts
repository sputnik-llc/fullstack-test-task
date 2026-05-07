import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "../lib/api";
import { AlertItem, FileItem } from "../types/dashboard";

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
