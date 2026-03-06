from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.auth.middleware import get_current_user
from app.models import FileMetadata, User
from app.models.schemas import FileUploadRequest
from app.services.s3_service import s3_service

router = APIRouter(prefix="/api/files", tags=["files"])


@router.post("/upload")
async def upload_file(
    body: FileUploadRequest,
    user: User = Depends(get_current_user),
):
    """Generate a presigned URL for uploading a file to S3.

    The client uses the returned URL and fields to POST the file directly to S3.
    """
    result = await s3_service.generate_presigned_upload(
        user.id, body.filename, body.content_type
    )
    return result


@router.get("/", response_model=List[FileMetadata])
async def list_files(user: User = Depends(get_current_user)):
    """List all files uploaded by the current user."""
    files = await s3_service.list_user_files(user.id)
    return files


@router.get("/{file_key:path}/download")
async def download_file(
    file_key: str,
    user: User = Depends(get_current_user),
):
    """Generate a presigned download URL for a specific file.

    Verifies that the file belongs to the requesting user.
    """
    if not file_key.startswith(f"users/{user.id}/"):
        raise HTTPException(status_code=403, detail="Not authorized")

    url = await s3_service.generate_presigned_download(file_key)
    return {"download_url": url}


@router.delete("/{file_key:path}")
async def delete_file(
    file_key: str,
    user: User = Depends(get_current_user),
):
    """Delete a file from S3.

    Verifies that the file belongs to the requesting user.
    """
    if not file_key.startswith(f"users/{user.id}/"):
        raise HTTPException(status_code=403, detail="Not authorized")

    await s3_service.delete_file(file_key)
    return {"status": "deleted", "key": file_key}
