import { Badge, Button, Card, Spinner, Table } from "react-bootstrap";

import { formatDate, getLevelVariant } from "../format";
import type { AlertItem } from "../types";

type AlertsTableProps = {
  alerts: AlertItem[];
  alertsTotal: number;
  alertsOffset: number;
  pageLimit: number;
  isLoading: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function AlertsTable({
  alerts,
  alertsTotal,
  alertsOffset,
  pageLimit,
  isLoading,
  onPrevious,
  onNext,
}: AlertsTableProps) {
  return (
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
                onClick={onPrevious}
              >
                Prev
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={alertsOffset + pageLimit >= alertsTotal}
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
