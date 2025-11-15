import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { LogOut, Upload, Search, FileText, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { JobDescriptionUpload } from './JobDescriptionUpload';
import { ResumeFetcher } from './ResumeFetcher';
import { CandidateList } from './CandidateList';
import { AIWorkflow } from './AIWorkflow';
import { DashboardOverview } from './DashboardOverview';
import { type Candidate } from './mockData';
import { getTopMatches, getJobDescriptions, getWorkflowStatus } from '../services/api';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true); // Start with true to show skeleton immediately
  const [selectedJDId, setSelectedJDId] = useState<string | null>(null);
  const [jobDescriptions, setJobDescriptions] = useState<Array<{ id?: string; _id?: string; designation?: string; title?: string }>>([]);
  const [dataLoaded, setDataLoaded] = useState(false); // Track if data has been loaded

  const loadCandidatesFromBackend = useCallback(async (forceReload = false) => {
    // Skip if data already loaded and not forcing reload
    if (dataLoaded && !forceReload) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Load job descriptions (cached by browser, but we still need fresh data)
      const jds = await getJobDescriptions();
      setJobDescriptions(jds); // Store for use in CandidateList
      
      if (jds.length > 0) {
        // Load matches from ALL JDs to show complete candidate pool
        const allCandidates: Candidate[] = [];
        
        // Process all JDs in parallel for better performance
        // Reduced limit to 200 per JD for faster loading (can be increased if needed)
        const matchPromises = jds.map(async (jd) => {
          try {
            const jdId = jd.id || jd._id;
            // Request matches with reasonable limit for faster loading
            const matches = await getTopMatches(jdId, 200);
            
            if (matches.top_matches && matches.top_matches.length > 0) {
              return matches.top_matches.map((match: any) => ({
                id: match.id,
                resume_id: match.resume_id,  // Add resume_id for file downloads
                name: match.candidate_name || 'Unknown',
                title: match.current_position || 'Unknown Position',
                email: match.email || '',
                phone: match.phone || '',
                location: match.location || '',
                experience: match.total_experience || 0,
                skills: match.skills_matched || [],
                matchScore: Math.round(match.match_score),
                stabilityScore: Math.round(match.match_breakdown?.stability || 0),
                source: 'direct' as const,
                status: 'new' as const,
                matchBreakdown: {
                  skills: Math.round(match.match_breakdown?.skills_match || 0),
                  experience: Math.round(match.match_breakdown?.experience_match || 0),
                  location: Math.round(match.match_breakdown?.location_match || 0),
                  stability: Math.round(match.match_breakdown?.stability || 0),
                  overqualified: Math.round(match.match_breakdown?.overqualified || 0),
                },
                selectionReason: match.selection_reason || '', // Add selection reason
                workflow_id: match.workflow_id || null,
                jd_id: jdId // Add JD ID for reference
              } as any));
            }
            return [];
          } catch (jdErr) {
            console.error(`Error loading matches for JD ${jd.id}:`, jdErr);
            return [];
          }
        });
        
        // Wait for all JD queries to complete in parallel
        const allMatchResults = await Promise.all(matchPromises);
        
        // Flatten all results
        allMatchResults.forEach(candidates => {
          if (candidates) {
            allCandidates.push(...candidates);
          }
        });
        
        // Set the first JD as selected
        setSelectedJDId(jds[0].id || jds[0]._id);
        
        // Remove duplicates (same candidate matched to multiple JDs)
        const uniqueCandidates = allCandidates.filter((candidate, index, self) =>
          index === self.findIndex((c) => c.id === candidate.id)
        );
        
        setCandidates(uniqueCandidates);
        setDataLoaded(true); // Mark data as loaded
      } else {
        // No JDs yet - show empty state
        setCandidates([]);
        setDataLoaded(true);
      }
    } catch (err) {
      console.error('Error loading candidates:', err);
      setCandidates([]);
      setDataLoaded(true); // Mark as loaded even on error to prevent infinite retries
    } finally {
      setLoading(false);
    }
  }, [dataLoaded]);

  // Track if we've already loaded data for the current tab to prevent infinite loops
  const lastLoadedTabRef = useRef<string | null>(null);
  const candidatesCountRef = useRef<number>(0);
  
  // Update ref when candidates change (without triggering effect)
  useEffect(() => {
    candidatesCountRef.current = candidates.length;
  }, [candidates.length]);
  
  // Load candidates from backend when component mounts or when switching to candidates/dashboard tab
  // This refreshes data ONCE when switching tabs (no continuous polling)
  useEffect(() => {
    // Reset tab tracking when switching to a different tab (allows refresh between dashboard/candidates)
    const previousTab = lastLoadedTabRef.current;
    if (previousTab && previousTab !== activeTab) {
      lastLoadedTabRef.current = null; // Reset to allow refresh on new tab
    }
    
    // Skip if we just loaded for this same tab (prevents duplicate loads)
    if (lastLoadedTabRef.current === activeTab) {
      return;
    }
    
    // Debounce: Only load if tab stays active for 200ms
    // Prevents rapid API calls when switching tabs quickly
    const timeout = setTimeout(async () => {
      if (activeTab === 'candidates' || activeTab === 'dashboard') {
        // Always refresh when switching to these tabs to get latest data
        // Check workflow status to determine if we should force reload
        try {
          const workflowStatus = await getWorkflowStatus();
          const isCompleted = workflowStatus.status === 'completed';
          const backendMatches = workflowStatus.metrics?.topMatches || 0;
          const hasMatches = backendMatches > 0;
          
          // Force reload if:
          // 1. No candidates displayed but backend has matches
          // 2. Backend has more matches than what's displayed
          // 3. Workflow is completed (always refresh to get latest data)
          const candidateCount = candidatesCountRef.current;
          const shouldForce = hasMatches && (
            candidateCount === 0 || 
            backendMatches > candidateCount ||
            isCompleted
          );
          
          console.log('🔄 Tab switch - refreshing data:', {
            tab: activeTab,
            isCompleted,
            backendMatches,
            displayedCandidates: candidateCount,
            shouldForce
          });
          
          await loadCandidatesFromBackend(shouldForce);
          lastLoadedTabRef.current = activeTab;
        } catch (err) {
          // If workflow status check fails, just do a normal load
          console.error('Error checking workflow status on tab switch:', err);
          await loadCandidatesFromBackend(true); // Force reload on tab switch
          lastLoadedTabRef.current = activeTab;
        }
      }
    }, 200);
    
    return () => clearTimeout(timeout);
  }, [activeTab, loadCandidatesFromBackend]);

  // Track last known candidate count and workflow ID for detecting new results
  const lastCandidateCountRef = useRef<number>(0);
  const lastWorkflowIdRef = useRef<string | null>(null);

  // Check for new workflow when component mounts or tab changes (one-time check, no polling)
  useEffect(() => {
    const checkForNewWorkflow = async () => {
      try {
        const workflowStatus = await getWorkflowStatus();
        const currentWorkflowId = workflowStatus.workflowId || null;
        
        // Reset counter if this is a new workflow
        if (currentWorkflowId && currentWorkflowId !== lastWorkflowIdRef.current) {
          console.log('🆕 New workflow detected, resetting candidate count tracker', {
            oldWorkflowId: lastWorkflowIdRef.current,
            newWorkflowId: currentWorkflowId
          });
          lastCandidateCountRef.current = 0;
          lastWorkflowIdRef.current = currentWorkflowId;
          // Reset dataLoaded flag for new workflow to ensure fresh data loads
          setDataLoaded(false);
        }
      } catch (err) {
        console.debug('Workflow status check failed:', err);
      }
    };
    
    // Only check once when tab changes or component mounts (no polling)
    if (activeTab === 'candidates' || activeTab === 'dashboard') {
      checkForNewWorkflow();
    }
  }, [activeTab]);

  const handleJobDescriptionUpload = (description: string) => {
    setJobDescription(description);
    console.log('Job description uploaded:', description);
    // Reload candidates after JD upload
    loadCandidatesFromBackend();
  };

  const handleResumeFetch = (source: string) => {
    console.log('Fetching resumes from:', source);
    // Force reload candidates after fetching resumes
    loadCandidatesFromBackend(true);
  };

  const stats = [
    { title: 'Total Candidates', value: candidates.length, icon: Users, color: 'bg-blue-500' },
    { title: 'High Match (>80%)', value: candidates.filter(c => c.matchScore >= 80).length, icon: FileText, color: 'bg-green-500' },
    { title: 'Under Review', value: candidates.filter(c => c.status === 'reviewing').length, icon: Search, color: 'bg-orange-500' },
    { title: 'Job Descriptions', value: jobDescription ? 1 : 0, icon: Upload, color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg">HR Resume Comparator</h1>
                <p className="text-xs text-muted-foreground">Powered by AgenticAI</p>
              </div>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="fetch">Fetch Resumes</TabsTrigger>
            <TabsTrigger value="workflow">AI Workflow</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <DashboardOverview 
              candidates={candidates}
              jobDescription={jobDescription}
              onTabChange={setActiveTab}
              isLoading={loading}
            />
          </TabsContent>

          {/* Fetch Resumes Tab */}
          <TabsContent value="fetch" className="space-y-6">
            <ResumeFetcher onFetch={handleResumeFetch} onTabChange={setActiveTab} />
          </TabsContent>

          {/* AI Workflow Tab */}
          <TabsContent value="workflow" className="space-y-6">
            <AIWorkflow />
          </TabsContent>

          {/* Candidates Tab */}
          <TabsContent value="candidates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Candidates</CardTitle>
              </CardHeader>
              <CardContent>
                <CandidateList 
                  candidates={candidates} 
                  onCandidatesUpdate={setCandidates}
                  isPreview={false}
                  isLoading={loading}
                  jobDescriptions={jobDescriptions}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}