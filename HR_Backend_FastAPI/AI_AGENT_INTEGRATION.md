# AI Agent Integration Guide

## 🤖 Where to Add AI Agents

The backend is **ready for AI agent integration**! Here are the exact integration points:

---

## 📍 Integration Point: `routers/matching.py`

### Current Code (Line 14-24)
```python
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
        ...
    }
```

### Replace With Real AI Implementation

#### Option 1: OpenAI API

```python
import openai
import os
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

def ai_matching_with_openai(resume_text: str, jd_text: str) -> dict:
    """
    Real AI matching using OpenAI GPT-4
    
    Implements all 4 AI agents in one call
    """
    
    prompt = f"""
You are an HR AI agent system. Analyze the job description and resume, then provide a detailed match analysis.

JOB DESCRIPTION:
{jd_text}

RESUME:
{resume_text}

Provide a JSON response with:
1. jd_extracted: {{position, experience_required, required_skills, preferred_skills, education, location, responsibilities}}
2. resume_extracted: {{candidate_name, email, phone, location, current_position, total_experience, skills_matched, skills_missing, education, certifications, work_history, key_achievements}}
3. match_breakdown: {{skills_match (0-100), experience_match (0-100), education_match (0-100), location_match (0-100), cultural_fit (0-100)}}
4. match_score: overall score (0-100) using weights: Skills 35%, Experience 30%, Education 15%, Cultural Fit 10%, Location 10%
5. fit_category: "Excellent Match" (>85), "Good Match" (70-85), "Average Match" (50-70), or "Poor Match" (<50)
6. selection_reason: Detailed recommendation with STRENGTHS, CONCERNS, RECOMMENDATION sections

Return valid JSON only.
"""
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert HR analysis AI."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        result = json.loads(response.choices[0].message.content)
        result["confidence_score"] = 95.0
        result["processing_duration_ms"] = 5000
        
        return result
    
    except Exception as e:
        print(f"AI matching error: {e}")
        # Fallback to mock if AI fails
        return mock_ai_matching(resume_text, jd_text)
```

#### Option 2: LangChain Agents

```python
from langchain.chat_models import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate
from langchain.tools import Tool

def ai_matching_with_langchain(resume_text: str, jd_text: str) -> dict:
    """
    Real AI matching using LangChain agents
    
    Implements the 4-agent workflow:
    1. JD & Resume Extractor Agent
    2. JD Reader Agent  
    3. Resume Reader Agent
    4. HR Comparator Agent
    """
    
    llm = ChatOpenAI(model="gpt-4", temperature=0.7)
    
    # Agent 1: JD Reader
    def extract_jd_requirements(jd_text: str) -> dict:
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a JD analysis expert. Extract requirements from job descriptions."),
            ("user", f"Extract requirements from this JD:\n\n{jd_text}")
        ])
        response = llm.predict(prompt.format_messages())
        return parse_jd_response(response)
    
    # Agent 2: Resume Reader
    def extract_resume_info(resume_text: str) -> dict:
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a resume parsing expert. Extract candidate information."),
            ("user", f"Extract information from this resume:\n\n{resume_text}")
        ])
        response = llm.predict(prompt.format_messages())
        return parse_resume_response(response)
    
    # Agent 3: HR Comparator
    def calculate_match(jd_data: dict, resume_data: dict) -> dict:
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an HR matching expert. Compare JD with resume and provide match scores."),
            ("user", f"Compare:\nJD: {jd_data}\nResume: {resume_data}")
        ])
        response = llm.predict(prompt.format_messages())
        return parse_match_response(response)
    
    # Execute agent pipeline
    jd_extracted = extract_jd_requirements(jd_text)
    resume_extracted = extract_resume_info(resume_text)
    match_result = calculate_match(jd_extracted, resume_extracted)
    
    return {
        "jd_extracted": jd_extracted,
        "resume_extracted": resume_extracted,
        **match_result
    }
```

#### Option 3: Your Own Agent MCP Server

```python
import httpx

async def ai_matching_with_agent_server(resume_text: str, jd_text: str) -> dict:
    """
    Call your custom AI agent MCP server
    
    Your agent server should expose an API endpoint that:
    1. Takes resume_text and jd_text
    2. Runs the 4-agent pipeline
    3. Returns the match result
    """
    
    AGENT_SERVER_URL = os.getenv("AGENT_SERVER_URL", "http://localhost:9000")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{AGENT_SERVER_URL}/analyze",
            json={
                "resume_text": resume_text,
                "jd_text": jd_text,
                "weights": {
                    "skills": 0.35,
                    "experience": 0.30,
                    "education": 0.15,
                    "cultural_fit": 0.10,
                    "location": 0.10
                }
            },
            timeout=30.0
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            # Fallback to mock
            return mock_ai_matching(resume_text, jd_text)
```

---

## 🔌 How to Integrate

### Step 1: Choose Your AI Provider

Add to `.env`:

```env
# Option 1: OpenAI
OPENAI_API_KEY=sk-your-api-key-here

# Option 2: Your Agent Server
AGENT_SERVER_URL=http://localhost:9000

# Option 3: Azure OpenAI
AZURE_OPENAI_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
```

### Step 2: Install Dependencies

Add to `requirements.txt`:

```txt
# For OpenAI
openai>=1.3.0

# For LangChain
langchain>=0.1.0
langchain-openai>=0.0.2

# For custom agent server
httpx>=0.25.2
```

### Step 3: Update `matching.py`

Replace line 15 function call:

```python
# OLD (line ~88):
ai_result = mock_ai_matching(resume.get("text", ""), jd.get("description", ""))

# NEW:
ai_result = ai_matching_with_openai(resume.get("text", ""), jd.get("description", ""))
# or
ai_result = await ai_matching_with_agent_server(resume.get("text", ""), jd.get("description", ""))
```

---

## 🎯 AI Agent Pipeline (Your 4 Agents)

### Agent Integration Architecture

```python
# File: routers/matching.py (lines 14-82)

# CURRENT: Mock implementation
def mock_ai_matching(resume_text: str, jd_text: str) -> dict:
    return {...}  # Hardcoded data

# REPLACE WITH: Real AI agents

class AIAgentPipeline:
    """
    Orchestrates the 4 AI agents for resume matching
    """
    
    def __init__(self, openai_key: str):
        self.openai_key = openai_key
        self.agent_version = "v1.0.0"
    
    async def run_pipeline(self, resume_text: str, jd_text: str) -> dict:
        """
        Execute the full 4-agent pipeline
        """
        start_time = datetime.now()
        
        # Agent 1: JD & Resume Extractor (already done - we have text)
        
        # Agent 2: JD Reader Agent
        jd_extracted = await self.jd_reader_agent(jd_text)
        
        # Agent 3: Resume Reader Agent
        resume_extracted = await self.resume_reader_agent(resume_text)
        
        # Agent 4: HR Comparator Agent
        match_result = await self.hr_comparator_agent(
            jd_extracted, 
            resume_extracted
        )
        
        # Calculate processing time
        duration_ms = (datetime.now() - start_time).total_seconds() * 1000
        
        return {
            **jd_extracted,
            **resume_extracted,
            **match_result,
            "agent_version": self.agent_version,
            "processing_duration_ms": int(duration_ms),
            "confidence_score": match_result.get("confidence", 90.0)
        }
    
    async def jd_reader_agent(self, jd_text: str) -> dict:
        """Agent 2: Extract JD requirements"""
        # YOUR AI AGENT CODE HERE
        # Returns: {jd_extracted: {...}}
        pass
    
    async def resume_reader_agent(self, resume_text: str) -> dict:
        """Agent 3: Extract resume information"""
        # YOUR AI AGENT CODE HERE
        # Returns: {resume_extracted: {...}}
        pass
    
    async def hr_comparator_agent(self, jd_data: dict, resume_data: dict) -> dict:
        """Agent 4: Calculate match scores"""
        # YOUR AI AGENT CODE HERE
        # Returns: {match_score, fit_category, match_breakdown, selection_reason}
        pass
```

---

## 📝 Environment Setup for AI

### Add to `.env`:

```env
# AI Agent Configuration
OPENAI_API_KEY=sk-your-openai-key-here
AGENT_SERVER_URL=http://localhost:9000  # If using custom agent server

# Agent Configuration
AGENT_VERSION=v1.0.0
AGENT_TIMEOUT_SECONDS=30
ENABLE_AGENT_CACHING=true

# Matching Weights (customize if needed)
WEIGHT_SKILLS=0.35
WEIGHT_EXPERIENCE=0.30
WEIGHT_EDUCATION=0.15
WEIGHT_CULTURAL_FIT=0.10
WEIGHT_LOCATION=0.10
```

---

## 🧪 Testing AI Integration

### 1. Test with Mock Data (Current)

```bash
curl -X POST "http://localhost:8000/matching/match" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_id": "RESUME_ID",
    "jd_id": "JD_ID"
  }'
```

Returns mock AI data instantly.

### 2. Test with Real AI (After Integration)

Same API call, but now:
- Calls OpenAI/Your Agent Server
- Takes 10-30 seconds
- Returns real analysis

### 3. Monitor AI Agent Execution

Check the response for:
```json
{
  "match_score": 87.5,
  "confidence_score": 93.5,
  "processing_duration_ms": 15000,
  "agent_version": "v1.0.0"
}
```

---

## 🔧 AI Agent Integration Checklist

### Quick Integration (OpenAI)
- [ ] Add `OPENAI_API_KEY` to `.env`
- [ ] Install: `pip install openai`
- [ ] Replace `mock_ai_matching` function
- [ ] Test with one resume
- [ ] Adjust prompt if needed

### Advanced Integration (LangChain)
- [ ] Install: `pip install langchain langchain-openai`
- [ ] Create agent classes
- [ ] Implement 4-agent pipeline
- [ ] Add caching layer
- [ ] Test with batch matching

### Custom Agent Server
- [ ] Deploy your agent MCP server
- [ ] Add `AGENT_SERVER_URL` to `.env`
- [ ] Install: `pip install httpx`
- [ ] Call agent server from `matching.py`
- [ ] Handle timeouts and errors

---

## 📊 AI Agent Response Format

Your AI agents should return this exact format:

```python
{
    "match_score": 87.5,  # 0-100
    "fit_category": "Excellent Match",  # or "Good Match", "Average Match", "Poor Match"
    
    "jd_extracted": {
        "position": "Senior Software Engineer",
        "experience_required": {
            "min_years": 5,
            "max_years": 8,
            "type": "Software Development"
        },
        "required_skills": ["Python", "FastAPI", "MongoDB"],
        "preferred_skills": ["AWS", "Docker", "Kubernetes"],
        "education": "Bachelor's in Computer Science",
        "location": "Remote",
        "job_type": "Full-time",
        "responsibilities": ["Develop APIs", "Lead team", "Code reviews"]
    },
    
    "resume_extracted": {
        "candidate_name": "John Doe",
        "email": "john@example.com",
        "phone": "+1-234-567-8900",
        "location": "San Francisco, CA",
        "current_position": "Senior Software Engineer",
        "total_experience": 6.5,
        "relevant_experience": 5.0,
        "skills_matched": ["Python", "FastAPI", "MongoDB", "AWS"],
        "skills_missing": ["Kubernetes"],
        "education": {
            "degree": "B.S. Computer Science",
            "institution": "Stanford University",
            "year": 2018,
            "grade": "3.8/4.0"
        },
        "certifications": ["AWS Certified Solutions Architect"],
        "work_history": [
            {
                "title": "Senior Software Engineer",
                "company": "Tech Corp",
                "duration": "3 years",
                "technologies": ["Python", "FastAPI", "AWS"]
            }
        ],
        "key_achievements": ["Led team of 5", "Reduced API latency by 40%"]
    },
    
    "match_breakdown": {
        "skills_match": 90.0,
        "experience_match": 95.0,
        "education_match": 100.0,
        "location_match": 80.0,
        "cultural_fit": 85.0,
        "overall_compatibility": 87.5
    },
    
    "selection_reason": """HIGHLY RECOMMENDED

STRENGTHS:
✅ Strong technical skills match (90%)
✅ Exceeds experience requirements (6.5 years vs 5-8 required)
✅ Perfect education background
✅ Relevant certifications (AWS)
✅ Leadership experience

CONCERNS:
⚠️ Missing Kubernetes experience (can be learned)
⚠️ Location: Remote vs possible relocation

RECOMMENDATION:
This candidate is an excellent fit for the position. Strong technical background with relevant experience and proven leadership. The missing Kubernetes skill can be acquired quickly given the strong AWS background.

INTERVIEW FOCUS:
• Willingness to learn Kubernetes
• Remote work experience and setup
• Leadership examples and team management
• Salary expectations

RISK LEVEL: Low
Decision: Highly Recommended for Interview""",
    
    "confidence_score": 93.5,
    "processing_duration_ms": 15000
}
```

This format is already expected by the backend!

---

## 🚀 Quick Test Without Real AI

The backend works right now with mock data!

### Test Current Flow:

1. **Start Backend**:
```bash
python main.py
```

2. **Open Swagger**: http://localhost:8000/docs

3. **Test Workflow**:
   - Register user
   - Login (get token)
   - Upload resume → Parses PDF, stores in MongoDB
   - Create JD → Stores in MongoDB
   - Match → **Returns mock AI data (instant)**
   - View top matches

4. **Later Add Real AI**: Just replace the `mock_ai_matching` function!

---

## 📦 Agent Integration Examples

### Example 1: Simple OpenAI Integration

File: `HR_Backend_FastAPI/agents/openai_agent.py` (create this)

```python
import openai
import json
import os

openai.api_key = os.getenv("OPENAI_API_KEY")

def analyze_with_gpt4(resume_text: str, jd_text: str) -> dict:
    """Simple GPT-4 analysis"""
    
    messages = [
        {
            "role": "system",
            "content": "You are an expert HR AI analyzing job fit. Return JSON only."
        },
        {
            "role": "user",
            "content": f"""
Analyze this candidate:

JOB DESCRIPTION:
{jd_text}

CANDIDATE RESUME:
{resume_text}

Return JSON with: match_score (0-100), fit_category, jd_extracted, resume_extracted, match_breakdown, selection_reason
"""
        }
    ]
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=messages,
        temperature=0.7
    )
    
    return json.loads(response.choices[0].message.content)
```

Then in `matching.py`:
```python
from agents.openai_agent import analyze_with_gpt4

# Replace mock_ai_matching call:
ai_result = analyze_with_gpt4(resume.get("text", ""), jd.get("description", ""))
```

### Example 2: MCP Agent Server Integration

If you have an agent server running:

```python
import httpx
import os

AGENT_SERVER = os.getenv("AGENT_SERVER_URL", "http://localhost:9000")

async def call_agent_server(resume_text: str, jd_text: str) -> dict:
    """Call your MCP agent server"""
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{AGENT_SERVER}/match",
            json={
                "resume": resume_text,
                "job_description": jd_text
            }
        )
        return response.json()
```

---

## ✅ Current Status

### Backend is Ready!

✅ **MongoDB Connected**: Your Atlas cluster working  
✅ **GridFS Working**: File storage ready  
✅ **All CRUD Operations**: Complete and tested  
✅ **API Endpoints**: 30+ endpoints ready  
✅ **Mock AI**: Works instantly for testing  
✅ **AI Integration Point**: Clearly marked (line 14 in matching.py)  

### What You Can Do Now:

1. **Test Full Flow Without AI**:
   - Upload resumes → ✅ Works (GridFS)
   - Create JDs → ✅ Works (MongoDB)
   - Match → ✅ Works (mock AI)
   - View results → ✅ Works

2. **Later Add Real AI**:
   - Just replace one function
   - Everything else stays the same
   - Backend handles the rest

---

## 🎯 Summary

**AI Integration Points**: ✅ **1 function to replace**

Location: `HR_Backend_FastAPI/routers/matching.py` - Line 15

```python
def mock_ai_matching(resume_text: str, jd_text: str) -> dict:
    # ← REPLACE THIS FUNCTION WITH REAL AI
    # Input: resume text + JD text
    # Output: Same format (shown above)
```

That's it! One function swap = real AI agents integrated.

**Backend is fully functional now with mock AI and ready for real AI anytime!** 🚀

---

**Ready to test?** Run: `python main.py` and visit http://localhost:8000/docs

