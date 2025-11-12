# routers/analytics.py - Analytics and Statistics Endpoints
from fastapi import APIRouter, Depends
from pymongo.database import Database
from datetime import datetime, timedelta

import schemas
import crud
from database import get_db, RESUME_COLLECTION, RESUME_RESULT_COLLECTION, JOB_DESCRIPTION_COLLECTION
from routers.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/stats", response_model=schemas.MatchingStatsResponse)
def get_overall_stats(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Get overall system statistics
    
    Returns:
    - Total resumes, JDs, matches
    - Average match score
    - Match distribution by category
    - Top skills (TODO)
    """
    stats = crud.get_matching_stats(db)
    
    # TODO: Add top skills analysis
    stats["top_skills"] = []
    
    return stats

@router.get("/jd-stats/{jd_id}", response_model=schemas.JDStatsResponse)
def get_jd_statistics(
    jd_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Get statistics for a specific job description
    
    Returns:
    - Total candidates matched
    - Average and best match scores
    - Candidate distribution by category
    """
    # Check if JD exists
    jd = crud.get_jd_by_id(db, jd_id)
    if not jd:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Job Description not found")
    
    # Get JD stats
    stats = crud.get_jd_stats(db, jd_id)
    stats["jd_id"] = jd_id
    stats["designation"] = jd.get("designation", "Unknown")
    
    return stats

@router.get("/dashboard")
def get_dashboard_data(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Get dashboard data for frontend
    
    Returns combined statistics and recent activity
    """
    # Get overall stats
    stats = crud.get_matching_stats(db)
    
    # Get recent resumes
    recent_resumes = crud.get_all_resumes(db, 0, 5)
    
    # Get recent JDs
    recent_jds = crud.get_all_jds(db, 0, 5)
    
    # Get top matches across all JDs
    from database import RESUME_RESULT_COLLECTION
    top_matches = list(db[RESUME_RESULT_COLLECTION].find().sort("match_score", -1).limit(10))
    for match in top_matches:
        match["_id"] = str(match["_id"])
        match["resume_id"] = str(match["resume_id"])
    
    return {
        "stats": stats,
        "recent_resumes": [
            {
                "id": r["_id"],
                "filename": r["filename"],
                "uploadedAt": r.get("uploadedAt"),
                "source": r.get("source")
            }
            for r in recent_resumes
        ],
        "recent_jds": [
            {
                "id": jd["_id"],
                "designation": jd["designation"],
                "status": jd.get("status"),
                "createdAt": jd.get("createdAt")
            }
            for jd in recent_jds
        ],
        "top_matches": top_matches
    }

@router.get("/audit-logs")
def get_audit_logs(
    skip: int = 0,
    limit: int = 50,
    action: str = None,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Get audit logs (Admin only)
    
    - **skip**: Records to skip
    - **limit**: Max records to return
    - **action**: Filter by action type
    """
    # Check if user is admin
    if current_user.get("role") != "admin":
        from fastapi import HTTPException
        raise HTTPException(
            status_code=403,
            detail="Only admins can access audit logs"
        )
    
    logs = crud.get_audit_logs(db, None, action, skip, limit)
    
    return {
        "total": len(logs),
        "logs": logs
    }

@router.get("/trends")
def get_dashboard_trends(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Get trend statistics for dashboard
    
    Calculates:
    - Week-over-week candidate growth
    - High match rate trends
    - Processing activity trends
    """
    try:
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        two_weeks_ago = now - timedelta(days=14)
        
        # Count resumes this week vs last week
        this_week_resumes = db[RESUME_COLLECTION].count_documents({
            "createdAt": {"$gte": week_ago}
        })
        
        last_week_resumes = db[RESUME_COLLECTION].count_documents({
            "createdAt": {"$gte": two_weeks_ago, "$lt": week_ago}
        })
        
        # Calculate percentage change for candidates
        if last_week_resumes > 0:
            candidate_trend_pct = ((this_week_resumes - last_week_resumes) / last_week_resumes) * 100
        else:
            candidate_trend_pct = 100 if this_week_resumes > 0 else 0
        
        # Count high matches (>80%) this week vs last week
        this_week_high_matches = db[RESUME_RESULT_COLLECTION].count_documents({
            "createdAt": {"$gte": week_ago},
            "match_score": {"$gte": 80}
        })
        
        last_week_high_matches = db[RESUME_RESULT_COLLECTION].count_documents({
            "createdAt": {"$gte": two_weeks_ago, "$lt": week_ago},
            "match_score": {"$gte": 80}
        })
        
        # Calculate percentage change for high matches
        if last_week_high_matches > 0:
            high_match_trend_pct = ((this_week_high_matches - last_week_high_matches) / last_week_high_matches) * 100
        else:
            high_match_trend_pct = 100 if this_week_high_matches > 0 else 0
        
        # JD activity trend
        this_week_jds = db[JOB_DESCRIPTION_COLLECTION].count_documents({
            "createdAt": {"$gte": week_ago}
        })
        
        return {
            "success": True,
            "candidatesTrend": f"+{int(candidate_trend_pct)}%" if candidate_trend_pct >= 0 else f"{int(candidate_trend_pct)}%",
            "candidatesTrendUp": candidate_trend_pct >= 0,
            "highMatchTrend": f"+{int(high_match_trend_pct)}%" if high_match_trend_pct >= 0 else f"{int(high_match_trend_pct)}%",
            "highMatchTrendUp": high_match_trend_pct >= 0,
            "jdsTrend": f"{this_week_jds} this week",
            "jdsTrendUp": this_week_jds > 0,
            "calculated_at": now.isoformat()
        }
    
    except Exception as e:
        # Return neutral trends on error
        return {
            "success": False,
            "candidatesTrend": "0%",
            "candidatesTrendUp": True,
            "highMatchTrend": "0%",
            "highMatchTrendUp": True,
            "jdsTrend": "0",
            "jdsTrendUp": True,
            "error": str(e)
        }

