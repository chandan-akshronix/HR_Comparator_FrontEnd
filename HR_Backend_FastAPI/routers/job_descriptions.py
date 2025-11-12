# routers/job_descriptions.py - Job Description Management Endpoints
from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo.database import Database
from typing import List, Optional

import schemas
import crud
from database import get_db
from routers.auth import get_current_user

router = APIRouter(prefix="/job-descriptions", tags=["Job Descriptions"])

@router.post("/", response_model=schemas.JobDescriptionResponse, status_code=201)
def create_job_description(
    jd_data: schemas.JobDescriptionCreate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Create a new job description
    
    - **id**: Custom JD ID (e.g., "AZ-12334")
    - **designation**: Job title/position
    - **description**: Full job description text
    - **company**: Company name (optional)
    - **location**: Job location (optional)
    - **status**: JD status (active/closed/draft)
    """
    # Check if JD ID already exists
    existing_jd = crud.get_jd_by_id(db, jd_data.id)
    if existing_jd:
        raise HTTPException(
            status_code=400,
            detail=f"Job Description with ID '{jd_data.id}' already exists"
        )
    
    # Add created by user
    jd_dict = jd_data.model_dump()
    jd_dict["_id"] = jd_dict.pop("id")  # Use custom ID as _id
    jd_dict["createdBy"] = crud.object_id(current_user["_id"])
    
    # Create JD
    jd_id = crud.create_job_description(db, jd_dict)
    
    # Log action
    crud.create_audit_log(db, {
        "userId": crud.object_id(current_user["_id"]),
        "action": "create_jd",
        "resourceType": "job_description",
        "resourceId": jd_id,
        "ipAddress": "0.0.0.0",
        "userAgent": "Unknown",
        "success": True
    })
    
    # Get created JD
    jd = crud.get_jd_by_id(db, jd_id)
    return jd

@router.get("/", response_model=List[schemas.JobDescriptionListResponse])
def list_job_descriptions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    List all job descriptions with pagination
    
    - **skip**: Number of records to skip
    - **limit**: Maximum records to return (max 100)
    - **status**: Filter by status (active/closed/draft)
    """
    jds = crud.get_all_jds(db, skip, limit, status)
    
    # Format response with id field and description preview
    formatted_jds = []
    for jd in jds:
        formatted_jd = {
            "id": jd.get("_id"),  # Map _id to id
            "designation": jd.get("designation"),
            "company": jd.get("company"),
            "location": jd.get("location"),
            "status": jd.get("status"),
            "createdAt": jd.get("createdAt"),
            "updatedAt": jd.get("updatedAt"),
            "description_preview": jd.get("description", "")[:200]
        }
        formatted_jds.append(formatted_jd)
    
    return formatted_jds

@router.get("/{jd_id}", response_model=schemas.JobDescriptionResponse)
def get_job_description(
    jd_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get job description by ID"""
    jd = crud.get_jd_by_id(db, jd_id)
    if not jd:
        raise HTTPException(status_code=404, detail="Job Description not found")
    
    return jd

@router.put("/{jd_id}", response_model=schemas.MessageResponse)
def update_job_description(
    jd_id: str,
    jd_update: schemas.JobDescriptionUpdate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Update job description"""
    # Check if JD exists
    existing_jd = crud.get_jd_by_id(db, jd_id)
    if not existing_jd:
        raise HTTPException(status_code=404, detail="Job Description not found")
    
    # Update only provided fields
    update_data = jd_update.model_dump(exclude_unset=True)
    
    success = crud.update_jd(db, jd_id, update_data)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update Job Description")
    
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
        "message": "Job Description updated successfully"
    }

@router.delete("/{jd_id}", response_model=schemas.MessageResponse)
def delete_job_description(
    jd_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Delete job description"""
    # Check if JD exists
    existing_jd = crud.get_jd_by_id(db, jd_id)
    if not existing_jd:
        raise HTTPException(status_code=404, detail="Job Description not found")
    
    # Delete JD
    success = crud.delete_jd(db, jd_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete Job Description")
    
    return {
        "success": True,
        "message": "Job Description deleted successfully"
    }

@router.get("/search/text")
def search_job_descriptions(
    q: str = Query(..., min_length=3, description="Search query"),
    limit: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Full-text search in job descriptions
    
    - **q**: Search query (minimum 3 characters)
    - **limit**: Maximum results (max 50)
    """
    results = crud.search_jds(db, q, limit)
    
    # Add description preview
    for jd in results:
        jd["description_preview"] = jd.get("description", "")[:200]
    
    return {
        "query": q,
        "count": len(results),
        "results": results
    }

@router.get("/stats/count")
def get_jd_count(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get total JD count, optionally filtered by status"""
    count = crud.count_jds(db, status)
    return {
        "total": count,
        "status": status
    }

