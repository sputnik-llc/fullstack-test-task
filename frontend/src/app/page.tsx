"use client";

import { FormEvent, useEffect, useState } from "react";
import { Alert, Button, Card, Col, Container, Row } from "react-bootstrap";

import { fetchAlerts, fetchFiles, uploadFile } from "../api";
import { AlertsTable } from "../components/AlertsTable";
import { FileTable } from "../components/FileTable";
import { UploadFileModal } from "../components/UploadFileModal";
import type { AlertItem, FileItem } from "../types";

const PAGE_LIMIT = 20;

export default function Page() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filesTotal, setFilesTotal] = useState(0);
  const [alertsTotal, setAlertsTotal] = useState(0);
  const [filesOffset, setFilesOffset] = useState(0);
  const [alertsOffset, setAlertsOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadData(nextFilesOffset = filesOffset, nextAlertsOffset = alertsOffset) {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [filesData, alertsData] = await Promise.all([
        fetchFiles(PAGE_LIMIT, nextFilesOffset),
        fetchAlerts(PAGE_LIMIT, nextAlertsOffset),
      ]);

      setFiles(filesData.items);
      setAlerts(alertsData.items);
      setFilesTotal(filesData.total);
      setAlertsTotal(alertsData.total);
      setFilesOffset(filesData.offset);
      setAlertsOffset(alertsData.offset);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !selectedFile) {
      setErrorMessage("Укажите название и выберите файл");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("file", selectedFile);

    try {
      await uploadFile(formData);
      setShowModal(false);
      setTitle("");
      setSelectedFile(null);
      await loadData(0, 0);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Произошла ошибка");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Container fluid className="py-4 px-4 bg-light min-vh-100">
      <Row className="justify-content-center">
        <Col xxl={10} xl={11}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                <div>
                  <h1 className="h3 mb-2">Управление файлами</h1>
                  <p className="text-secondary mb-0">
                    Загрузка файлов, просмотр статусов обработки и ленты алертов.
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" onClick={() => void loadData()}>
                    Обновить
                  </Button>
                  <Button variant="primary" onClick={() => setShowModal(true)}>
                    Добавить файл
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>

          {errorMessage ? (
            <Alert variant="danger" className="shadow-sm">
              {errorMessage}
            </Alert>
          ) : null}

          <FileTable
            files={files}
            filesTotal={filesTotal}
            filesOffset={filesOffset}
            pageLimit={PAGE_LIMIT}
            isLoading={isLoading}
            onPrevious={() => void loadData(Math.max(filesOffset - PAGE_LIMIT, 0), alertsOffset)}
            onNext={() => void loadData(filesOffset + PAGE_LIMIT, alertsOffset)}
          />

          <AlertsTable
            alerts={alerts}
            alertsTotal={alertsTotal}
            alertsOffset={alertsOffset}
            pageLimit={PAGE_LIMIT}
            isLoading={isLoading}
            onPrevious={() => void loadData(filesOffset, Math.max(alertsOffset - PAGE_LIMIT, 0))}
            onNext={() => void loadData(filesOffset, alertsOffset + PAGE_LIMIT)}
          />
        </Col>
      </Row>

      <UploadFileModal
        show={showModal}
        title={title}
        isSubmitting={isSubmitting}
        onHide={() => setShowModal(false)}
        onSubmit={handleSubmit}
        onTitleChange={setTitle}
        onFileChange={setSelectedFile}
      />
    </Container>
  );
}
