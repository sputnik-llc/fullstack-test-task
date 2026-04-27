export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function getLevelVariant(level: string) {
  if (level === "critical") {
    return "danger";
  }

  if (level === "warning") {
    return "warning";
  }

  return "success";
}

export function getProcessingVariant(status: string) {
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
