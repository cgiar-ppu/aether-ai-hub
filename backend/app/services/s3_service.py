from datetime import datetime
from typing import Any, Dict, List

import boto3

from app.config import settings
from app.models import FileMetadata


class S3Service:
    """Service for S3 file operations with presigned URLs."""

    def __init__(self) -> None:
        self._client = boto3.client("s3", region_name=settings.AWS_REGION)

    async def generate_presigned_upload(
        self,
        user_id: str,
        filename: str,
        content_type: str,
    ) -> Dict[str, Any]:
        """Generate a presigned POST URL for file upload."""
        key = f"users/{user_id}/files/{filename}"
        response = self._client.generate_presigned_post(
            Bucket=settings.S3_BUCKET_USER_DATA,
            Key=key,
            Fields={"Content-Type": content_type},
            Conditions=[
                {"Content-Type": content_type},
                ["content-length-range", 1, 104857600],  # 1 byte to 100 MB
            ],
            ExpiresIn=3600,
        )
        return {"url": response["url"], "fields": response["fields"], "key": key}

    async def generate_presigned_download(self, key: str) -> str:
        """Generate a presigned GET URL for file download."""
        url = self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.S3_BUCKET_USER_DATA, "Key": key},
            ExpiresIn=3600,
        )
        return url

    async def list_user_files(self, user_id: str) -> List[FileMetadata]:
        """List all files for a user under their S3 prefix."""
        prefix = f"users/{user_id}/files/"
        response = self._client.list_objects_v2(
            Bucket=settings.S3_BUCKET_USER_DATA,
            Prefix=prefix,
        )

        files: List[FileMetadata] = []
        for obj in response.get("Contents", []):
            key = obj["Key"]
            name = key.removeprefix(prefix)
            if not name:
                continue
            files.append(
                FileMetadata(
                    key=key,
                    name=name,
                    size=obj["Size"],
                    content_type="application/octet-stream",
                    uploaded_at=obj["LastModified"],
                    user_id=user_id,
                )
            )

        return files

    async def delete_file(self, key: str) -> bool:
        """Delete a file from S3."""
        self._client.delete_object(
            Bucket=settings.S3_BUCKET_USER_DATA,
            Key=key,
        )
        return True


s3_service = S3Service()
