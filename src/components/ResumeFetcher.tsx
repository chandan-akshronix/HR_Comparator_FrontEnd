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
  AlertCircle,
  Lock,
  Sparkles,
  Star
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
  const FREE_PLAN_LIMIT = 100;  // Increased resume limit per workflow
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

      // Mark all as processing first
      filesToProcess.forEach(file => {
        setUploadedResumes(prev => prev.map(r => 
          r.file.name === file.name
            ? { ...r, status: 'processing' as const }
            : r
        ));
      });

      // Process files one by one and update status progressively
      let successCount = 0;
      let errorCount = 0;
      
      for (const file of filesToProcess) {
        try {
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
            setUploadedResumes(prev => prev.map(r => 
              r.file.name === file.name
                ? { ...r, status: 'error' as const }
                : r
            ));
            errorCount++;
            toast.error(`Failed: ${file.name}`);
          } else {
            const data = await response.json();
            // Update status to completed immediately after processing
            setUploadedResumes(prev => prev.map(r => 
              r.file.name === file.name
                ? {
                    ...r,
                    status: 'completed' as const,
                    resumeId: data.resume_id,
                    extractedData: {
                      name: file.name.replace(/\.[^/.]+$/, ''),
                      skills: ['Extracted by Backend'],
                      experience: 'Parsed from PDF'
                    }
                  }
                : r
            ));
            successCount++;
          }
        } catch (err: any) {
          console.error(`Error processing ${file.name}:`, err);
          setUploadedResumes(prev => prev.map(r => 
            r.file.name === file.name
              ? { ...r, status: 'error' as const }
              : r
          ));
          errorCount++;
          toast.error(`Error processing ${file.name}`);
        }
      }
      
      // Get updated stats and show summary
      const stats = await getUserStats();
      if (successCount > 0) {
        toast.success(`${successCount} resume(s) processed successfully!`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} resume(s) failed to process.`);
      }
      
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

    // Check if there are any pending or processing resumes
    const hasPendingOrProcessing = uploadedResumes.some(r => r.status === 'pending' || r.status === 'processing');
    if (hasPendingOrProcessing) {
      toast.error('Please wait for all resumes to finish processing before starting AI workflow');
      return;
    }
    
    // Check if there's at least one completed resume
    const hasCompletedResumes = uploadedResumes.some(r => r.status === 'completed');
    if (!hasCompletedResumes) {
      toast.error('Please process at least one resume successfully before starting AI workflow');
      return;
    }

    setIsStartingAI(true);
    
    try {
      // Get resume IDs from completed uploads
      const resumeIds = uploadedResumes
        .filter(r => r.status === 'completed' && r.resumeId)
        .map(r => r.resumeId!);
      
      if (resumeIds.length === 0) {
        toast.error('No valid resume IDs found. Please ensure resumes are processed successfully.');
        setIsStartingAI(false);
        return;
      }
      
      const selectedJDData = jobDescriptions.find(jd => jd.id === selectedJD);
      
      if (!selectedJDData?.id) {
        toast.error('Job description not found. Please select a valid job description.');
        setIsStartingAI(false);
        return;
      }
      
      console.log(`🚀 Starting AI matching with ${resumeIds.length} resumes for JD: ${selectedJDData.id}`);
      console.log(`📋 Resume IDs:`, resumeIds.slice(0, 5), resumeIds.length > 5 ? `... and ${resumeIds.length - 5} more` : '');
      
      // Show success message and redirect immediately
      toast.success(`AI processing started with ${resumeIds.length} resumes! Watch the agents work in real-time.`);
      
      // Navigate to AI Workflow tab IMMEDIATELY so user can watch progress
      onTabChange('workflow');
      
      // Start AI matching in background (don't await - let it process)
      startAIMatching(resumeIds, selectedJDData.id)
        .then(result => {
          console.log('✅ AI matching completed:', result);
          toast.success('AI processing completed successfully!');
        })
        .catch(err => {
          console.error('❌ AI matching error:', err);
          console.error('❌ Error details:', {
            message: err.message,
            stack: err.stack,
            resumeCount: resumeIds.length,
            jdId: selectedJDData.id
          });
          toast.error(`AI processing failed: ${err.message || 'Unknown error'}. Check browser console for details.`);
        })
        .finally(() => {
          setIsStartingAI(false);
        });
    } catch (err: any) {
      console.error('AI start error:', err);
      toast.error('Error starting AI: ' + err.message);
      setIsStartingAI(false);
    }
  };

  // Helper to check if ready for AI processing
  // Ready for AI if: JD selected, has resumes, and all resumes are either completed or error (no pending/processing)
  const isReadyForAI = selectedJD && 
    uploadedResumes.length > 0 && 
    uploadedResumes.some(r => r.status === 'completed') && // At least one completed resume
    uploadedResumes.every(r => r.status === 'completed' || r.status === 'error'); // All are done (completed or failed)

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
                    <Badge variant={uploadedResumes.length > FREE_PLAN_LIMIT && !isPremium ? "destructive" : "outline"} className="text-xs">
                      {uploadedResumes.length}/{isPremium ? '∞' : FREE_PLAN_LIMIT}
                    </Badge>
                  </div>
                  <Input
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    multiple
                    onChange={handleResumeUpload}
                    disabled={uploadedResumes.length > FREE_PLAN_LIMIT && !isPremium}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <p className="text-muted-foreground">
                      Supported formats: PDF, DOC, DOCX. You can select multiple files.
                    </p>
                    {!isPremium && uploadedResumes.length > FREE_PLAN_LIMIT && (
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
                  {!isPremium && uploadedResumes.length >= FREE_PLAN_LIMIT - 2 && uploadedResumes.length <= FREE_PLAN_LIMIT && (
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
                  {uploadedResumes.some(r => r.status === 'pending' || r.status === 'processing') && (
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <AlertCircle className="w-4 h-4" />
                      Please wait for all resumes to finish processing
                    </div>
                  )}
                  {!uploadedResumes.some(r => r.status === 'completed') && uploadedResumes.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <AlertCircle className="w-4 h-4" />
                      Please process at least one resume successfully
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Fetch from Portals Tab - Upgrade to Pro */}
      <TabsContent value="fetch" className="space-y-6">
        {/* Hero Section */}
        <Card className="relative overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-slate-50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-100/40 rounded-full blur-2xl"></div>
          
          <CardContent className="pt-12 pb-12 relative">
            <div className="text-center space-y-6 max-w-2xl mx-auto">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
                  <Crown className="w-10 h-10 text-white" />
                </div>
              </div>
              
              {/* Title */}
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h2 className="text-3xl font-bold text-slate-900">
                    Upgrade to Pro
                  </h2>
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-lg text-slate-600">
                  Unlock powerful portal integrations and advanced features
                </p>
              </div>
              
              {/* CTA Button */}
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LinkedIn Integration */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 bg-blue-100 rounded-bl-3xl p-3">
              <Lock className="w-4 h-4 text-blue-600" />
            </div>
            <CardHeader>
              <div className="text-4xl mb-3">💼</div>
              <CardTitle className="text-lg">LinkedIn Integration</CardTitle>
              <CardDescription>
                Connect to LinkedIn Talent Solutions API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <span>Search 900M+ professionals</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <span>Advanced filtering options</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <span>Direct candidate outreach</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Indeed Integration */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 bg-blue-100 rounded-bl-3xl p-3">
              <Lock className="w-4 h-4 text-blue-600" />
            </div>
            <CardHeader>
              <div className="text-4xl mb-3">🔍</div>
              <CardTitle className="text-lg">Indeed Resume Search</CardTitle>
              <CardDescription>
                Access Indeed's resume database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <span>200M+ resume database</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <span>Skill-based matching</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <span>Real-time availability status</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Naukri Integration */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 bg-blue-100 rounded-bl-3xl p-3">
              <Lock className="w-4 h-4 text-blue-600" />
            </div>
            <CardHeader>
              <div className="text-4xl mb-3">🇮🇳</div>
              <CardTitle className="text-lg">Naukri RMS</CardTitle>
              <CardDescription>
                India's largest job portal integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <span>100M+ Indian professionals</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <span>Location-based search</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <span>Salary range filtering</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Additional Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Pro Features Included
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Automated Sourcing</h4>
                  <p className="text-sm text-slate-600">Schedule automatic resume fetching and updates</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Bulk Processing</h4>
                  <p className="text-sm text-slate-600">Process up to 1000 resumes at once</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Priority API Access</h4>
                  <p className="text-sm text-slate-600">Higher rate limits and faster processing</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <ExternalLink className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Multi-Portal Search</h4>
                  <p className="text-sm text-slate-600">Search across all portals simultaneously</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing CTA */}
        <Card className="border-2 border-blue-200 bg-white">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise Pricing</h3>
                <p className="text-slate-600">
                  Custom plans tailored to your organization's needs
                </p>
              </div>
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Contact Sales
              </Button>
              <p className="text-xs text-slate-500">
                Get a personalized quote • Flexible pricing • Dedicated support
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}