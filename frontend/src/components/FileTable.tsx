import { Badge, Button, Card, Spinner, Table } from "react-bootstrap";

import { formatDate, formatSize, getProcessingVariant } from "../format";
import type { FileItem } from "../types";

type FileTableProps = {
  files: FileItem[];
  filesTotal: number;
  filesOffset: number;
  pageLimit: number;
  isLoading: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function FileTable({
  files,
  filesTotal,
  filesOffset,
  pageLimit,
  isLoading,
  onPrevious,
  onNext,
}: FileTableProps) {
  return (
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
                onClick={onPrevious}
              >
                Prev
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={filesOffset + pageLimit >= filesTotal}
                onClick={onNext}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
