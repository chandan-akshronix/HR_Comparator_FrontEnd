import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Search, 
  Loader2, 
  CheckCircle, 
  ExternalLink, 
  Upload, 
  FileText, 
  X,
  File,
  Trash2,
  Play,
  FolderOpen,
  Zap,
  Crown,
  AlertCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { processResumes, getUserStats, createJobDescription, startAIMatching, getAuthToken } from '../services/api';
import { API_BASE_URL } from '../config';

interface ResumeFetcherProps {
  onFetch: (source: string) => void;
  onTabChange: (tab: string) => void;
}

interface JobDescription {
  id: string;
  title: string;
  file?: File;
  content: string;
  uploadedAt: Date;
}

interface UploadedResume {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  resumeId?: string;  // Backend resume ID
  extractedData?: {
    name: string;
    skills: string[];
    experience: string;
  };
}

export function ResumeFetcher({ onFetch, onTabChange }: ResumeFetcherProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [isFetching, setIsFetching] = useState<string | null>(null);
  const [fetchedSources, setFetchedSources] = useState<string[]>([]);
  
  // Job Description states
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [currentJD, setCurrentJD] = useState('');
  const [currentJDTitle, setCurrentJDTitle] = useState('');
  const [selectedJD, setSelectedJD] = useState<string | null>(null);
  const [isUploadingJD, setIsUploadingJD] = useState(false);

  // Resume Upload states
  const [uploadedResumes, setUploadedResumes] = useState<UploadedResume[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStartingAI, setIsStartingAI] = useState(false);
  
  // Free plan limit
  const FREE_PLAN_LIMIT = 10;
  const isPremium = false; // Set to true for premium users

  const sources = [
    { 
      name: 'LinkedIn', 
      icon: '💼',
      description: 'Professional networking platform',
      apiEndpoint: 'linkedin.com/api'
    },
    { 
      name: 'Indeed', 
      icon: '🔍',
      description: 'Global job search engine',
      apiEndpoint: 'indeed.com/api'
    },
    { 
      name: 'Naukri.com', 
      icon: '🇮🇳',
      description: 'India\'s leading job portal',
      apiEndpoint: 'naukri.com/api'
    },
  ];

  const handleFetch = async (sourceName: string) => {
    setIsFetching(sourceName);
    onFetch(sourceName);
    
    // Simulate API call
    setTimeout(() => {
      setIsFetching(null);
      setFetchedSources(prev => [...prev, sourceName]);
    }, 2000);
  };

  const handleFetchAll = async () => {
    for (const source of sources) {
      await new Promise(resolve => {
        handleFetch(source.name);
        setTimeout(resolve, 2500);
      });
    }
  };

  // Job Description handlers
  const handleAddJD = async () => {
    if (currentJDTitle.trim() && currentJD.trim()) {
      try {
        // Generate custom JD ID
        const jdId = `JD-${Date.now()}`;
        
        // Call backend API
        await createJobDescription({
          id: jdId,
          designation: currentJDTitle,
          description: currentJD,
          status: 'active'
        });
        
        // Add to local state
        const newJD: JobDescription = {
          id: jdId,
          title: currentJDTitle,
          content: currentJD,
          uploadedAt: new Date()
        };
        setJobDescriptions(prev => [...prev, newJD]);
        
        // Clear form
        setCurrentJDTitle('');
        setCurrentJD('');
        
        toast.success('Job description created successfully!');
      } catch (err: any) {
        toast.error('Error creating JD: ' + err.message);
      }
    }
  };

  const handleJDFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingJD(true);
    
    try {
      // Generate custom JD ID
      const jdId = `JD-${Date.now()}`;
      const designation = file.name.replace(/\.[^/.]+$/, '');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jd_id', jdId);
      formData.append('designation', designation);
      
      // Call backend - it will parse the file
      const response = await fetch(`${API_BASE_URL}/files/upload-jd`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail);
      }
      
      const result = await response.json();
      
      // Add to local state
      const newJD: JobDescription = {
        id: jdId,
        title: designation,
        file: file,
        content: 'File uploaded - text extracted by backend',
        uploadedAt: new Date()
      };
      setJobDescriptions(prev => [...prev, newJD]);
      
      toast.success('Job description uploaded and parsed successfully!');
    } catch (err: any) {
      const errorMsg = err.message || 'Unknown error';
      if (errorMsg.includes('already exists')) {
        toast.error('This job description already exists in the database. Please check the existing JDs.');
      } else {
        toast.error('Error uploading JD: ' + errorMsg);
      }
    } finally {
      setIsUploadingJD(false);
      e.target.value = '';
    }
  };

  const handleDeleteJD = async (id: string) => {
    try {
      // Call backend to delete JD
      await fetch(`${API_BASE_URL}/job-descriptions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      // Update local state
      setJobDescriptions(prev => prev.filter(jd => jd.id !== id));
      if (selectedJD === id) {
        setSelectedJD(null);
      }
      
      toast.success('Job description deleted successfully');
    } catch (err: any) {
      toast.error('Error deleting JD: ' + err.message);
    }
  };

  // Resume Upload handlers
  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const filesArray = Array.from(files);
      const currentCount = uploadedResumes.length;
      const totalCount = currentCount + filesArray.length;
      
      // Check free plan limit
      if (!isPremium && totalCount > FREE_PLAN_LIMIT) {
        const allowedCount = FREE_PLAN_LIMIT - currentCount;
        toast.error(
          `Free plan allows only ${FREE_PLAN_LIMIT} resumes. You can upload ${allowedCount} more file(s). Upgrade to Pro for unlimited uploads!`,
          { duration: 5000 }
        );
        
        // Only take the allowed number of files
        if (allowedCount > 0) {
          const allowedFiles = filesArray.slice(0, allowedCount);
          const newResumes: UploadedResume[] = allowedFiles.map(file => ({
            id: `${Date.now()}-${file.name}`,
            file,
            status: 'pending'
          }));
          setUploadedResumes(prev => [...prev, ...newResumes]);
          toast.success(`${allowedCount} resume(s) uploaded successfully`);
        }
      } else {
        const newResumes: UploadedResume[] = filesArray.map(file => ({
          id: `${Date.now()}-${file.name}`,
          file,
          status: 'pending'
        }));
        setUploadedResumes(prev => [...prev, ...newResumes]);
        toast.success(`${filesArray.length} resume(s) uploaded successfully`);
      }
      
      // Reset input
      e.target.value = '';
    }
  };

  const handleDeleteResume = (id: string) => {
    setUploadedResumes(prev => prev.filter(r => r.id !== id));
  };

  const handleProcessResumes = async () => {
    if (!selectedJD) {
      toast.error('Please select a job description first');
      return;
    }
    
    setIsProcessing(true);

    try {
      // Get files to process
      const filesToProcess = uploadedResumes
        .filter(r => r.status === 'pending')
        .map(r => r.file);
      
      if (filesToProcess.length === 0) {
        toast.info('No pending resumes to process');
        setIsProcessing(false);
        return;
      }

      // Call backend - it will parse PDFs and store in MongoDB
      const results = await processResumes(filesToProcess);
      
      // Update UI based on results
      results.forEach((result: any) => {
        if (result.success) {
          setUploadedResumes(prev => prev.map(r => 
            r.file.name === result.filename
              ? {
                  ...r,
                  status: 'completed' as const,
                  resumeId: result.resume_id,
                  extractedData: {
                    name: result.filename.replace(/\.[^/.]+$/, ''),
                    skills: ['Extracted by Backend'],
                    experience: 'Parsed from PDF'
                  }
                }
              : r
          ));
        } else {
          setUploadedResumes(prev => prev.map(r => 
            r.file.name === result.filename
              ? { ...r, status: 'error' as const }
              : r
          ));
          toast.error(`Failed: ${result.filename}`);
        }
      });
      
      // Get updated stats
      const stats = await getUserStats();
      toast.success(`Resumes processed! ${stats.remaining} uploads remaining.`);
      
    } catch (err: any) {
      console.error('Processing error:', err);
      toast.error('Error processing resumes: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: UploadedResume['status']) => {
    switch (status) {
      case 'pending': return 'bg-slate-500';
      case 'processing': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
    }
  };

  const getStatusLabel = (status: UploadedResume['status']) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'processing': return 'Processing';
      case 'completed': return 'Completed';
      case 'error': return 'Error';
    }
  };

  const handleStartAIProcess = async () => {
    if (!selectedJD) {
      toast.error('Please select a job description first');
      return;
    }
    
    if (uploadedResumes.length === 0) {
      toast.error('Please upload resumes first');
      return;
    }

    const allResumesProcessed = uploadedResumes.every(r => r.status === 'completed');
    if (!allResumesProcessed) {
      toast.error('Please process all resumes before starting AI workflow');
      return;
    }

    setIsStartingAI(true);
    
    try {
      // Get resume IDs from completed uploads
      const resumeIds = uploadedResumes
        .filter(r => r.status === 'completed' && r.resumeId)
        .map(r => r.resumeId!);
      
      const selectedJDData = jobDescriptions.find(jd => jd.id === selectedJD);
      
      // Start AI matching - backend will match all resumes with this JD
      const result = await startAIMatching(resumeIds, selectedJDData?.id || selectedJD);
      
      console.log('AI matching started:', result);
      toast.success('AI processing started! Check the AI Workflow tab to monitor progress.');
      
      // Navigate to AI Workflow tab
      onTabChange('workflow');
    } catch (err: any) {
      console.error('AI start error:', err);
      toast.error('Error starting AI: ' + err.message);
    } finally {
      setIsStartingAI(false);
    }
  };

  // Helper to check if ready for AI processing
  const isReadyForAI = selectedJD && uploadedResumes.length > 0 && uploadedResumes.every(r => r.status === 'completed');

  return (
    <Tabs defaultValue="upload" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="upload">Upload & Process</TabsTrigger>
        <TabsTrigger value="fetch">Fetch from Portals</TabsTrigger>
      </TabsList>

      {/* Upload & Process Tab */}
      <TabsContent value="upload" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Description Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Job Descriptions
                </CardTitle>
                <CardDescription>
                  Upload or create job descriptions for matching
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload JD File */}
                <div className="space-y-2">
                  <Label htmlFor="jd-file-upload">Upload JD File</Label>
                  <div className="flex gap-2">
                    <Input
                      id="jd-file-upload"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleJDFileUpload}
                      className="flex-1"
                      disabled={isUploadingJD}
                    />
                  </div>
                  {isUploadingJD && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-600">Uploading job description...</span>
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">Or create manually</span>
                  </div>
                </div>

                {/* Manual JD Entry */}
                <div className="space-y-2">
                  <Label htmlFor="jd-title">Job Title</Label>
                  <Input
                    id="jd-title"
                    placeholder="e.g., Senior Full Stack Developer"
                    value={currentJDTitle}
                    onChange={(e) => setCurrentJDTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jd-content">Job Description</Label>
                  <Textarea
                    id="jd-content"
                    placeholder="Paste or type job description..."
                    value={currentJD}
                    onChange={(e) => setCurrentJD(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>

                <Button 
                  onClick={handleAddJD}
                  disabled={!currentJDTitle.trim() || !currentJD.trim()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add Job Description
                </Button>
              </CardContent>
            </Card>

            {/* Uploaded JDs List */}
            {jobDescriptions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Saved Job Descriptions</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {jobDescriptions.length} {jobDescriptions.length === 1 ? 'File' : 'Files'} Uploaded
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {jobDescriptions.map((jd) => (
                    <div
                      key={jd.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedJD === jd.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => setSelectedJD(jd.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate">{jd.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(jd.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {selectedJD === jd.id && (
                          <Badge className="bg-blue-500">Selected</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteJD(jd.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resume Upload Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Upload Resumes
                </CardTitle>
                <CardDescription>
                  Upload multiple resumes for AI processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="resume-upload">Select Resume Files</Label>
                    <Badge variant={uploadedResumes.length >= FREE_PLAN_LIMIT && !isPremium ? "destructive" : "outline"} className="text-xs">
                      {uploadedResumes.length}/{isPremium ? '∞' : FREE_PLAN_LIMIT}
                    </Badge>
                  </div>
                  <Input
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    multiple
                    onChange={handleResumeUpload}
                    disabled={uploadedResumes.length >= FREE_PLAN_LIMIT && !isPremium}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <p className="text-muted-foreground">
                      Supported formats: PDF, DOC, DOCX. You can select multiple files.
                    </p>
                    {!isPremium && uploadedResumes.length >= FREE_PLAN_LIMIT && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-xs h-auto p-0 text-orange-600 hover:text-orange-700"
                      >
                        <Crown className="w-3 h-3 mr-1" />
                        Upgrade to Pro
                      </Button>
                    )}
                  </div>
                  
                  {/* Free Plan Limit Warning */}
                  {!isPremium && uploadedResumes.length >= FREE_PLAN_LIMIT - 2 && uploadedResumes.length < FREE_PLAN_LIMIT && (
                    <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                      <div className="text-xs text-orange-800">
                        <p className="mb-1">You're approaching the free plan limit ({uploadedResumes.length}/{FREE_PLAN_LIMIT} resumes).</p>
                        <p>Upgrade to Pro for unlimited resume uploads!</p>
                      </div>
                    </div>
                  )}
                </div>

                {uploadedResumes.length > 0 && (
                  <>
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm">Uploaded Files</p>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            {uploadedResumes.length} {uploadedResumes.length === 1 ? 'Resume' : 'Resumes'}
                          </Badge>
                        </div>
                        {selectedJD && (
                          <Badge variant="outline" className="text-xs">
                            JD: {jobDescriptions.find(jd => jd.id === selectedJD)?.title}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {uploadedResumes.map((resume) => (
                          <div
                            key={resume.id}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <File className="w-5 h-5 text-slate-600 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm truncate">{resume.file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(resume.file.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge className={getStatusColor(resume.status)}>
                                {getStatusLabel(resume.status)}
                              </Badge>
                              {resume.status === 'processing' && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              )}
                              {resume.status === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteResume(resume.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleProcessResumes}
                      disabled={isProcessing || uploadedResumes.every(r => r.status === 'completed')}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing Resumes...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Process All Resumes
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Processing Results */}
            {uploadedResumes.some(r => r.status === 'completed') && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Processing Complete
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {uploadedResumes.filter(r => r.status === 'completed').map((resume) => (
                      <div key={resume.id} className="bg-white rounded-lg p-3 border border-green-200">
                        <p className="text-sm mb-2">{resume.extractedData?.name}</p>
                        <div className="flex gap-2 flex-wrap">
                          {resume.extractedData?.skills.map((skill, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Experience: {resume.extractedData?.experience}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4" onClick={() => onTabChange('candidates')}>
                    View in Candidates Tab
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Start AI Process Button */}
        {jobDescriptions.length > 0 && uploadedResumes.length > 0 && (
          <Card className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="mb-1">Ready to Start AI Processing</h3>
                    <p className="text-sm text-muted-foreground">
                      {jobDescriptions.length} JD{jobDescriptions.length > 1 ? 's' : ''} and {uploadedResumes.length} resume{uploadedResumes.length > 1 ? 's' : ''} uploaded. 
                      Start the AI agents to analyze and match candidates.
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={handleStartAIProcess}
                  disabled={!isReadyForAI || isStartingAI}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shrink-0"
                >
                  {isStartingAI ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Starting AI...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Start AI Process
                    </>
                  )}
                </Button>
              </div>
              {!isReadyForAI && (
                <div className="mt-4 space-y-2">
                  {!selectedJD && (
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <AlertCircle className="w-4 h-4" />
                      Please select a job description
                    </div>
                  )}
                  {uploadedResumes.some(r => r.status !== 'completed') && (
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <AlertCircle className="w-4 h-4" />
                      Please process all resumes before starting AI workflow
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Fetch from Portals Tab */}
      <TabsContent value="fetch" className="space-y-6">
        {/* Search Parameters */}
        <Card>
          <CardHeader>
            <CardTitle>Search Parameters</CardTitle>
            <CardDescription>
              Define search criteria for fetching resumes from job portals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search-query">Job Title / Keywords</Label>
                <Input
                  id="search-query"
                  placeholder="e.g., Software Engineer, React Developer"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Bangalore, Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={handleFetchAll} 
              disabled={!searchQuery || isFetching !== null}
              className="w-full"
            >
              {isFetching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fetching from {isFetching}...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Fetch from All Sources
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Individual Sources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sources.map((source) => {
            const isFetchingThis = isFetching === source.name;
            const isFetched = fetchedSources.includes(source.name);

            return (
              <Card key={source.name} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{source.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{source.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {source.description}
                        </CardDescription>
                      </div>
                    </div>
                    {isFetched && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Fetched
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ExternalLink className="w-3 h-3" />
                    <code className="bg-slate-100 px-2 py-1 rounded">
                      {source.apiEndpoint}
                    </code>
                  </div>
                  <Button
                    onClick={() => handleFetch(source.name)}
                    disabled={!searchQuery || isFetchingThis}
                    className="w-full"
                    variant={isFetched ? "outline" : "default"}
                  >
                    {isFetchingThis ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Fetching...
                      </>
                    ) : isFetched ? (
                      'Fetch Again'
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Fetch Resumes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="text-blue-600">ℹ️</div>
              <div className="text-sm text-blue-900">
                <p className="mb-1">
                  <strong>Note:</strong> This is a demo with mock data. In production:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Connect to LinkedIn Talent Solutions API</li>
                  <li>Integrate Indeed Resume API with authentication</li>
                  <li>Set up Naukri RMS API credentials</li>
                  <li>Configure rate limiting and API quotas</li>
                  <li>Implement data privacy compliance (GDPR, etc.)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}