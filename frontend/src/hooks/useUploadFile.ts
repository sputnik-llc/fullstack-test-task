import { FormEvent, useState } from "react";

import { apiRequest } from "../lib/api";

type UploadState = {
  isSubmitting: boolean;
  submitError: string | null;
};

export function useUploadFile(onUploadSuccess: () => Promise<void>) {
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    isSubmitting: false,
    submitError: null,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !selectedFile) {
      setUploadState({ isSubmitting: false, submitError: "Укажите название и выберите файл" });
      return;
    }

    setUploadState({ isSubmitting: true, submitError: null });
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("file", selectedFile);

    try {
      await apiRequest("/files", { method: "POST", body: formData });
      setTitle("");
      setSelectedFile(null);
      await onUploadSuccess();
    } catch (error) {
      setUploadState({
        isSubmitting: false,
        submitError: error instanceof Error ? error.message : "Произошла ошибка",
      });
      return;
    }

    setUploadState({ isSubmitting: false, submitError: null });
  }

  return {
    title,
    setTitle,
    selectedFile,
    setSelectedFile,
    ...uploadState,
    handleSubmit,
  };
}
