import { useState, useEffect } from 'react';
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
import { getTopMatches, getJobDescriptions } from '../services/api';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [selectedJDId, setSelectedJDId] = useState<string | null>(null);

  // Load candidates from backend when component mounts or when switching to candidates tab
  useEffect(() => {
    if (activeTab === 'candidates' || activeTab === 'dashboard') {
      loadCandidatesFromBackend();
    }
  }, [activeTab]);

  const loadCandidatesFromBackend = async () => {
    try {
      setLoading(true);
      
      // Load job descriptions
      const jds = await getJobDescriptions();
      
      if (jds.length > 0) {
        // Load matches from ALL JDs, not just the first one
        const allCandidates: Candidate[] = [];
        
        for (const jd of jds) {
          try {
            const jdId = jd.id || jd._id;
            const matches = await getTopMatches(jdId, 50); // Increased limit to get all
            
            if (matches.top_matches && matches.top_matches.length > 0) {
              const candidatesData: Candidate[] = matches.top_matches.map((match: any) => ({
                id: match.id,
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
                },
                workflow_id: match.workflow_id || null,
                jd_id: jdId // Add JD ID for reference
              } as any));
              
              allCandidates.push(...candidatesData);
            }
          } catch (jdErr) {
            console.error(`Error loading matches for JD ${jd.id}:`, jdErr);
            // Continue with next JD even if this one fails
          }
        }
        
        // Set the first JD as selected
        setSelectedJDId(jds[0].id || jds[0]._id);
        
        // Remove duplicates (same candidate matched to multiple JDs)
        const uniqueCandidates = allCandidates.filter((candidate, index, self) =>
          index === self.findIndex((c) => c.id === candidate.id)
        );
        
        setCandidates(uniqueCandidates);
      } else {
        // No JDs yet - show empty state
        setCandidates([]);
      }
    } catch (err) {
      console.error('Error loading candidates:', err);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJobDescriptionUpload = (description: string) => {
    setJobDescription(description);
    console.log('Job description uploaded:', description);
    // Reload candidates after JD upload
    loadCandidatesFromBackend();
  };

  const handleResumeFetch = (source: string) => {
    console.log('Fetching resumes from:', source);
    // Reload candidates after fetching resumes
    loadCandidatesFromBackend();
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
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}