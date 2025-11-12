# routers/audit.py - Audit Logs Endpoints
from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database
from datetime import datetime
from typing import List, Optional
import schemas
from database import get_db, AUDIT_LOG_COLLECTION
from routers.auth import get_current_user

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

def determine_activity_type(action: str) -> str:
    """Determine activity type based on action"""
    action_lower = action.lower()
    if "match" in action_lower or "process" in action_lower:
        return "success"
    elif "upload" in action_lower or "create" in action_lower:
        return "info"
    elif "delete" in action_lower or "remove" in action_lower:
        return "warning"
    return "info"

@router.get("/recent")
def get_recent_activity(
    limit: int = 10,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get recent audit log entries
    
    Returns the most recent activities in the system
    """
    try:
        # Get recent logs sorted by timestamp
        logs = list(
            db[AUDIT_LOG_COLLECTION].find()
            .sort("timestamp", -1)
            .limit(limit)
        )
        
        # Format for frontend
        activities = []
        for log in logs:
            details = log.get("details", {})
            
            # Extract relevant info from details
            candidate_name = details.get("candidateName") or details.get("filename") or details.get("jdTitle") or "System"
            match_score = details.get("matchScore")
            
            activity = {
                "id": str(log.get("_id")),
                "action": log.get("action", "Unknown action"),
                "candidate": candidate_name,
                "score": match_score,
                "timestamp": log.get("timestamp").isoformat() if log.get("timestamp") else datetime.utcnow().isoformat(),
                "type": determine_activity_type(log.get("action", "")),
                "userId": str(log.get("userId")) if log.get("userId") else None
            }
            activities.append(activity)
        
        return {
            "success": True,
            "count": len(activities),
            "activities": activities
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch audit logs: {str(e)}"
        )

@router.get("/user/{user_id}")
def get_user_activity(
    user_id: str,
    limit: int = 50,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get activity logs for a specific user"""
    try:
        from bson import ObjectId
        
        logs = list(
            db[AUDIT_LOG_COLLECTION].find({"userId": ObjectId(user_id)})
            .sort("timestamp", -1)
            .limit(limit)
        )
        
        activities = []
        for log in logs:
            activities.append({
                "id": str(log.get("_id")),
                "action": log.get("action"),
                "details": log.get("details", {}),
                "timestamp": log.get("timestamp").isoformat() if log.get("timestamp") else None,
                "ipAddress": log.get("ipAddress")
            })
        
        return {
            "success": True,
            "userId": user_id,
            "count": len(activities),
            "activities": activities
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user activity: {str(e)}"
        )

