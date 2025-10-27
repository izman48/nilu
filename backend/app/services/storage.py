"""
Storage service abstraction for handling file uploads.
Supports both local filesystem and Firebase Storage.
"""
import os
import uuid
from typing import Optional, Tuple
from abc import ABC, abstractmethod
from app.core.config import settings

# Try to import Firebase, but don't fail if not available
try:
    import firebase_admin
    from firebase_admin import credentials, storage as firebase_storage
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    firebase_admin = None


class StorageService(ABC):
    """Abstract base class for storage services"""

    @abstractmethod
    async def upload_file(
        self,
        file_content: bytes,
        filename: str,
        folder: str = "general"
    ) -> str:
        """
        Upload a file and return its URL/path

        Args:
            file_content: The file content as bytes
            filename: Original filename
            folder: Folder/directory to store the file in

        Returns:
            str: URL or path to the uploaded file
        """
        pass

    @abstractmethod
    async def delete_file(self, file_path: str) -> bool:
        """
        Delete a file

        Args:
            file_path: Path or URL of the file to delete

        Returns:
            bool: True if successful, False otherwise
        """
        pass


class LocalStorageService(StorageService):
    """Local filesystem storage service"""

    async def upload_file(
        self,
        file_content: bytes,
        filename: str,
        folder: str = "general"
    ) -> str:
        """Upload file to local filesystem"""
        # Get file extension
        _, ext = os.path.splitext(filename)

        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}{ext}"

        # Create upload directory if it doesn't exist
        upload_dir = os.path.join(settings.UPLOAD_DIR, folder)
        os.makedirs(upload_dir, exist_ok=True)

        # Full file path
        file_path = os.path.join(upload_dir, unique_filename)

        # Save file
        with open(file_path, "wb") as f:
            f.write(file_content)

        return file_path

    async def delete_file(self, file_path: str) -> bool:
        """Delete file from local filesystem"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
            return False


class FirebaseStorageService(StorageService):
    """Firebase Cloud Storage service"""

    def __init__(self):
        """Initialize Firebase if not already initialized"""
        if not FIREBASE_AVAILABLE:
            raise ImportError(
                "Firebase Admin SDK is not installed. "
                "Install it with: pip install firebase-admin"
            )

        # Initialize Firebase app if not already done
        if not firebase_admin._apps:
            if not settings.FIREBASE_CREDENTIALS_PATH or not settings.FIREBASE_STORAGE_BUCKET:
                raise ValueError(
                    "Firebase credentials path and storage bucket must be set in .env file. "
                    "Set FIREBASE_CREDENTIALS_PATH and FIREBASE_STORAGE_BUCKET"
                )

            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred, {
                'storageBucket': settings.FIREBASE_STORAGE_BUCKET
            })

        self.bucket = firebase_storage.bucket()

    async def upload_file(
        self,
        file_content: bytes,
        filename: str,
        folder: str = "general"
    ) -> str:
        """Upload file to Firebase Storage"""
        # Get file extension
        _, ext = os.path.splitext(filename)

        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}{ext}"

        # Create blob path
        blob_path = f"{folder}/{unique_filename}"

        # Upload to Firebase
        blob = self.bucket.blob(blob_path)
        blob.upload_from_string(file_content)

        # Make the blob publicly accessible
        blob.make_public()

        # Return public URL
        return blob.public_url

    async def delete_file(self, file_path: str) -> bool:
        """Delete file from Firebase Storage"""
        try:
            # Extract blob name from URL if it's a full URL
            if file_path.startswith('http'):
                # Parse the blob name from the URL
                # Firebase URLs are like: https://storage.googleapis.com/bucket/path/to/file.jpg
                parts = file_path.split(f"{settings.FIREBASE_STORAGE_BUCKET}/")
                if len(parts) > 1:
                    blob_name = parts[1].split('?')[0]  # Remove query params if any
                else:
                    return False
            else:
                blob_name = file_path

            blob = self.bucket.blob(blob_name)
            blob.delete()
            return True
        except Exception as e:
            print(f"Error deleting file from Firebase {file_path}: {e}")
            return False


def get_storage_service() -> StorageService:
    """
    Factory function to get the appropriate storage service
    based on configuration.

    Returns:
        StorageService: Either FirebaseStorageService or LocalStorageService
    """
    if settings.USE_FIREBASE_STORAGE:
        if not FIREBASE_AVAILABLE:
            print(
                "WARNING: Firebase storage is enabled but firebase-admin is not installed. "
                "Falling back to local storage."
            )
            return LocalStorageService()

        try:
            return FirebaseStorageService()
        except (ValueError, Exception) as e:
            print(
                f"WARNING: Failed to initialize Firebase storage: {e}. "
                "Falling back to local storage."
            )
            return LocalStorageService()

    return LocalStorageService()


# Global storage service instance
storage_service = get_storage_service()
