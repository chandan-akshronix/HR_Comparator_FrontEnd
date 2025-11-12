# routers/matching.py - Resume-JD Matching Endpoints
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from pymongo.database import Database
from typing import List, Optional
from datetime import datetime

import schemas
import crud
from database import get_db
from routers.auth import get_current_user

router = APIRouter(prefix="/matching", tags=["Matching"])

# TODO: Implement actual AI matching logic
def mock_ai_matching(resume_text: str, jd_text: str) -> dict:
    """
    Mock AI matching function
    
    In production, this should call the AI agents:
    1. JD & Resume Extractor Agent
    2. JD Reader Agent
    3. Resume Reader Agent
    4. HR Comparator Agent
    """
    # This is mock data - replace with actual AI implementation
    return {
        "match_score": 85.5,
        "fit_category": "Excellent Match",
        "jd_extracted": {
            "position": "Software Engineer",
            "experience_required": {
                "min_years": 3,
                "max_years": 5,
                "type": "Software Development"
            },
            "required_skills": ["Python", "FastAPI", "MongoDB"],
            "preferred_skills": ["AWS", "Docker"],
            "education": "Bachelor's in Computer Science",
            "location": "Remote",
            "job_type": "Full-time",
            "responsibilities": ["Develop APIs", "Write tests", "Code reviews"]
        },
        "resume_extracted": {
            "candidate_name": "John Doe",
            "email": "john@example.com",
            "phone": "+1-234-567-8900",
            "location": "San Francisco, CA",
            "current_position": "Senior Software Engineer",
            "total_experience": 5.0,
            "relevant_experience": 4.5,
            "skills_matched": ["Python", "FastAPI", "MongoDB", "AWS"],
            "skills_missing": [],
            "education": {
                "degree": "B.S. Computer Science",
                "institution": "Stanford University",
                "year": 2018,
                "grade": "3.8/4.0"
            },
            "certifications": ["AWS Certified"],
            "work_history": [
                {
                    "title": "Senior Software Engineer",
                    "company": "Tech Corp",
                    "duration": "3 years",
                    "technologies": ["Python", "FastAPI", "AWS"]
                }
            ],
            "key_achievements": ["Led team of 5 developers", "Reduced API latency by 40%"]
        },
        "match_breakdown": {
            "skills_match": 95.0,
            "experience_match": 90.0,
            "education_match": 100.0,
            "location_match": 85.0,
            "cultural_fit": 80.0,
            "overall_compatibility": 85.5
        },
        "selection_reason": "HIGHLY RECOMMENDED\n\nSTRENGTHS:\n✅ Strong technical skills match\n✅ Exceeds experience requirements\n✅ Relevant education background\n\nThis candidate is an excellent fit for the position.",
        "confidence_score": 92.0,
        "processing_duration_ms": 2500
    }

@router.post("/match", response_model=schemas.ResumeResultResponse)
def match_resume_with_jd(
    match_request: schemas.MatchingRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Match a single resume against a job description
    
    - **resume_id**: Resume ObjectId
    - **jd_id**: Job Description custom ID
    - **force_reprocess**: Force reprocessing even if result exists
    """
    # Get resume and JD
    resume = crud.get_resume_by_id(db, match_request.resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    jd = crud.get_jd_by_id(db, match_request.jd_id)
    if not jd:
        raise HTTPException(status_code=404, detail="Job Description not found")
    
    # Check if result already exists
    existing_result = crud.get_result_by_resume_jd(
        db, match_request.resume_id, match_request.jd_id
    )
    
    if existing_result and not match_request.force_reprocess:
        return existing_result
    
    # Perform AI matching
    start_time = datetime.utcnow()
    ai_result = mock_ai_matching(resume.get("text", ""), jd.get("description", ""))
    processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
    
    # Create result document
    result_doc = {
        "resume_id": crud.object_id(match_request.resume_id),
        "jd_id": match_request.jd_id,
        "match_score": ai_result["match_score"],
        "fit_category": ai_result["fit_category"],
        "jd_extracted": ai_result["jd_extracted"],
        "resume_extracted": ai_result["resume_extracted"],
        "match_breakdown": ai_result["match_breakdown"],
        "selection_reason": ai_result["selection_reason"],
        "agent_version": "v1.0.0",
        "processing_duration_ms": int(processing_time),
        "confidence_score": ai_result.get("confidence_score")
    }
    
    # Save or update result
    if existing_result:
        crud.delete_result(db, existing_result["_id"])
    
    result_id = crud.create_resume_result(db, result_doc)
    
    # Log action
    crud.create_audit_log(db, {
        "userId": crud.object_id(current_user["_id"]),
        "action": "run_matching",
        "resourceType": "resume_result",
        "resourceId": result_id,
        "ipAddress": "0.0.0.0",
        "userAgent": "Unknown",
        "success": True
    })
    
    # Get created result
    result = crud.get_result_by_id(db, result_id)
    return result

@router.post("/batch", response_model=schemas.MessageResponse)
def batch_match_resumes(
    batch_request: schemas.MatchingBatchRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Match multiple resumes against a job description
    
    - **jd_id**: Job Description custom ID
    - **resume_ids**: List of resume IDs (if None, matches all resumes)
    - **force_reprocess**: Force reprocessing even if results exist
    """
    # Get JD
    jd = crud.get_jd_by_id(db, batch_request.jd_id)
    if not jd:
        raise HTTPException(status_code=404, detail="Job Description not found")
    
    # Get resumes to match
    if batch_request.resume_ids:
        resume_ids = batch_request.resume_ids
    else:
        # Match all resumes
        all_resumes = crud.get_all_resumes(db, 0, 1000)
        resume_ids = [r["_id"] for r in all_resumes]
    
    # TODO: Implement background task for batch processing
    # For now, return immediate response
    return {
        "success": True,
        "message": f"Batch matching started for {len(resume_ids)} resumes",
        "data": {
            "jd_id": batch_request.jd_id,
            "total_resumes": len(resume_ids),
            "status": "processing"
        }
    }

@router.get("/results/{jd_id}", response_model=List[schemas.ResumeResultListResponse])
def get_jd_results(
    jd_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    min_score: Optional[float] = Query(None, ge=0, le=100),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Get all matching results for a job description
    
    - **jd_id**: Job Description custom ID
    - **skip**: Number of records to skip
    - **limit**: Maximum records to return
    - **min_score**: Minimum match score filter
    """
    results = crud.get_results_by_jd(db, jd_id, skip, limit, min_score)
    
    # Format response
    response = []
    for result in results:
        response.append({
            "id": result["_id"],
            "resume_id": str(result["resume_id"]),
            "jd_id": result["jd_id"],
            "candidate_name": result.get("resume_extracted", {}).get("candidate_name", "Unknown"),
            "match_score": result["match_score"],
            "fit_category": result["fit_category"],
            "timestamp": result["timestamp"]
        })
    
    return response

@router.get("/top-matches/{jd_id}", response_model=schemas.TopMatchesResponse)
def get_top_matches(
    jd_id: str,
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Get top matching candidates for a job description
    
    - **jd_id**: Job Description custom ID
    - **limit**: Number of top matches to return (max 50)
    """
    # Get JD
    jd = crud.get_jd_by_id(db, jd_id)
    if not jd:
        raise HTTPException(status_code=404, detail="Job Description not found")
    
    # Get top matches
    top_results = crud.get_top_matches(db, jd_id, limit)
    
    # Format response
    top_matches = []
    for result in top_results:
        top_matches.append({
            "id": result["_id"],
            "resume_id": str(result["resume_id"]),
            "jd_id": result["jd_id"],
            "candidate_name": result.get("resume_extracted", {}).get("candidate_name", "Unknown"),
            "match_score": result["match_score"],
            "fit_category": result["fit_category"],
            "timestamp": result["timestamp"]
        })
    
    return {
        "jd_id": jd_id,
        "jd_designation": jd.get("designation", "Unknown"),
        "total_candidates": len(top_matches),
        "top_matches": top_matches
    }

@router.get("/result/{result_id}", response_model=schemas.ResumeResultResponse)
def get_result_by_id(
    result_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get detailed matching result by ID"""
    result = crud.get_result_by_id(db, result_id)
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    
    return result

@router.delete("/result/{result_id}", response_model=schemas.MessageResponse)
def delete_result(
    result_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Delete matching result"""
    success = crud.delete_result(db, result_id)
    if not success:
        raise HTTPException(status_code=404, detail="Result not found")
    
    return {
        "success": True,
        "message": "Result deleted successfully"
    }

