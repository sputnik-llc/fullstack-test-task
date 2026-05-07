import { FormEvent } from "react";
import { Button, Form, Modal } from "react-bootstrap";

type Props = {
  show: boolean;
  isSubmitting: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onTitleChange: (value: string) => void;
  onFileChange: (value: File | null) => void;
};

export function UploadFileModal({
  show,
  isSubmitting,
  title,
  onClose,
  onSubmit,
  onTitleChange,
  onFileChange,
}: Props) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Form onSubmit={(event) => void onSubmit(event)}>
        <Modal.Header closeButton>
          <Modal.Title>Добавить файл</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Название</Form.Label>
            <Form.Control
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Например, Договор с подрядчиком"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Файл</Form.Label>
            <Form.Control
              type="file"
              onChange={(event) =>
                onFileChange((event.target as HTMLInputElement).files?.[0] ?? null)
              }
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Загрузка..." : "Сохранить"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
