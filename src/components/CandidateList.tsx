import React, { useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  MapPin, 
  Briefcase, 
  TrendingUp, 
  Star,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  ExternalLink,
  Loader2,
  Users
} from 'lucide-react';
import type { Candidate } from './mockData';

interface CandidateListProps {
  candidates: Candidate[];
  onCandidatesUpdate: (candidates: Candidate[]) => void;
  isPreview?: boolean;
  isLoading?: boolean;
}

type SortField = 'matchScore' | 'experience' | 'skills' | 'locality' | 'stability';

export function CandidateList({ candidates, onCandidatesUpdate, isPreview = false, isLoading = false }: CandidateListProps) {
  const [sortField, setSortField] = useState<SortField>('matchScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Get unique workflow IDs from candidates, sorted by most recent first
  const uniqueWorkflowIds = Array.from(
    new Set(candidates.map((c: any) => c.workflow_id).filter(Boolean))
  ).sort().reverse(); // Most recent workflow IDs first (WF-timestamp format)
  
  // Get unique JD IDs from candidates
  const uniqueJDIds = Array.from(
    new Set(candidates.map((c: any) => c.jd_id).filter(Boolean))
  );
  
  // Default to most recent workflow (or 'all' if no workflows)
  const defaultWorkflowId = uniqueWorkflowIds.length > 0 ? uniqueWorkflowIds[0] : 'all';
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(defaultWorkflowId);
  const [selectedJDId, setSelectedJDId] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  
  // Update selected workflow when candidates change (new workflow added)
  React.useEffect(() => {
    if (uniqueWorkflowIds.length > 0 && !uniqueWorkflowIds.includes(selectedWorkflowId) && selectedWorkflowId !== 'all') {
      setSelectedWorkflowId(uniqueWorkflowIds[0]);
    }
  }, [uniqueWorkflowIds.length]);

  // Multi-level filtering: Workflow → JD → Date → Then Sort
  let filteredCandidates = candidates;
  
  // Filter by workflow
  if (selectedWorkflowId !== 'all') {
    filteredCandidates = filteredCandidates.filter((c: any) => c.workflow_id === selectedWorkflowId);
  }
  
  // Filter by JD
  if (selectedJDId !== 'all') {
    filteredCandidates = filteredCandidates.filter((c: any) => c.jd_id === selectedJDId);
  }
  
  // Filter by date range
  if (selectedDateRange !== 'all') {
    const now = new Date();
    filteredCandidates = filteredCandidates.filter((c: any) => {
      if (!c.workflow_id) return true;
      const timestamp = parseInt(c.workflow_id.replace('WF-', ''));
      const candidateDate = new Date(timestamp);
      
      switch (selectedDateRange) {
        case 'today':
          return candidateDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return candidateDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return candidateDate >= monthAgo;
        default:
          return true;
      }
    });
  }

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    let compareValue = 0;
    
    switch (sortField) {
      case 'matchScore':
        compareValue = a.matchScore - b.matchScore;
        break;
      case 'experience':
        compareValue = a.experience - b.experience;
        break;
      case 'skills':
        compareValue = a.skills.length - b.skills.length;
        break;
      case 'locality':
        compareValue = a.location.localeCompare(b.location);
        break;
      case 'stability':
        compareValue = a.stabilityScore - b.stabilityScore;
        break;
    }
    
    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  const getMatchScoreColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStabilityBadge = (score: number) => {
    if (score >= 80) return { label: 'High Stability', variant: 'default' as const };
    if (score >= 60) return { label: 'Medium Stability', variant: 'secondary' as const };
    return { label: 'Job Hopper', variant: 'outline' as const };
  };

  return (
    <div className="space-y-4">
      {!isPreview && (
        <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-lg">
          {/* First Row: Filters */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Workflow Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Workflow:</span>
              <Select value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue>
                    {selectedWorkflowId === 'all' ? (
                      <span>All Workflows <span className="text-slate-500">({candidates.length})</span></span>
                    ) : (
                      <span>
                        {selectedWorkflowId} 
                        <span className="text-slate-500 ml-2">
                          ({filteredCandidates.length} candidates)
                        </span>
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="font-medium">All Workflows</span>
                    <span className="text-slate-500 ml-2">({candidates.length} total)</span>
                  </SelectItem>
                  {uniqueWorkflowIds.map((workflowId, index) => {
                    const count = candidates.filter((c: any) => c.workflow_id === workflowId).length;
                    const timestamp = workflowId ? workflowId.replace('WF-', '') : '';
                    const date = timestamp ? new Date(parseInt(timestamp)).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '';
                    
                    return (
                      <SelectItem key={workflowId} value={workflowId}>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{workflowId}</span>
                            {index === 0 && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Latest</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">{date} • {count} candidates</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            {/* Job Title Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Job Title:</span>
              <Select value={selectedJDId} onValueChange={setSelectedJDId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Jobs ({candidates.length})
                  </SelectItem>
                  {uniqueJDIds.map((jdId) => {
                    const count = candidates.filter((c: any) => c.jd_id === jdId).length;
                    return (
                      <SelectItem key={jdId} value={jdId}>
                        {jdId} ({count} candidates)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Date:</span>
              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Divider */}
            <div className="h-6 w-px bg-slate-300"></div>
            
            {/* Sort By */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Sort by:</span>
              <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matchScore">Match Score</SelectItem>
                  <SelectItem value="experience">Experience</SelectItem>
                  <SelectItem value="skills">Skills Count</SelectItem>
                  <SelectItem value="locality">Location</SelectItem>
                  <SelectItem value="stability">Stability</SelectItem>
                </SelectContent>
              </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
            </div>
          </div>
          
          {/* Second Row: Status and Active Filters */}
          <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-slate-200 pt-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">
                {filteredCandidates.length} of {candidates.length} candidate(s)
              </span>
              {(selectedWorkflowId !== 'all' || selectedJDId !== 'all' || selectedDateRange !== 'all') && (
                <span className="text-slate-500">
                  • Filtered by:
                  {selectedWorkflowId !== 'all' && <span className="ml-1 text-blue-600">{selectedWorkflowId}</span>}
                  {selectedJDId !== 'all' && <span className="ml-1 text-green-600">{selectedJDId}</span>}
                  {selectedDateRange !== 'all' && <span className="ml-1 text-orange-600">{selectedDateRange}</span>}
                </span>
              )}
            </div>
            
            {/* Clear Filters Button */}
            {(selectedWorkflowId !== 'all' || selectedJDId !== 'all' || selectedDateRange !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedWorkflowId('all');
                  setSelectedJDId('all');
                  setSelectedDateRange('all');
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-slate-600">Loading candidates...</span>
        </div>
      )}

      {/* Candidate List */}
      {!isLoading && (
        <div className="space-y-3">
        {sortedCandidates.map((candidate) => {
          const isExpanded = expandedId === candidate.id;
          const stability = getStabilityBadge(candidate.stabilityScore);

          return (
            <div
              key={candidate.id}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="truncate">{candidate.name}</h3>
                    <div className={`${getMatchScoreColor(candidate.matchScore)} text-white px-3 py-1 rounded-full text-sm flex items-center gap-1 shrink-0`}>
                      <Star className="w-3 h-3 fill-current" />
                      {candidate.matchScore}%
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{candidate.title}</p>
                  
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {candidate.experience} years
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {candidate.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Stability: {candidate.stabilityScore}%
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {candidate.skills.slice(0, isExpanded ? undefined : 6).map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                    {!isExpanded && candidate.skills.length > 6 && (
                      <Badge variant="outline">+{candidate.skills.length - 6} more</Badge>
                    )}
                  </div>

                  {/* Source */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Source:</span>
                    <Badge variant="outline" className="text-xs">
                      {candidate.source}
                    </Badge>
                    <Badge variant={stability.variant} className="text-xs">
                      {stability.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div>
                    <h4 className="text-sm mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        {candidate.email}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {candidate.phone}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm mb-2">AI Match Analysis</h4>
                    <div className="space-y-2">
                      {Object.entries(candidate.matchBreakdown).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground capitalize">{key}:</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getMatchScoreColor(value)}`}
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            <span>{value}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1">
                      <Mail className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Profile
                    </Button>
                  </div>
                </div>
              )}

              {/* Toggle Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedId(isExpanded ? null : candidate.id)}
                className="w-full mt-3"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Show More Details
                  </>
                )}
              </Button>
            </div>
          );
        })}
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && filteredCandidates.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-700 mb-1">No candidates found</h3>
          <p className="text-slate-500">Try adjusting your filters or upload new resumes</p>
        </div>
      )}
    </div>
  );
}
