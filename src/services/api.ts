// API Service for HR Resume Comparator Backend
import { API_BASE_URL } from '../config';

// Token management
export const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

export const clearAuthToken = () => {
  localStorage.removeItem('auth_token');
};

// Auth APIs
export const register = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...userData, role: 'hr_manager' })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }
  
  return response.json();
};

export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }
  
  const data = await response.json();
  setAuthToken(data.access_token);
  return data;
};

export const logout = () => {
  clearAuthToken();
};

// Resume APIs - Process All Resumes (uploads files and parses them)
export const processResumes = async (files: File[]) => {
  const results = [];
  
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', 'direct');
    
    const response = await fetch(`${API_BASE_URL}/files/upload-resume`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      results.push({
        filename: file.name,
        success: false,
        error: error.detail
      });
    } else {
      const data = await response.json();
      results.push({
        filename: file.name,
        success: true,
        resume_id: data.resume_id,
        message: data.message
      });
    }
  }
  
  return results;
};

// Get all resumes
export const getResumes = async () => {
  const response = await fetch(`${API_BASE_URL}/resumes/`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch resumes');
  return response.json();
};

// Download resume file
export const downloadResume = async (resumeId: string) => {
  const response = await fetch(`${API_BASE_URL}/files/download-resume/${resumeId}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) throw new Error('Failed to download resume');
  
  // Get filename from Content-Disposition header or use default
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = 'resume.pdf';
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
    if (filenameMatch) filename = filenameMatch[1];
  }
  
  // Download file
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// View/Preview resume file (opens in new tab)
export const viewResume = async (resumeId: string) => {
  const response = await fetch(`${API_BASE_URL}/files/download-resume/${resumeId}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) throw new Error('Failed to load resume');
  
  // Get filename from Content-Disposition header
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = 'resume.pdf';
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
    if (filenameMatch) filename = filenameMatch[1];
  }
  
  // Open file in new tab for preview
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
  
  // Clean up after a delay (keep URL alive for viewing)
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 100);
};

// Job Description APIs
export const createJobDescription = async (jdData: {
  id: string;
  designation: string;
  description: string;
  company?: string;
  location?: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/job-descriptions/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(jdData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create JD');
  }
  
  return response.json();
};

export const getJobDescriptions = async () => {
  const response = await fetch(`${API_BASE_URL}/job-descriptions/`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch JDs');
  return response.json();
};

// Matching APIs - Start AI Process
export const startAIMatching = async (resumeIds: string[], jdId: string) => {
  console.log(`📤 Sending AI matching request:`, { jdId, resumeCount: resumeIds.length });
  
  const response = await fetch(`${API_BASE_URL}/matching/batch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jd_id: jdId,
      resume_ids: resumeIds,
      force_reprocess: false
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
    console.error('❌ Matching API error:', errorMessage);
    throw new Error(errorMessage);
  }
  
  const result = await response.json();
  console.log('✅ Matching API success:', result);
  return result;
};

export const getTopMatches = async (jdId: string, limit: number = 10) => {
  const response = await fetch(
    `${API_BASE_URL}/matching/top-matches/${jdId}?limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    }
  );
  
  if (!response.ok) throw new Error('Failed to fetch matches');
  return response.json();
};

// User Stats
export const getUserStats = async () => {
  const response = await fetch(`${API_BASE_URL}/files/user-stats`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
};

// Analytics
export const getAnalytics = async () => {
  const response = await fetch(`${API_BASE_URL}/analytics/stats`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch analytics');
  return response.json();
};

// Delete Job Description
export const deleteJobDescription = async (jdId: string) => {
  const response = await fetch(`${API_BASE_URL}/job-descriptions/${jdId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete JD');
  }
  
  return response.json();
};

// Delete Resume
export const deleteResume = async (resumeId: string) => {
  const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete resume');
  }
  
  return response.json();
};

// Get Recent Activity
export const getRecentActivity = async (limit: number = 10) => {
  const response = await fetch(`${API_BASE_URL}/audit-logs/recent?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch activity');
  return response.json();
};

// Get Dashboard Trends
export const getDashboardTrends = async () => {
  const response = await fetch(`${API_BASE_URL}/analytics/trends`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch trends');
  return response.json();
};

// Get AI Workflow Status
export const getWorkflowStatus = async (jdId?: string) => {
  const url = jdId 
    ? `${API_BASE_URL}/workflow/status?jd_id=${jdId}`
    : `${API_BASE_URL}/workflow/status`;
    
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch workflow status');
  return response.json();
};

// Workflow Execution APIs
export const getWorkflowExecutions = async (skip: number = 0, limit: number = 10, status?: string) => {
  const url = status 
    ? `${API_BASE_URL}/workflow/executions?skip=${skip}&limit=${limit}&status=${status}`
    : `${API_BASE_URL}/workflow/executions?skip=${skip}&limit=${limit}`;
    
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch workflow executions');
  return response.json();
};

export const getWorkflowExecution = async (workflowId: string) => {
  const response = await fetch(`${API_BASE_URL}/workflow/executions/${workflowId}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch workflow');
  return response.json();
};

export const deleteWorkflowExecution = async (workflowId: string) => {
  const response = await fetch(`${API_BASE_URL}/workflow/executions/${workflowId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete workflow');
  }
  
  return response.json();
};

