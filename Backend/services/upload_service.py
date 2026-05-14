import os
import uuid
from typing import List, Dict
from fastapi import UploadFile, HTTPException


UPLOAD_DIR = "uploads"
MAX_FILES = 10

ALLOWED_TYPES = [
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]


class UploadService:

    def __init__(self):
        os.makedirs(UPLOAD_DIR, exist_ok=True)

    async def upload_documents(self, files: List[UploadFile]) -> List[Dict]:
        """
        Upload multiple files without processing
        """

        if not files:
            raise HTTPException(status_code=400, detail="No files uploaded")

        if len(files) > MAX_FILES:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum {MAX_FILES} files allowed"
            )

        uploaded_files = []

        for file in files:
            self._validate_file(file)

            file_id = str(uuid.uuid4())
            safe_name = file.filename.replace(" ", "_")
            file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{safe_name}")

            # Save file
            content = await file.read()

            with open(file_path, "wb") as f:
                f.write(content)

            uploaded_files.append({
                "file_id": file_id,
                "filename": file.filename,
                "content_type": file.content_type,
                "path": file_path,
                "size_bytes": len(content)
            })

        return uploaded_files

    def _validate_file(self, file: UploadFile):
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}"
            )

        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="File must have a name"
            )
        