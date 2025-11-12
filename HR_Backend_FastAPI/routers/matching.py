# routers/matching.py - Resume-JD Matching Endpoints
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from pymongo.database import Database
from typing import List, Optional
from datetime import datetime
import httpx

import schemas
import crud
from database import get_db
from routers.auth import get_current_user
from config import AI_AGENT_URL, AI_AGENT_TIMEOUT, AI_AGENT_ENABLED

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

async def call_ai_agent_batch(workflow_id: str, jd_text: str, resumes: List[dict]) -> dict:
    """
    Call AI Agent container to process multiple resumes
    
    Args:
        workflow_id: Workflow ID (e.g. "WF-1731427200000")
        jd_text: Full job description text
        resumes: List of [{resume_id, resume_text}, ...]
    
    Returns:
        {workflow_id, results: [{resume_id, match_score, ...}]}
    """
    if not AI_AGENT_ENABLED:
        print("⚠️ AI Agent disabled, using mock data")
        # Fallback to mock if agent is disabled
        return {
            "workflow_id": workflow_id,
            "results": [
                {
                    "resume_id": r["resume_id"],
                    **mock_ai_matching(r["resume_text"], jd_text)
                }
                for r in resumes
            ]
        }
    
    try:
        print(f"🤖 Calling AI Agent at {AI_AGENT_URL}/compare-batch")
        async with httpx.AsyncClient(timeout=AI_AGENT_TIMEOUT) as client:
            response = await client.post(
                f"{AI_AGENT_URL}/compare-batch",
                json={
                    "workflow_id": workflow_id,
                    "jd_text": jd_text,
                    "resumes": resumes
                }
            )
            
            if response.status_code == 200:
                print(f"✅ AI Agent responded successfully")
                return response.json()
            else:
                error_msg = f"AI Agent returned error: {response.status_code} - {response.text}"
                print(f"❌ {error_msg}")
                raise Exception(error_msg)
    
    except httpx.TimeoutException:
        error_msg = "AI Agent timeout - processing took too long"
        print(f"❌ {error_msg}")
        raise Exception(error_msg)
    
    except httpx.ConnectError:
        error_msg = f"Cannot connect to AI Agent at {AI_AGENT_URL} - is it running?"
        print(f"❌ {error_msg}")
        raise Exception(error_msg)
    
    except Exception as e:
        error_msg = f"AI Agent error: {str(e)}"
        print(f"❌ {error_msg}")
        raise Exception(error_msg)

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
async def batch_match_resumes(  # ✅ Made async!
    batch_request: schemas.MatchingBatchRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Match multiple resumes against a job description
    NOW WITH REAL AI AGENT INTEGRATION!
    """
    from database import FREE_PLAN_RESUME_LIMIT
    
    # Get JD
    jd = crud.get_jd_by_id(db, batch_request.jd_id)
    if not jd:
        raise HTTPException(status_code=404, detail="Job Description not found")
    
    # Get resumes to match
    if batch_request.resume_ids:
        resume_ids = batch_request.resume_ids
    else:
        all_resumes = crud.get_all_resumes(db, 0, 1000)
        resume_ids = [r["_id"] for r in all_resumes]
    
    # Enforce 10-resume limit
    if len(resume_ids) > FREE_PLAN_RESUME_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {FREE_PLAN_RESUME_LIMIT} resumes allowed per workflow."
        )
    
    # Generate unique workflow ID
    workflow_id = f"WF-{int(datetime.utcnow().timestamp() * 1000)}"
    
    # Create workflow execution record
    workflow_doc = {
        "workflow_id": workflow_id,
        "jd_id": batch_request.jd_id,
        "jd_title": jd.get("designation", "Job Description"),
        "status": "in_progress",
        "started_by": crud.object_id(current_user["_id"]),
        "started_at": datetime.utcnow(),
        "resume_ids": [crud.object_id(rid) for rid in resume_ids],
        "total_resumes": len(resume_ids),
        "processed_resumes": 0,
        "agents": [
            {
                "agent_id": "jd-reader",
                "name": "JD Reader Agent",
                "status": "completed",
                "is_ai_agent": False
            },
            {
                "agent_id": "resume-reader",
                "name": "Resume Reader Agent",
                "status": "completed",
                "is_ai_agent": False
            },
            {
                "agent_id": "hr-comparator",
                "name": "HR Comparator Agent",
                "status": "in_progress",
                "is_ai_agent": True,
                "started_at": datetime.utcnow()
            }
        ],
        "progress": {
            "completed_agents": 2,
            "total_agents": 3,
            "percentage": 66
        },
        "metrics": {
            "total_candidates": len(resume_ids),
            "processing_time_ms": 0,
            "match_rate": 0,
            "top_matches": 0
        }
    }
    
    workflow_db_id = crud.create_workflow_execution(db, workflow_doc)
    
    # ============================================
    # 🚀 CALL AI AGENT (NEW CODE)
    # ============================================
    try:
        # Prepare resumes for AI Agent
        resumes_data = []
        for resume_id in resume_ids:
            resume = crud.get_resume_by_id(db, resume_id)
            if resume:
                resumes_data.append({
                    "resume_id": resume_id,
                    "resume_text": resume.get("text", "")
                })
        
        # Call AI Agent
        print(f"🤖 Calling AI Agent for workflow: {workflow_id}")
        ai_results = await call_ai_agent_batch(
            workflow_id=workflow_id,
            jd_text=jd.get("description", ""),
            resumes=resumes_data
        )
        
        print(f"✅ AI Agent completed for workflow: {workflow_id}")
        
        # Save results to database
        processed_count = 0
        for result in ai_results["results"]:
            try:
                print(f"💾 Saving result for resume: {result['resume_id']}")
                result_doc = {
                    "resume_id": crud.object_id(result["resume_id"]),
                    "jd_id": batch_request.jd_id,
                    "match_score": result["match_score"],
                    "fit_category": result["fit_category"],
                    "jd_extracted": result["jd_extracted"],
                    "resume_extracted": result["resume_extracted"],
                    "match_breakdown": result["match_breakdown"],
                    "selection_reason": result["selection_reason"],
                    "agent_version": "v1.0.0",
                    "processing_duration_ms": ai_results.get("processing_time_ms", 0),
                    "confidence_score": result.get("confidence_score")
                }
                
                # Check if result already exists
                existing_result = crud.get_result_by_resume_jd(
                    db, result["resume_id"], batch_request.jd_id
                )
                
                if existing_result:
                    print(f"🔄 Deleting existing result: {existing_result['_id']}")
                    crud.delete_result(db, existing_result["_id"])
                
                result_id = crud.create_resume_result(db, result_doc)
                print(f"✅ Saved result with ID: {result_id}")
                processed_count += 1
            except Exception as save_error:
                print(f"❌ Error saving result for resume {result['resume_id']}: {save_error}")
                import traceback
                traceback.print_exc()
                # Continue with next resume even if this one fails
        
        # Update workflow status to completed
        crud.update_workflow_status(db, workflow_id, {
            "status": "completed",
            "completed_at": datetime.utcnow(),
            "processed_resumes": processed_count,
            "agents": [
                {
                    "agent_id": "jd-reader",
                    "name": "JD Reader Agent",
                    "status": "completed",
                    "is_ai_agent": False
                },
                {
                    "agent_id": "resume-reader",
                    "name": "Resume Reader Agent",
                    "status": "completed",
                    "is_ai_agent": False
                },
                {
                    "agent_id": "hr-comparator",
                    "name": "HR Comparator Agent",
                    "status": "completed",
                    "is_ai_agent": True,
                    "completed_at": datetime.utcnow(),
                    "duration_ms": ai_results.get("processing_time_ms", 0)
                }
            ],
            "progress": {
                "completed_agents": 3,
                "total_agents": 3,
                "percentage": 100
            },
            "metrics": {
                "total_candidates": len(resume_ids),
                "processing_time_ms": ai_results.get("processing_time_ms", 0),
                "match_rate": 100,
                "top_matches": processed_count
            }
        })
        
        print(f"✅ Workflow completed: {workflow_id}")
        
        # Log action
        crud.create_audit_log(db, {
            "userId": crud.object_id(current_user["_id"]),
            "action": "run_matching",
            "resourceType": "workflow_execution",
            "resourceId": workflow_id,
            "ipAddress": "0.0.0.0",
            "userAgent": "Unknown",
            "success": True
        })
        
        return {
            "success": True,
            "message": f"AI processing completed for {processed_count} resumes",
            "data": {
                "workflow_id": workflow_id,
                "jd_id": batch_request.jd_id,
                "total_resumes": len(resume_ids),
                "processed_resumes": processed_count,
                "status": "completed"
            }
        }
    
    except Exception as e:
        # Update workflow status to failed
        crud.update_workflow_status(db, workflow_id, {
            "status": "failed",
            "error": str(e),
            "agents": [
                {
                    "agent_id": "jd-reader",
                    "name": "JD Reader Agent",
                    "status": "completed",
                    "is_ai_agent": False
                },
                {
                    "agent_id": "resume-reader",
                    "name": "Resume Reader Agent",
                    "status": "completed",
                    "is_ai_agent": False
                },
                {
                    "agent_id": "hr-comparator",
                    "name": "HR Comparator Agent",
                    "status": "failed",
                    "is_ai_agent": True,
                    "error": str(e)
                }
            ]
        })
        
        print(f"❌ Workflow failed: {workflow_id} - {str(e)}")
        
        raise HTTPException(
            status_code=500,
            detail=f"AI Agent error: {str(e)}"
        )

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

