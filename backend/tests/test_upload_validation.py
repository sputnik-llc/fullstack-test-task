import os

import pytest
from fastapi import HTTPException

os.environ.setdefault("POSTGRES_USER", "postgres")
os.environ.setdefault("POSTGRES_PASSWORD", "postgres")
os.environ.setdefault("POSTGRES_HOST", "localhost")
os.environ.setdefault("PGPORT", "5432")
os.environ.setdefault("POSTGRES_DB", "test")

from src.service import _normalize_extension, _validate_upload_type


def test_normalize_extension_uses_lowercase_suffix() -> None:
    assert _normalize_extension("Report.PDF") == "pdf"


def test_validate_upload_type_rejects_unknown_extension() -> None:
    with pytest.raises(HTTPException) as exception_info:
        _validate_upload_type("payload.exe", "application/octet-stream")

    assert exception_info.value.status_code == 400


def test_validate_upload_type_rejects_unsupported_mime() -> None:
    with pytest.raises(HTTPException) as exception_info:
        _validate_upload_type("report.pdf", "application/xml")

    assert exception_info.value.status_code == 400
