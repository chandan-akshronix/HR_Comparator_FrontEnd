# gridfs_storage.py - MongoDB GridFS File Storage
"""
Simple file storage using MongoDB GridFS

Why GridFS?
- 10 resume limit × 5MB = 50MB total storage
- Perfect for small-to-medium files
- No external storage dependencies
- Built into MongoDB
- Simple to use and deploy
"""

from database import fs, db
from bson import ObjectId
from typing import Optional, BinaryIO
import hashlib

def upload_file(file_content: bytes, filename: str, content_type: str, 
                metadata: dict = None) -> str:
    """
    Upload file to MongoDB GridFS
    
    Args:
        file_content: File content as bytes
        filename: Original filename
        content_type: MIME type
        metadata: Additional metadata dict
    
    Returns:
        GridFS file ID as string
    """
    file_id = fs.put(
        file_content,
        filename=filename,
        content_type=content_type,
        metadata=metadata or {}
    )
    return str(file_id)

def download_file(file_id: str) -> tuple[bytes, str, str]:
    """
    Download file from MongoDB GridFS
    
    Args:
        file_id: GridFS file ID
    
    Returns:
        Tuple of (file_content, filename, content_type)
    """
    try:
        grid_out = fs.get(ObjectId(file_id))
        return (
            grid_out.read(),
            grid_out.filename,
            grid_out.content_type
        )
    except Exception as e:
        raise FileNotFoundError(f"File not found: {e}")

def delete_file(file_id: str) -> bool:
    """
    Delete file from MongoDB GridFS
    
    Args:
        file_id: GridFS file ID
    
    Returns:
        True if deleted successfully
    """
    try:
        fs.delete(ObjectId(file_id))
        return True
    except Exception:
        return False

def file_exists(file_id: str) -> bool:
    """Check if file exists in GridFS"""
    try:
        fs.get(ObjectId(file_id))
        return True
    except Exception:
        return False

def calculate_checksum(file_content: bytes) -> str:
    """Calculate SHA-256 checksum for file"""
    return hashlib.sha256(file_content).hexdigest()

def get_storage_stats() -> dict:
    """Get GridFS storage statistics"""
    # Get all files
    files = list(fs.find())
    total_size = sum(f.length for f in files)
    file_count = len(files)
    
    return {
        "total_files": file_count,
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / (1024 * 1024), 2)
    }

def list_user_files(user_id: str) -> list:
    """List all files uploaded by a user"""
    files = fs.find({"metadata.uploaded_by": user_id})
    return [
        {
            "file_id": str(f._id),
            "filename": f.filename,
            "content_type": f.content_type,
            "size": f.length,
            "upload_date": f.upload_date,
            "metadata": f.metadata
        }
        for f in files
    ]

