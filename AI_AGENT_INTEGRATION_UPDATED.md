# 🤖 AI Agent Integration Guide (Updated for Your System)

## 📋 Current Workflow

### **What Happens When User Clicks "Start AI Process":**

```
1. Frontend: User clicks "Start AI Process" button
   └─> ResumeFetcher.tsx → handleStartAIProcess()
   └─> Calls: startAIMatching(resumeIds, jdId)

2. Backend: POST /matching/batch
   └─> routers/matching.py → batch_match_resumes()
   └─> Creates workflow_id: "WF-1731427200000"
   └─> Saves to database: workflow_executions collection
   └─> Status: "in_progress"
   └─> Agents: [completed, completed, pending]
   
3. TODO: Backend should call AI Agent Container here!
   └─> Send resume_text + jd_text to AI Agent
   └─> AI Agent processes and returns results
   └─> Backend saves results to resume_results
   └─> Backend updates workflow status to "completed"

4. Frontend: Monitors progress on AI Workflow tab
   └─> Polls /workflow/status endpoint
   └─> Displays agent progress
   └─> Shows results when complete
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Frontend (Port 3000)                                       │
│  ├─ "Start AI Process" Button                              │
│  └─ POST /matching/batch {resumeIds, jdId}                 │
│       │                                                     │
│       ▼                                                     │
│  Backend (Port 8000)                                        │
│  ├─ Creates workflow_id automatically                       │
│  ├─ Saves to MongoDB: workflow_executions                   │
│  └─ Should trigger AI Agent Container ← INTEGRATION POINT  │
│       │                                                     │
│       ▼                                                     │
│  AI Agent Container (Port 9000)                             │
│  ├─ Receives: resume_text, jd_text, workflow_id            │
│  ├─ Processes with CrewAI/LLM                               │
│  └─ Returns: match_score, fit_category, etc.               │
│       │                                                     │
│       ▼                                                     │
│  Backend saves results                                      │
│  └─ Updates workflow status: "completed"                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 Integration Points

### **Where to Integrate AI Agent:**

**File:** `HR_Backend_FastAPI/routers/matching.py`  
**Function:** `batch_match_resumes()` (Line 154-253)  
**Current Status:** Creates workflow but doesn't call AI Agent yet

---

## 🎯 What Your AI Agent Needs

### **1. AI Agent Endpoints**

Your AI Agent container should expose these endpoints:

```python
# AI Agent Container (Port 9000)
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI(title="HR Comparator AI Agent")

class ComparisonRequest(BaseModel):
    workflow_id: str
    jd_text: str
    resumes: List[Dict[str, str]]  # [{resume_id, resume_text}, ...]

class ComparisonResult(BaseModel):
    resume_id: str
    match_score: float
    fit_category: str
    jd_extracted: Dict[str, Any]
    resume_extracted: Dict[str, Any]
    match_breakdown: Dict[str, Any]
    selection_reason: str
    confidence_score: float

@app.post("/compare-batch")
async def compare_batch(request: ComparisonRequest) -> Dict[str, Any]:
    """
    Receives multiple resumes and JD from backend
    Returns matching results for all resumes
    """
    results = []
    
    for resume in request.resumes:
        # YOUR AI AGENT LOGIC HERE
        # Run CrewAI agents, process with LLM, etc.
        result = {
            "resume_id": resume["resume_id"],
            "match_score": 85.5,
            "fit_category": "Excellent Match",
            "jd_extracted": {...},
            "resume_extracted": {...},
            "match_breakdown": {...},
            "selection_reason": "...",
            "confidence_score": 92.0
        }
        results.append(result)
    
    return {
        "workflow_id": request.workflow_id,
        "total_resumes": len(results),
        "results": results,
        "processing_time_ms": 2500
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/agent-info")
async def agent_info():
    """Agent information endpoint"""
    return {
        "agent_name": "HR Comparator Agent",
        "version": "1.0.0",
        "capabilities": ["resume_matching", "skill_extraction", "scoring"],
        "max_batch_size": 10
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)
```

---

## 📝 Backend Integration Code

### **Step 1: Create Config File**

```python
# HR_Backend_FastAPI/config.py (NEW FILE)
import os
from dotenv import load_dotenv

load_dotenv()

# AI Agent Configuration
AI_AGENT_URL = os.getenv("AI_AGENT_URL", "http://localhost:9000")
AI_AGENT_TIMEOUT = int(os.getenv("AI_AGENT_TIMEOUT", "120"))  # 2 minutes
AI_AGENT_ENABLED = os.getenv("AI_AGENT_ENABLED", "true").lower() == "true"
```

### **Step 2: Add AI Agent Call Function**

```python
# HR_Backend_FastAPI/routers/matching.py

import httpx
from config import AI_AGENT_URL, AI_AGENT_TIMEOUT, AI_AGENT_ENABLED

async def call_ai_agent_batch(workflow_id: str, jd_text: str, resumes: List[dict]) -> dict:
    """
    Call AI Agent container to process multiple resumes
    
    Args:
        workflow_id: Workflow ID (e.g. "WF-1731427200000")
        jd_text: Full job description text
        resumes: List of [{resume_id, resume_text}, ...]
    
    Returns:
        {
            "workflow_id": "WF-...",
            "results": [
                {
                    "resume_id": "...",
                    "match_score": 85.5,
                    "fit_category": "Excellent Match",
                    ...
                }
            ]
        }
    """
    if not AI_AGENT_ENABLED:
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
                return response.json()
            else:
                error_msg = f"AI Agent returned error: {response.status_code}"
                print(f"❌ {error_msg}")
                raise Exception(error_msg)
    
    except httpx.TimeoutException:
        error_msg = "AI Agent timeout - processing took too long"
        print(f"❌ {error_msg}")
        raise Exception(error_msg)
    
    except httpx.ConnectError:
        error_msg = "Cannot connect to AI Agent - is it running?"
        print(f"❌ {error_msg}")
        raise Exception(error_msg)
    
    except Exception as e:
        error_msg = f"AI Agent error: {str(e)}"
        print(f"❌ {error_msg}")
        raise Exception(error_msg)
```

### **Step 3: Update batch_match_resumes Endpoint**

```python
# HR_Backend_FastAPI/routers/matching.py

@router.post("/batch", response_model=schemas.MessageResponse)
async def batch_match_resumes(  # Make it async!
    batch_request: schemas.MatchingBatchRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Match multiple resumes against a job description
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
    
    # Enforce per-workflow resume limit (10 max per workflow)
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
                "status": "in_progress",  # Change to in_progress!
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
    # CALL AI AGENT (NEW CODE)
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
                crud.delete_result(db, existing_result["_id"])
            
            crud.create_resume_result(db, result_doc)
            processed_count += 1
        
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
        
        raise HTTPException(
            status_code=500,
            detail=f"AI Agent error: {str(e)}"
        )
```

---

## 🚀 Setup Instructions

### **Phase 1: Environment Setup**

```bash
# Add to HR_Backend_FastAPI/.env
AI_AGENT_URL=http://localhost:9000
AI_AGENT_TIMEOUT=120
AI_AGENT_ENABLED=true
```

### **Phase 2: Test Locally**

```bash
# Terminal 1: Start AI Agent Container
cd AI_Agent_Container
python main.py
# Should see: "AI Agent running on http://0.0.0.0:9000"

# Terminal 2: Test AI Agent Health
curl http://localhost:9000/health
# Expected: {"status": "healthy", "version": "1.0.0"}

# Terminal 3: Start Backend
cd HR_Backend_FastAPI
uvicorn main:app --reload --port 8000

# Terminal 4: Start Frontend
cd ..
npm run dev
```

### **Phase 3: Test Integration**

1. **Open app:** http://localhost:3000
2. **Login** with credentials
3. **Upload JD** (if not already uploaded)
4. **Upload Resumes** (1-10 resumes)
5. **Click "Start AI Process"**
6. **Check AI Workflow tab** to monitor progress

---

## 📊 Data Flow Details

### **Request from Backend to AI Agent:**

```json
POST http://localhost:9000/compare-batch

{
  "workflow_id": "WF-1731427200000",
  "jd_text": "Job Description:\nSenior Software Engineer\nRequirements:\n- 3-5 years experience...",
  "resumes": [
    {
      "resume_id": "673357e46c1e0e6fdda05bb2",
      "resume_text": "John Doe\nSenior Engineer\n5 years experience..."
    },
    {
      "resume_id": "673357e46c1e0e6fdda05bb3",
      "resume_text": "Jane Smith\nSoftware Developer\n3 years experience..."
    }
  ]
}
```

### **Response from AI Agent to Backend:**

```json
{
  "workflow_id": "WF-1731427200000",
  "total_resumes": 2,
  "processing_time_ms": 2500,
  "results": [
    {
      "resume_id": "673357e46c1e0e6fdda05bb2",
      "match_score": 85.5,
      "fit_category": "Excellent Match",
      "jd_extracted": {
        "position": "Senior Software Engineer",
        "required_skills": ["Python", "React", "FastAPI"],
        "experience_required": {"min_years": 3, "max_years": 5}
      },
      "resume_extracted": {
        "candidate_name": "John Doe",
        "email": "john@email.com",
        "skills_matched": ["Python", "React", "FastAPI"],
        "total_experience": 5.0
      },
      "match_breakdown": {
        "skills_match": 95.0,
        "experience_match": 90.0,
        "overall_compatibility": 85.5
      },
      "selection_reason": "HIGHLY RECOMMENDED...",
      "confidence_score": 92.0
    },
    {
      "resume_id": "673357e46c1e0e6fdda05bb3",
      "match_score": 72.0,
      "fit_category": "Good Match",
      ...
    }
  ]
}
```

---

## 🎯 Additional AI Agent Endpoints (Optional)

If your AI Agent has more capabilities:

```python
# Get agent capabilities
GET /agent-info

# Check processing status (if async)
GET /workflow/{workflow_id}/status

# Cancel processing
DELETE /workflow/{workflow_id}

# Get agent metrics
GET /metrics
```

---

## 🔧 Testing Checklist

### **Before Integration:**
- [ ] AI Agent container runs on port 9000
- [ ] `/health` endpoint returns 200 OK
- [ ] `/compare-batch` endpoint accepts test request

### **After Backend Update:**
- [ ] Backend can connect to AI Agent
- [ ] Workflow status updates to "in_progress"
- [ ] AI Agent receives correct data format
- [ ] Results are saved to `resume_results` collection
- [ ] Workflow status updates to "completed"

### **Frontend Testing:**
- [ ] "Start AI Process" button triggers workflow
- [ ] AI Workflow tab shows progress
- [ ] Agents update from pending → in_progress → completed
- [ ] Results display correctly
- [ ] Workflow history stores completed workflows

---

## 🐛 Debugging

### **Check if AI Agent is running:**
```bash
curl http://localhost:9000/health
```

### **Check Backend logs:**
```bash
# Should see these logs:
🤖 Calling AI Agent for workflow: WF-1731427200000
✅ AI Agent completed for workflow: WF-1731427200000
✅ Workflow completed: WF-1731427200000
```

### **Check MongoDB:**
```bash
# Check workflow status
db.workflow_executions.find({"workflow_id": "WF-1731427200000"})

# Check results
db.resume_results.find({"jd_id": "JD001"})
```

---

## 📋 Summary

### **Current Flow:**
1. ✅ User clicks "Start AI Process"
2. ✅ Frontend calls `/matching/batch`
3. ✅ Backend creates `workflow_id`
4. ✅ Backend saves workflow to database
5. ❌ **Need to add:** Backend calls AI Agent
6. ❌ **Need to add:** Backend saves results
7. ❌ **Need to add:** Backend updates workflow status

### **After Integration:**
1. ✅ User clicks "Start AI Process"
2. ✅ Frontend calls `/matching/batch`
3. ✅ Backend creates `workflow_id`
4. ✅ Backend saves workflow to database
5. ✅ Backend calls AI Agent automatically
6. ✅ AI Agent processes and returns results
7. ✅ Backend saves results to database
8. ✅ Backend updates workflow to "completed"
9. ✅ Frontend shows completed workflow

---

## 🚀 Ready to Integrate?

**Tell me when your AI Agent is ready:**
1. What port is it running on? (I assumed 9000)
2. What endpoint should backend call? (I assumed `/compare-batch`)
3. Does it accept batch requests or single requests?
4. Any other endpoints I should know about?

Once you confirm, I'll update the backend code! 🎯

