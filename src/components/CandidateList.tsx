import { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';
import type { Candidate } from './mockData';

interface CandidateListProps {
  candidates: Candidate[];
  onCandidatesUpdate: (candidates: Candidate[]) => void;
  isPreview?: boolean;
}

type SortField = 'matchScore' | 'experience' | 'skills' | 'locality' | 'stability';

export function CandidateList({ candidates, onCandidatesUpdate, isPreview = false }: CandidateListProps) {
  const [sortField, setSortField] = useState<SortField>('matchScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedCandidates = [...candidates].sort((a, b) => {
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
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-slate-50 p-4 rounded-lg">
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
          <div className="text-sm text-muted-foreground">
            {sortedCandidates.length} candidate(s) found
          </div>
        </div>
      )}

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
    </div>
  );
}
