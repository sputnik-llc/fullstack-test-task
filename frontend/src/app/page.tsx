"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

type FileItem = {
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

type AlertItem = {
  id: number;
  file_id: string;
  level: string;
  message: string;
  created_at: string;
};

const PAGE_LIMIT = 20;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getLevelVariant(level: string) {
  if (level === "critical") {
    return "danger";
  }

  if (level === "warning") {
    return "warning";
  }

  return "success";
}

function getProcessingVariant(status: string) {
  if (status === "failed") {
    return "danger";
  }

  if (status === "processing") {
    return "warning";
  }

  if (status === "processed") {
    return "success";
  }

  return "secondary";
}

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
      const [filesResponse, alertsResponse] = await Promise.all([
        fetch(`http://localhost:8000/files?limit=${PAGE_LIMIT}&offset=${nextFilesOffset}`, { cache: "no-store" }),
        fetch(`http://localhost:8000/alerts?limit=${PAGE_LIMIT}&offset=${nextAlertsOffset}`, { cache: "no-store" }),
      ]);

      if (!filesResponse.ok || !alertsResponse.ok) {
        throw new Error("Не удалось загрузить данные");
      }

      const filesData = await filesResponse.json() as PaginatedResponse<FileItem>;
      const alertsData = await alertsResponse.json() as PaginatedResponse<AlertItem>;

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
      const response = await fetch(`http://localhost:8000/files`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Не удалось загрузить файл");
      }

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

          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white border-0 pt-4 px-4">
              <div className="d-flex justify-content-between align-items-center">
                <h2 className="h5 mb-0">Файлы</h2>
                <Badge bg="secondary">{files.length} / {filesTotal}</Badge>
              </div>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              {isLoading ? (
                <div className="d-flex justify-content-center py-5">
                  <Spinner animation="border" />
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover bordered className="align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Название</th>
                        <th>Файл</th>
                        <th>MIME</th>
                        <th>Размер</th>
                        <th>Статус</th>
                        <th>Проверка</th>
                        <th>Создан</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-4 text-secondary">
                            Файлы пока не загружены
                          </td>
                        </tr>
                      ) : (
                        files.map((file) => (
                          <tr key={file.id}>
                            <td>
                              <div className="fw-semibold">{file.title}</div>
                              <div className="small text-secondary">{file.id}</div>
                            </td>
                            <td>{file.original_name}</td>
                            <td>{file.mime_type}</td>
                            <td>{formatSize(file.size)}</td>
                            <td>
                              <Badge bg={getProcessingVariant(file.processing_status)}>
                                {file.processing_status}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex flex-column gap-1">
                                <Badge bg={file.requires_attention ? "warning" : "success"}>
                                  {file.scan_status ?? "pending"}
                                </Badge>
                                <span className="small text-secondary">
                                  {file.scan_details ?? "Ожидает обработки"}
                                </span>
                              </div>
                            </td>
                            <td>{formatDate(file.created_at)}</td>
                            <td className="text-nowrap">
                              <Button
                                as="a"
                                href={`http://localhost:8000/files/${file.id}/download`}
                                variant="outline-primary"
                                size="sm"
                              >
                                Скачать
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                  <div className="d-flex justify-content-end gap-2 mt-3">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      disabled={filesOffset === 0}
                      onClick={() => void loadData(Math.max(filesOffset - PAGE_LIMIT, 0), alertsOffset)}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      disabled={filesOffset + PAGE_LIMIT >= filesTotal}
                      onClick={() => void loadData(filesOffset + PAGE_LIMIT, alertsOffset)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0 pt-4 px-4">
              <div className="d-flex justify-content-between align-items-center">
                <h2 className="h5 mb-0">Алерты</h2>
                <Badge bg="secondary">{alerts.length} / {alertsTotal}</Badge>
              </div>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              {isLoading ? (
                <div className="d-flex justify-content-center py-5">
                  <Spinner animation="border" />
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover bordered className="align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>File ID</th>
                        <th>Уровень</th>
                        <th>Сообщение</th>
                        <th>Создан</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-secondary">
                            Алертов пока нет
                          </td>
                        </tr>
                      ) : (
                        alerts.map((item) => (
                          <tr key={item.id}>
                            <td>{item.id}</td>
                            <td className="small">{item.file_id}</td>
                            <td>
                              <Badge bg={getLevelVariant(item.level)}>{item.level}</Badge>
                            </td>
                            <td>{item.message}</td>
                            <td>{formatDate(item.created_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                  <div className="d-flex justify-content-end gap-2 mt-3">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      disabled={alertsOffset === 0}
                      onClick={() => void loadData(filesOffset, Math.max(alertsOffset - PAGE_LIMIT, 0))}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      disabled={alertsOffset + PAGE_LIMIT >= alertsTotal}
                      onClick={() => void loadData(filesOffset, alertsOffset + PAGE_LIMIT)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>Добавить файл</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Название</Form.Label>
              <Form.Control
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Например, Договор с подрядчиком"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Файл</Form.Label>
              <Form.Control
                type="file"
                onChange={(event) =>
                  setSelectedFile((event.target as HTMLInputElement).files?.[0] ?? null)
                }
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Загрузка..." : "Сохранить"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
