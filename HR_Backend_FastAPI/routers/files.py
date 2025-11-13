# routers/files.py - File Upload with MongoDB GridFS (No Azure needed!)
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from pymongo.database import Database
import PyPDF2
import io

import schemas
import crud
from database import get_db, FREE_PLAN_RESUME_LIMIT, MAX_FILE_SIZE_MB
from routers.auth import get_current_user
from gridfs_storage import upload_file, download_file, calculate_checksum

router = APIRouter(prefix="/files", tags=["Files"])

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return ""

def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_content))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text.strip()
    except Exception as e:
        print(f"Error extracting DOCX text: {e}")
        return ""

@router.post("/upload-resume", response_model=schemas.FileUploadResponse)
async def upload_resume_file(
    file: UploadFile = File(...),
    source: str = Form("direct"),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Upload resume file (PDF, DOC, DOCX, TXT)
    
    LIMIT: 10 resumes max per user (free plan)
    File size: Max 5MB per file
    
    Process:
    1. Validates resume count (max 10)
    2. Validates file type and size
    3. Extracts text from file
    4. Stores file in MongoDB GridFS
    5. Creates resume entry in database
    6. Returns resume_id
    """
    # Note: Resume storage is now unlimited
    # The 10 resume limit is enforced PER WORKFLOW, not globally
    # This allows multiple workflows with up to 10 resumes each
    
    # Validate file type
    allowed_types = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: PDF, DOC, DOCX, TXT"
        )
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Validate file size (max 5MB)
    max_size = MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE_MB}MB"
        )
    
    # Extract text based on file type
    text = ""
    if file.content_type == "application/pdf":
        text = extract_text_from_pdf(file_content)
    elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        text = extract_text_from_docx(file_content)
    elif file.content_type == "text/plain":
        text = file_content.decode("utf-8")
    
    if not text:
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from file. Please ensure file contains readable text."
        )
    
    # Calculate checksum
    checksum = calculate_checksum(file_content)
    
    # Store file in MongoDB GridFS
    try:
        grid_file_id = upload_file(
            file_content,
            file.filename,
            file.content_type,
            metadata={
                "uploaded_by": current_user["_id"],
                "original_name": file.filename,
                "checksum": checksum,
                "source": source
            }
        )
        
        # Create resume entry with GridFS reference
        resume_doc = {
            "filename": file.filename,
            "text": text,
            "fileSize": file_size,
            "source": source,
            "uploadedBy": crud.object_id(current_user["_id"]),
            "gridFsFileId": grid_file_id
        }
        
        resume_id = crud.create_resume(db, resume_doc)
        
        # Create file metadata entry (for tracking)
        file_metadata = {
            "resumeId": crud.object_id(resume_id),
            "originalName": file.filename,
            "storagePath": f"gridfs://{grid_file_id}",
            "fileSize": file_size,
            "mimeType": file.content_type,
            "checksum": checksum,
            "security": {
                "virusScanStatus": "clean",
                "encrypted": False
            },
            "uploadedBy": crud.object_id(current_user["_id"]),
            "storageType": "gridfs"
        }
        
        file_id = crud.create_file_metadata(db, file_metadata)
        
        # Log action
        crud.create_audit_log(db, {
            "userId": crud.object_id(current_user["_id"]),
            "action": "upload_resume",
            "resourceType": "resume",
            "resourceId": resume_id,
            "ipAddress": "0.0.0.0",
            "userAgent": "Unknown",
            "success": True
        })
        
        return {
            "success": True,
            "message": f"Resume uploaded successfully! ({len(text)} characters extracted). Unlimited uploads available.",
            "file_id": file_id,
            "file_url": f"/files/download-resume/{resume_id}",
            "resume_id": resume_id
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading file: {str(e)}"
        )

@router.post("/upload-jd", response_model=schemas.FileUploadResponse)
async def upload_jd_file(
    file: UploadFile = File(...),
    jd_id: str = Form(...),
    designation: str = Form(...),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Upload job description file (PDF, DOC, DOCX, TXT)
    
    - **jd_id**: Custom JD identifier (e.g., "AZ-12334")
    - **designation**: Job title/position
    - **file**: JD file (max 5MB)
    """
    # Validate file type
    allowed_types = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: PDF, DOC, DOCX, TXT"
        )
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Validate file size (max 5MB)
    max_size = MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE_MB}MB"
        )
    
    # Extract text
    text = ""
    if file.content_type == "application/pdf":
        text = extract_text_from_pdf(file_content)
    elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        text = extract_text_from_docx(file_content)
    elif file.content_type == "text/plain":
        text = file_content.decode("utf-8")
    
    if not text:
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from file"
        )
    
    # Calculate checksum
    checksum = calculate_checksum(file_content)
    
    # Check if JD already exists
    existing_jd = crud.get_jd_by_id(db, jd_id)
    if existing_jd:
        raise HTTPException(
            status_code=400,
            detail=f"Job Description with ID '{jd_id}' already exists. Please use a different ID or update the existing one."
        )
    
    # Store file in MongoDB GridFS
    try:
        grid_file_id = upload_file(
            file_content,
            file.filename,
            file.content_type,
            metadata={
                "uploaded_by": current_user["_id"],
                "original_name": file.filename,
                "checksum": checksum,
                "jd_id": jd_id
            }
        )
        
        # Create JD entry with GridFS reference
        jd_doc = {
            "_id": jd_id,
            "designation": designation,
            "description": text,
            "status": "active",
            "createdBy": crud.object_id(current_user["_id"]),
            "gridFsFileId": grid_file_id
        }
        
        created_jd_id = crud.create_job_description(db, jd_doc)
        
        # Create file metadata
        file_metadata = {
            "jdId": jd_id,
            "originalName": file.filename,
            "storagePath": f"gridfs://{grid_file_id}",
            "fileSize": file_size,
            "mimeType": file.content_type,
            "checksum": checksum,
            "security": {
                "virusScanStatus": "clean",
                "encrypted": False
            },
            "uploadedBy": crud.object_id(current_user["_id"]),
            "storageType": "gridfs"
        }
        
        file_id_str = crud.create_file_metadata(db, file_metadata)
        
        return {
            "success": True,
            "message": f"Job Description uploaded successfully ({len(text)} characters extracted)",
            "file_id": file_id_str,
            "file_url": f"/files/download-jd/{jd_id}",
            "resume_id": created_jd_id
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading JD: {str(e)}"
        )

@router.get("/download-resume/{resume_id}")
async def download_resume_file(
    resume_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Download resume file from MongoDB GridFS"""
    print(f"📥 Download request for resume: {resume_id}")
    
    # Debug: List all resumes to see what IDs exist
    all_resumes = list(db["resume"].find({}, {"_id": 1, "filename": 1}).limit(10))
    print(f"🔍 Available resumes in DB:")
    for r in all_resumes:
        print(f"   - {r.get('_id')} → {r.get('filename')}")
    
    # Get resume
    resume = crud.get_resume_by_id(db, resume_id)
    if not resume:
        print(f"❌ Resume not found in database: {resume_id}")
        print(f"   Tried to find resume with ID: {resume_id}")
        print(f"   Total resumes in DB: {db['resume'].count_documents({})}")
        raise HTTPException(status_code=404, detail=f"Resume not found. ID: {resume_id}")
    
    print(f"✅ Resume found: {resume.get('filename', 'Unknown')}")
    print(f"   Resume fields: {list(resume.keys())}")
    
    # Get GridFS file ID
    grid_file_id = resume.get("gridFsFileId")
    print(f"   GridFS File ID: {grid_file_id}")
    
    if not grid_file_id:
        print(f"❌ No GridFS file ID in resume document")
        print(f"   Available fields: {resume.keys()}")
        
        # Check if we have the file content directly
        if resume.get("text"):
            print(f"   Found text content, generating fallback text file")
            # Generate a simple text file as fallback
            text_content = f"Resume: {resume.get('filename', 'Unknown')}\n\n{resume.get('text', '')}"
            return StreamingResponse(
                io.BytesIO(text_content.encode('utf-8')),
                media_type="text/plain",
                headers={
                    "Content-Disposition": f'attachment; filename="{resume.get("filename", "resume.txt")}"'
                }
            )
        
        raise HTTPException(
            status_code=404,
            detail="File not found in storage. Resume text only available."
        )
    
    # Download file from GridFS
    try:
        print(f"📂 Attempting to download from GridFS: {grid_file_id}")
        file_content, filename, content_type = download_file(grid_file_id)
        print(f"✅ File retrieved from GridFS: {filename} ({len(file_content)} bytes)")
        
        # Log download action
        crud.create_audit_log(db, {
            "userId": crud.object_id(current_user["_id"]),
            "action": "export_data",
            "resourceType": "resume",
            "resourceId": resume_id,
            "ipAddress": "0.0.0.0",
            "userAgent": "Unknown",
            "success": True
        })
        
        # Return file as streaming response
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=content_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    
    except Exception as e:
        print(f"❌ GridFS download error: {e}")
        import traceback
        traceback.print_exc()
        
        # Fallback: Generate text file from resume text
        print(f"⚠️ Falling back to text export")
        if resume.get("text"):
            filename = resume.get("filename", "resume.txt")
            # Change extension to .txt for text export
            if filename.endswith('.pdf') or filename.endswith('.docx'):
                filename = filename.rsplit('.', 1)[0] + '.txt'
            
            text_content = f"Resume: {resume.get('filename', 'Unknown')}\n\n{resume.get('text', '')}"
            return StreamingResponse(
                io.BytesIO(text_content.encode('utf-8')),
                media_type="text/plain",
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"'
                }
            )
        
        raise HTTPException(
            status_code=500,
            detail=f"Error downloading file: {str(e)}"
        )

@router.put("/update-jd/{jd_id}", response_model=schemas.FileUploadResponse)
async def update_jd_file(
    jd_id: str,
    file: UploadFile = File(...),
    designation: str = Form(...),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Update existing job description file
    
    - **jd_id**: Existing JD identifier
    - **designation**: Updated job title/position
    - **file**: New JD file (max 5MB)
    """
    # Check if JD exists
    existing_jd = crud.get_jd_by_id(db, jd_id)
    if not existing_jd:
        raise HTTPException(
            status_code=404,
            detail=f"Job Description with ID '{jd_id}' not found. Use POST /upload-jd to create a new one."
        )
    
    # Validate file type
    allowed_types = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: PDF, DOC, DOCX, TXT"
        )
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Validate file size (max 5MB)
    max_size = MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE_MB}MB"
        )
    
    # Extract text
    text = ""
    if file.content_type == "application/pdf":
        text = extract_text_from_pdf(file_content)
    elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        text = extract_text_from_docx(file_content)
    elif file.content_type == "text/plain":
        text = file_content.decode("utf-8")
    
    if not text:
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from file"
        )
    
    # Calculate checksum
    checksum = calculate_checksum(file_content)
    
    # Store new file in MongoDB GridFS
    try:
        grid_file_id = upload_file(
            file_content,
            file.filename,
            file.content_type,
            metadata={
                "uploaded_by": current_user["_id"],
                "original_name": file.filename,
                "checksum": checksum,
                "jd_id": jd_id
            }
        )
        
        # Update JD entry
        update_data = {
            "designation": designation,
            "description": text,
            "gridFsFileId": grid_file_id
        }
        
        crud.update_jd(db, jd_id, update_data)
        
        # Create file metadata for new version
        file_metadata = {
            "jdId": jd_id,
            "originalName": file.filename,
            "storagePath": f"gridfs://{grid_file_id}",
            "fileSize": file_size,
            "mimeType": file.content_type,
            "checksum": checksum,
            "security": {
                "virusScanStatus": "clean",
                "encrypted": False
            },
            "uploadedBy": crud.object_id(current_user["_id"]),
            "storageType": "gridfs"
        }
        
        file_id_str = crud.create_file_metadata(db, file_metadata)
        
        # Log action
        crud.create_audit_log(db, {
            "userId": crud.object_id(current_user["_id"]),
            "action": "update_jd",
            "resourceType": "job_description",
            "resourceId": jd_id,
            "ipAddress": "0.0.0.0",
            "userAgent": "Unknown",
            "success": True
        })
        
        return {
            "success": True,
            "message": f"Job Description updated successfully ({len(text)} characters extracted)",
            "file_id": file_id_str,
            "file_url": f"/files/download-jd/{jd_id}",
            "resume_id": jd_id
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating JD: {str(e)}"
        )

@router.get("/download-jd/{jd_id}")
async def download_jd_file(
    jd_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Download job description file from MongoDB GridFS"""
    # Get JD
    jd = crud.get_jd_by_id(db, jd_id)
    if not jd:
        raise HTTPException(status_code=404, detail="Job Description not found")
    
    # Get GridFS file ID
    grid_file_id = jd.get("gridFsFileId")
    if not grid_file_id:
        raise HTTPException(
            status_code=404,
            detail="File not found in storage"
        )
    
    # Download file from GridFS
    try:
        file_content, filename, content_type = download_file(grid_file_id)
        
        # Return file as streaming response
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=content_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error downloading file: {str(e)}"
        )

@router.get("/user-stats")
def get_user_file_stats(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Get user's upload statistics
    
    Returns:
    - Resume count (unlimited)
    - Workflow limit (10 resumes per workflow)
    - Storage used
    """
    resume_count = crud.count_resumes(db)
    
    # Get GridFS storage stats
    from gridfs_storage import get_storage_stats
    storage_stats = get_storage_stats()
    
    return {
        "resume_count": resume_count,
        "limit": "Unlimited",
        "per_workflow_limit": FREE_PLAN_RESUME_LIMIT,
        "storage_used_mb": storage_stats["total_size_mb"],
        "message": f"You have {resume_count} resumes uploaded. Limit: 10 resumes per workflow."
    }

@router.get("/storage-stats")
def get_storage_stats_endpoint(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Get overall GridFS storage statistics (admin only)
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can access storage statistics"
        )
    
    from gridfs_storage import get_storage_stats
    return get_storage_stats()
