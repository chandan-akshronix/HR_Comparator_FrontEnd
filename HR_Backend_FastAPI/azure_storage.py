# azure_storage.py - Azure Blob Storage Service (OPTIONAL)
# 
# NOTE: With the 10-resume limit and GridFS, Azure Storage is NOT NEEDED!
# This file is kept for reference if you want to use external storage.
#
# Current Implementation: Files stored in MongoDB GridFS
# - Free users: Max 10 resumes × 5MB = 50MB total
# - GridFS is perfect for small-to-medium file storage
# - No external storage configuration needed
#
# Use this file only if:
# - You want to scale beyond 100MB per user
# - You need CDN integration
# - You require geo-distributed storage
# - You want to use Azure-specific features

from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class AzureStorageService:
    """
    OPTIONAL: Azure Blob Storage Service
    
    NOT REQUIRED for this project due to:
    - 10-resume limit (max 50MB)
    - GridFS handles small files efficiently
    - Simpler deployment without external storage
    """
    
    def __init__(self):
        # Check if Azure Storage is configured
        self.connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        
        if not self.connection_string:
            print("ℹ️  Azure Storage not configured (not required)")
            print("📦 Using MongoDB GridFS for file storage")
            self.enabled = False
            return
        
        try:
            from azure.storage.blob import BlobServiceClient
            self.blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
            self.container_name = os.getenv("AZURE_STORAGE_CONTAINER_NAME", "hr-resumes")
            self.enabled = True
            print("✅ Azure Storage Service initialized (optional)")
        except ImportError:
            print("⚠️  azure-storage-blob not installed")
            print("📦 Using MongoDB GridFS for file storage")
            self.enabled = False
        except Exception as e:
            print(f"⚠️  Azure Storage initialization failed: {e}")
            print("📦 Using MongoDB GridFS for file storage")
            self.enabled = False

# Try to initialize Azure Storage (optional)
try:
    azure_storage = AzureStorageService()
    if not azure_storage.enabled:
        azure_storage = None
except Exception as e:
    print(f"ℹ️  Azure Storage not available: {e}")
    print("📦 Using MongoDB GridFS for file storage (recommended)")
    azure_storage = None

# Export None if not configured (GridFS will be used instead)
__all__ = ['azure_storage']
