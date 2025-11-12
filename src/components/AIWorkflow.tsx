import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getWorkflowStatus, getWorkflowExecutions } from '../services/api';
import { 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  FileText, 
  Users, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
  Database,
  Brain,
  BarChart3,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Download,
  History
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

type AgentStatus = 'completed' | 'in-progress' | 'pending' | 'idle';

interface AgentStep {
  id: string;
  name: string;
  status: AgentStatus;
  icon: any;
  timestamp?: string;
  duration?: string;
  description?: string;
  confidence?: number;
  inputData?: any;
  analysis?: any;
  output?: any;
}

interface WorkflowHistory {
  id: string;
  timestamp: string;
  jdId: string;
  jdTitle: string;
  totalCandidates: number;
  completionStatus: string;
  agents: AgentStep[];
  metrics: any;
  progress: any;
}

export function AIWorkflow() {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentStep[]>([]);
  const [metrics, setMetrics] = useState({
    totalCandidates: 0,
    processingTime: '0s',
    matchRate: '0%',
    topMatches: 0
  });
  const [progress, setProgress] = useState({
    completed: 0,
    total: 4,
    percentage: 0
  });
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowHistory[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('current');

  // Load workflow history from database on mount
  useEffect(() => {
    loadWorkflowHistoryFromDB();
  }, []);

  const loadWorkflowHistoryFromDB = async () => {
    try {
      console.log('🔄 Loading workflow history from database...');
      const workflows = await getWorkflowExecutions(0, 10);
      console.log('📊 Workflows received from API:', workflows);
      console.log('📊 Number of workflows:', Array.isArray(workflows) ? workflows.length : 'Not an array');
      
      // Debug: Check agents in first workflow from API
      if (workflows && workflows.length > 0) {
        console.log('🔍 RAW First workflow from API:', workflows[0]);
        console.log('🔍 RAW Agents from API:', workflows[0].agents);
      }
      
      // Convert database workflows to frontend format
      const formattedHistory: WorkflowHistory[] = workflows.map((w: any) => {
        console.log('🔧 Formatting workflow:', w.workflow_id);
        console.log('🔧 Raw agents before mapping:', w.agents);
        
        return {
        id: w.workflow_id,
        timestamp: w.started_at,
        jdId: w.jd_id,
        jdTitle: w.jd_title,
        totalCandidates: w.total_resumes,
        completionStatus: w.status === 'completed' ? 'Completed' 
                        : w.status === 'in_progress' ? 'In Progress' 
                        : 'Pending',
        agents: w.agents?.map((a: any) => {
          console.log('🔧 Mapping agent:', a);
          const mappedAgent = {
            id: a.agent_id,
            name: a.name,
            status: a.status as AgentStatus,
            icon: getIconForAgent(a.agent_id),
            timestamp: a.started_at,
            duration: a.duration_ms ? `${(a.duration_ms / 1000).toFixed(1)}s` : undefined,
            description: a.name || 'Processing step'
          };
          console.log('🔧 Mapped agent:', mappedAgent);
          return mappedAgent;
        }) || [
          {id: 'jd-reader', name: 'JD Reader (Direct Parsing)', status: 'idle' as AgentStatus, icon: FileText, description: 'Waiting for JD upload'},
          {id: 'resume-reader', name: 'Resume Reader (Direct Parsing)', status: 'idle' as AgentStatus, icon: Users, description: 'Waiting for resumes'},
          {id: 'hr-comparator', name: 'HR Comparator Agent (AI)', status: 'idle' as AgentStatus, icon: BarChart3, description: 'Waiting to start AI matching'}
        ],
        metrics: w.metrics || {
          totalCandidates: w.total_resumes || 0,
          processingTime: '0s',
          matchRate: '0%',
          topMatches: 0
        },
        progress: w.progress || {
          completed: 0,
          total: 3,
          percentage: 0
        }
      };
      });
      
      console.log('✅ Formatted workflow history:', formattedHistory);
      console.log('✅ Number formatted:', formattedHistory.length);
      
      // Debug: Check first workflow's agents
      if (formattedHistory.length > 0) {
        console.log('🔍 First workflow agents:', formattedHistory[0].agents);
        if (formattedHistory[0].agents && formattedHistory[0].agents.length > 0) {
          console.log('🔍 First agent details:', formattedHistory[0].agents[0]);
        }
      }
      
      setWorkflowHistory(formattedHistory);
    } catch (err) {
      console.error('❌ Error loading workflow history from DB:', err);
      // Fallback to localStorage if API fails
      const savedHistory = localStorage.getItem('workflowHistory');
      if (savedHistory) {
        try {
          const history = JSON.parse(savedHistory);
          console.log('📦 Loaded from localStorage:', history.length, 'workflows');
          setWorkflowHistory(history);
        } catch (err2) {
          console.error('❌ Error loading from localStorage:', err2);
        }
      }
    }
  };

  // Fetch real workflow status from API
  useEffect(() => {
    if (selectedHistoryId === 'current') {
      loadWorkflowStatus();
      // Refresh every 5 seconds if monitoring is active
      const interval = isMonitoring ? setInterval(loadWorkflowStatus, 5000) : null;
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      // Load selected history
      loadHistoricalWorkflow(selectedHistoryId);
    }
  }, [isMonitoring, selectedHistoryId]);

  const saveWorkflowToHistory = (workflowData: any) => {
    // Note: Workflows are now saved to database automatically by backend
    // This function is kept for backward compatibility
    // Just reload from database to get latest
    loadWorkflowHistoryFromDB();
  };

  const loadHistoricalWorkflow = (historyId: string) => {
    console.log('📜 Loading historical workflow:', historyId);
    const historyEntry = workflowHistory.find(h => h.id === historyId);
    console.log('📜 Found history entry:', historyEntry);
    console.log('📜 History entry agents:', historyEntry?.agents);
    
    if (historyEntry) {
      // Map agents from history and ensure they have icons
      const agentsWithIcons = historyEntry.agents.map((agent: any) => {
        console.log('🔍 Processing agent:', agent);
        return {
          id: agent.id,
          name: agent.name,
          status: agent.status as AgentStatus,  // Keep the actual status from DB!
          icon: agent.icon || getIconForAgent(agent.id),
          timestamp: agent.timestamp,
          duration: agent.duration,
          description: agent.description || ''
        };
      });
      
      console.log('✅ Setting agents with correct status:', agentsWithIcons);
      console.log('📊 Metrics:', historyEntry.metrics);
      console.log('📊 Progress:', historyEntry.progress);
      
      setAgents(agentsWithIcons);
      
      const metricsToSet = historyEntry.metrics || {
        totalCandidates: historyEntry.totalCandidates || 0,
        processingTime: '0s',
        matchRate: '0%',
        topMatches: 0
      };
      console.log('📊 Setting metrics:', metricsToSet);
      setMetrics(metricsToSet);
      
      const progressToSet = historyEntry.progress || {
        completed: 2,
        total: 3,
        percentage: 66
      };
      console.log('📊 Setting progress:', progressToSet);
      setProgress(progressToSet);
      
      setIsMonitoring(false); // Disable monitoring for historical data
      console.log('✅ Historical workflow loaded successfully');
    } else {
      console.log('❌ History entry not found for:', historyId);
    }
  };

  const loadWorkflowStatus = async () => {
    try {
      setLoading(true);
      const data = await getWorkflowStatus();
      
      if (data.success) {
        // Map backend agents to frontend format
        const mappedAgents: AgentStep[] = data.agents.map((agent: any) => ({
          id: agent.id,
          name: agent.name,
          status: agent.status as AgentStatus,
          icon: getIconForAgent(agent.id),
          timestamp: agent.timestamp,
          duration: agent.duration,
          description: agent.description,
          confidence: agent.confidence,
          inputData: agent.metrics,
          analysis: agent.metrics,
          output: agent.metrics
        }));
        
        setAgents(mappedAgents);
        setMetrics(data.metrics);
        setProgress(data.progress);
        setIsMonitoring(data.monitoring);

        // Reload workflow history from database
        if (data.jdId && data.jdTitle) {
          loadWorkflowHistoryFromDB();
        }
      } else {
        // No data yet - show idle steps (only HR Comparator is actual AI agent)
        setAgents([
          {id: 'jd-reader', name: 'JD Reader (Direct Parsing)', status: 'idle', icon: FileText, description: 'Waiting for JD upload'},
          {id: 'resume-reader', name: 'Resume Reader (Direct Parsing)', status: 'idle', icon: Users, description: 'Waiting for resumes'},
          {id: 'hr-comparator', name: 'HR Comparator Agent (AI)', status: 'idle', icon: BarChart3, description: 'Waiting to start AI matching'}
        ]);
      }
    } catch (err) {
      console.error('Error loading workflow:', err);
      // Show idle state on error (only 3 steps: 2 parsing + 1 AI agent)
      setAgents([
        {id: 'jd-reader', name: 'JD Reader (Direct Parsing)', status: 'idle', icon: FileText, description: 'Waiting for JD upload'},
        {id: 'resume-reader', name: 'Resume Reader (Direct Parsing)', status: 'idle', icon: Users, description: 'Waiting for resumes'},
        {id: 'hr-comparator', name: 'HR Comparator Agent (AI)', status: 'idle', icon: BarChart3, description: 'Waiting to start AI matching'}
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getIconForAgent = (agentId: string) => {
    switch (agentId) {
      case 'jd-reader': return FileText;
      case 'resume-reader': return Users;
      case 'hr-comparator': return BarChart3;
      default: return Activity;
    }
  };

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-500 border-green-500';
      case 'in-progress': return 'bg-blue-500 border-blue-500';
      case 'pending': return 'bg-slate-200 border-slate-300';
      case 'idle': return 'bg-slate-100 border-slate-200';
    }
  };

  const getStatusTextColor = (status: AgentStatus) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in-progress': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-slate-600 bg-slate-50';
      case 'idle': return 'text-slate-500 bg-slate-50';
    }
  };

  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in-progress': return Clock;
      case 'pending': return Clock;
      case 'idle': return Clock;
    }
  };

  const getStatusLabel = (status: AgentStatus) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in-progress': return 'In Progress';
      case 'pending': return 'Pending';
      case 'idle': return 'Idle';
    }
  };

  const totalAgents = progress.total;
  const completedAgents = progress.completed;
  const overallProgress = progress.percentage;

  const formatHistoryDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl border border-slate-700">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjA1Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-100"></div>
        
        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 shadow-lg">
                <Brain className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl">AI Agent Execution Pipeline</h2>
                  {selectedHistoryId !== 'current' && (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                      <History className="w-3 h-3 mr-1" />
                      Historical View
                    </Badge>
                  )}
                </div>
                <div className="text-slate-300 text-sm flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${isMonitoring && selectedHistoryId === 'current' ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`}></span>
                  {selectedHistoryId === 'current' 
                    ? (isMonitoring ? 'Live monitoring active' : 'Monitoring paused')
                    : 'Viewing saved workflow'}
                  {' • '}{completedAgents} of {totalAgents} steps completed (1 AI Agent)
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white/5 hover:bg-white/10 text-white border-white/20 backdrop-blur-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadWorkflowStatus}
                disabled={loading}
                className="bg-white/5 hover:bg-white/10 text-white border-white/20 backdrop-blur-sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant={isMonitoring ? "secondary" : "outline"} 
                size="sm"
                onClick={() => setIsMonitoring(!isMonitoring)}
                disabled={selectedHistoryId !== 'current'}
                className={isMonitoring 
                  ? "bg-green-600 text-white hover:bg-green-700 border-0" 
                  : "bg-white/5 hover:bg-white/10 text-white border-white/20"
                }
              >
                {isMonitoring ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Overall Progress</span>
              <span className="text-white">{Math.round(overallProgress)}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 rounded-full"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Quick Stats - REAL DATA */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
              <div className="text-slate-400 text-xs mb-1">Total Candidates</div>
              <div className="text-white text-xl">{loading ? '...' : metrics.totalCandidates}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
              <div className="text-slate-400 text-xs mb-1">Processing Time</div>
              <div className="text-white text-xl">{loading ? '...' : metrics.processingTime}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
              <div className="text-slate-400 text-xs mb-1">Match Rate</div>
              <div className="text-white text-xl">{loading ? '...' : metrics.matchRate}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
              <div className="text-slate-400 text-xs mb-1">Top Matches</div>
              <div className="text-white text-xl">{loading ? '...' : metrics.topMatches}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow History Selector - Always Visible */}
      <Card className="border shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <History className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-800">Workflow History</h3>
              {workflowHistory.length > 0 ? (
                <Badge variant="outline" className="ml-2 text-xs bg-blue-100 text-blue-700 border-blue-300">
                  {workflowHistory.length} {workflowHistory.length === 1 ? 'run' : 'runs'}
                </Badge>
              ) : (
                <Badge variant="outline" className="ml-2 text-xs bg-slate-100 text-slate-600 border-slate-300">
                  No history yet
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">View:</span>
              <Select value={selectedHistoryId} onValueChange={setSelectedHistoryId}>
                <SelectTrigger className="w-[320px] bg-white">
                  <SelectValue placeholder="Select workflow run" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="font-semibold">Current Workflow (Live)</span>
                    </div>
                  </SelectItem>
                  {workflowHistory.length === 0 && (
                    <SelectItem value="no-history" disabled>
                      <div className="flex items-center gap-2 text-slate-400">
                        <span className="text-sm italic">No previous workflows yet</span>
                      </div>
                    </SelectItem>
                  )}
                  {workflowHistory.map((history) => (
                    <SelectItem key={history.id} value={history.id}>
                      <div className="flex flex-col py-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{history.jdTitle}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              history.completionStatus === 'Completed' 
                                ? 'bg-green-50 text-green-700 border-green-300' 
                                : history.completionStatus === 'In Progress'
                                ? 'bg-blue-50 text-blue-700 border-blue-300'
                                : 'bg-amber-50 text-amber-700 border-amber-300'
                            }`}
                          >
                            {history.completionStatus === 'Completed' && '✓ '}
                            {history.completionStatus === 'In Progress' && '⏳ '}
                            {history.completionStatus === 'Pending' && '⏸ '}
                            {history.completionStatus}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          <span className="font-mono text-slate-400">ID: {history.id}</span> • {formatHistoryDate(history.timestamp)} • {history.totalCandidates} candidates
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedHistoryId !== 'current' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedHistoryId('current')}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  Back to Current
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Flow Visualization */}
      <Card className="overflow-hidden border shadow-lg bg-white">
        <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Workflow Pipeline
            </h3>
            <Badge variant="outline" className="text-xs">
              {completedAgents}/{totalAgents} Complete • 1 AI Agent
            </Badge>
          </div>
        </div>
        <CardContent className="p-8 bg-gradient-to-b from-white to-slate-50/50">
          {/* Agent Cards - Horizontal Line */}
          <div className="flex items-center justify-center gap-4">
            {agents.map((agent, index) => {
              const StatusIcon = getStatusIcon(agent.status);
              const AgentIcon = agent.icon;
              const isExpanded = expandedAgent === agent.id;
              
              return (
                <div key={agent.id} className="flex items-center gap-4">
                  {/* Agent Card */}
                  <div 
                    className={`group relative flex flex-col items-center p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer bg-white hover:shadow-xl w-56 h-64 ${
                      agent.status === 'completed' ? 'border-green-200 shadow-green-100' :
                      agent.status === 'in-progress' ? 'border-blue-200 shadow-blue-100' :
                      'border-slate-200 shadow-sm'
                    } ${
                      isExpanded ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg' : 'hover:border-blue-300'
                    }`}
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                  >
                    {/* Status indicator line */}
                    <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
                      agent.status === 'completed' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      agent.status === 'in-progress' ? 'bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse' :
                      'bg-slate-200'
                    }`} />
                    
                    {/* Icon Container */}
                    <div className={`relative w-16 h-16 rounded-lg flex items-center justify-center mb-3 transition-all duration-300 ${
                      agent.status === 'completed' ? 'bg-green-50' :
                      agent.status === 'in-progress' ? 'bg-blue-50' :
                      'bg-slate-50'
                    } ${isExpanded ? 'scale-110' : 'group-hover:scale-105'}`}>
                      {AgentIcon && <AgentIcon className={`w-8 h-8 ${
                        agent.status === 'completed' ? 'text-green-600' :
                        agent.status === 'in-progress' ? 'text-blue-600' :
                        'text-slate-400'
                      }`} />}
                      
                      {/* Status Badge */}
                      <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md ${
                        agent.status === 'completed' ? 'bg-green-500' :
                        agent.status === 'in-progress' ? 'bg-blue-500' :
                        'bg-slate-300'
                      }`}>
                        <StatusIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    
                    {/* Agent Name - Fixed height for consistency */}
                    <div className="h-14 flex items-center justify-center mb-2 px-2">
                      <p className="text-sm text-center leading-tight">{agent.name}</p>
                    </div>
                    
                    <Badge 
                      className={`text-xs ${getStatusTextColor(agent.status)} border-0 mb-2`}
                      variant="secondary"
                    >
                      {getStatusLabel(agent.status)}
                    </Badge>
                    
                    {/* Duration */}
                    {agent.duration && (
                      <div className="mt-auto text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {agent.duration}
                      </div>
                    )}

                    {/* Confidence indicator */}
                    {agent.confidence && (
                      <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                        {agent.confidence}%
                      </div>
                    )}
                  </div>

                  {/* Connection Arrow */}
                  {index < agents.length - 1 && (
                    <div className="flex flex-col items-center">
                      <ArrowRight className={`w-6 h-6 transition-all duration-500 ${
                        agent.status === 'completed' ? 'text-green-500' : 'text-slate-300'
                      }`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Agent Information */}
      {expandedAgent && agents.find(a => a.id === expandedAgent) && (
        <Card className="border-2 border-blue-100 shadow-xl overflow-hidden">
          {(() => {
            const agent = agents.find(a => a.id === expandedAgent)!;
            const StatusIcon = getStatusIcon(agent.status);
            const AgentIcon = agent.icon;
            
            return (
              <>
                <div className={`px-6 py-4 border-b ${
                  agent.status === 'completed' ? 'bg-gradient-to-r from-green-50 to-emerald-50' :
                  agent.status === 'in-progress' ? 'bg-gradient-to-r from-blue-50 to-cyan-50' :
                  'bg-gradient-to-r from-slate-50 to-gray-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        agent.status === 'completed' ? 'bg-green-100' :
                        agent.status === 'in-progress' ? 'bg-blue-100' :
                        'bg-slate-100'
                      }`}>
                        {AgentIcon && <AgentIcon className={`w-6 h-6 ${
                          agent.status === 'completed' ? 'text-green-600' :
                          agent.status === 'in-progress' ? 'text-blue-600' :
                          'text-slate-500'
                        }`} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl">{agent.name}</h3>
                          <Badge className={`${getStatusTextColor(agent.status)} border-0`} variant="secondary">
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {getStatusLabel(agent.status)}
                          </Badge>
                        </div>
                        {agent.timestamp && agent.duration && (
                          <div className="flex items-center gap-4 text-xs text-slate-600 mb-2">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {agent.timestamp}
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5" />
                              {agent.duration}
                            </div>
                          </div>
                        )}
                        {agent.description && (
                          <p className="text-sm text-slate-600 leading-relaxed">{agent.description}</p>
                        )}
                      </div>
                    </div>
                    {agent.confidence && (
                      <div className="flex flex-col items-center ml-4">
                        <div className="relative w-24 h-24">
                          <svg className="w-24 h-24 transform -rotate-90">
                            <circle
                              cx="48"
                              cy="48"
                              r="42"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="none"
                              className="text-slate-200"
                            />
                            <circle
                              cx="48"
                              cy="48"
                              r="42"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 42}`}
                              strokeDashoffset={`${2 * Math.PI * 42 * (1 - agent.confidence / 100)}`}
                              className={`transition-all duration-500 ${
                                agent.status === 'completed' ? 'text-green-500' :
                                agent.status === 'in-progress' ? 'text-blue-500' :
                                'text-slate-400'
                              }`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl">{agent.confidence}%</span>
                            <span className="text-xs text-slate-500">Accuracy</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <CardHeader className="pb-4 pt-6">
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6">
                  {/* Input Data Section */}
                  {agent.inputData && (
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-lg hover:from-blue-100 hover:to-blue-100/50 transition-all border border-blue-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md bg-blue-500 flex items-center justify-center">
                            <Database className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-blue-900">Input Data</span>
                        </div>
                        <ChevronDown className="w-5 h-5 text-blue-600 transition-transform" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4">
                        <div className="grid grid-cols-2 gap-3 pl-12">
                          {Object.entries(agent.inputData).map(([key, value]) => (
                            <div key={key} className="p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                              <p className="text-xs text-slate-500 mb-1.5">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </p>
                              <p className="text-sm text-slate-900">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Agent Analysis Section */}
                  {agent.analysis && (
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-purple-50 to-purple-50/50 rounded-lg hover:from-purple-100 hover:to-purple-100/50 transition-all border border-purple-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md bg-purple-500 flex items-center justify-center">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-purple-900">AI Analysis</span>
                        </div>
                        <ChevronDown className="w-5 h-5 text-purple-600 transition-transform" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4">
                        <div className="grid grid-cols-2 gap-3 pl-12">
                          {Object.entries(agent.analysis).map(([key, value]) => (
                            <div key={key} className="p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                              <p className="text-xs text-slate-500 mb-1.5">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </p>
                              <p className="text-sm text-slate-900">
                                {Array.isArray(value) ? (
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {value.map((item, i) => (
                                      <Badge key={i} variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700">
                                        {item}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  String(value)
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Decision & Output Section */}
                  {agent.output && (
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-green-50 to-green-50/50 rounded-lg hover:from-green-100 hover:to-green-100/50 transition-all border border-green-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md bg-green-500 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-green-900">Output & Results</span>
                        </div>
                        <ChevronDown className="w-5 h-5 text-green-600 transition-transform" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4">
                        <div className="grid grid-cols-2 gap-3 pl-12">
                          {Object.entries(agent.output).map(([key, value]) => (
                            <div key={key} className="p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                              <p className="text-xs text-slate-500 mb-1.5">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </p>
                              <p className="text-sm text-slate-900">
                                {typeof value === 'boolean' ? (
                                  <Badge className={value ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}>
                                    {value ? '✓ Yes' : '✗ No'}
                                  </Badge>
                                ) : (
                                  String(value)
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button variant="outline" size="sm" className="text-slate-600">
                      <Download className="w-4 h-4 mr-2" />
                      Export Details
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Logs
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Activity className="w-4 h-4 mr-2" />
                        Inspect Agent
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            );
          })()}
        </Card>
      )}

      {/* Information Card */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="border shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2">About AI Workflow Pipeline</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Our system uses a 3-step pipeline: Direct parsing of JD and resumes (Steps 1-2), followed by our 
                  <strong> AI-powered HR Comparator Agent</strong> (Step 3) that intelligently matches candidates with weighted scoring.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2">AI Performance Metrics</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">AI Processing Time</span>
                    <span className="text-slate-900">{metrics.processingTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">AI Match Rate</span>
                    <span className="text-green-600">{metrics.matchRate}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Details Info */}
      <Card className="border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
          <CardContent className="pt-6">
            <h3 className="mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-700" />
              Workflow Pipeline Overview
            </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">JD Reader (Direct Parsing)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Directly parses job descriptions to extract requirements, skills, experience, and matching criteria. No AI agent involved.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Resume Reader (Direct Parsing)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Directly parses candidate resumes to extract skills, experience, education, and qualifications. No AI agent involved.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">HR Comparator (AI Agent) 🤖</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>REAL AI AGENT:</strong> Uses intelligent algorithms to match candidates against requirements with weighted scoring and priority-based selection.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}