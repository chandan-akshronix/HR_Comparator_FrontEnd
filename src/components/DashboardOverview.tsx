import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { 
  Users, 
  FileText, 
  Search, 
  Upload, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Activity
} from 'lucide-react';
import type { Candidate } from './mockData';
import { getRecentActivity, getDashboardTrends } from '../services/api';

interface DashboardOverviewProps {
  candidates: Candidate[];
  jobDescription: string;
  onTabChange: (tab: string) => void;
  isLoading?: boolean; // Add loading prop
}

export function DashboardOverview({ candidates, jobDescription, onTabChange, isLoading = false }: DashboardOverviewProps) {
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [trends, setTrends] = useState<any>({
    candidatesTrend: '0%',
    candidatesTrendUp: true,
    highMatchTrend: '0%',
    highMatchTrendUp: true
  });
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(true);
  
  const highMatchCount = candidates.filter(c => c.matchScore >= 80).length;
  const reviewingCount = candidates.filter(c => c.status === 'reviewing').length;
  const newCandidatesCount = candidates.filter(c => c.status === 'new').length;
  const contactedCount = candidates.filter(c => c.status === 'contacted').length;

  // Load real activity from API
  useEffect(() => {
    loadRecentActivity();
    loadTrends();
  }, []);
  
  const loadRecentActivity = async () => {
    try {
      setLoadingActivity(true);
      const data = await getRecentActivity(4);
      
      if (data.activities && data.activities.length > 0) {
        // Format for display
        const formatted = data.activities.map((activity: any) => ({
          action: activity.action,
          candidate: activity.candidate || 'System',
          score: activity.score || null,
          time: formatTimestamp(activity.timestamp),
          type: activity.type
        }));
        setRecentActivity(formatted);
      } else {
        setRecentActivity([]);
      }
    } catch (err) {
      console.error('Error loading activity:', err);
      setRecentActivity([]);
    } finally {
      setLoadingActivity(false);
    }
  };
  
  const loadTrends = async () => {
    try {
      setLoadingTrends(true);
      const data = await getDashboardTrends();
      setTrends(data);
    } catch (err) {
      console.error('Error loading trends:', err);
      setTrends({
        candidatesTrend: '0%',
        candidatesTrendUp: true,
        highMatchTrend: '0%',
        highMatchTrendUp: true
      });
    } finally {
      setLoadingTrends(false);
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } catch {
      return 'Recently';
    }
  };

  const stats = [
    { 
      title: 'Total Candidates', 
      value: candidates.length, 
      icon: Users, 
      color: 'bg-blue-500',
      trend: trends.candidatesTrend,
      trendUp: trends.candidatesTrendUp,
      description: 'vs last week'
    },
    { 
      title: 'High Match (>80%)', 
      value: highMatchCount, 
      icon: TrendingUp, 
      color: 'bg-green-500',
      trend: trends.highMatchTrend,
      trendUp: trends.highMatchTrendUp,
      description: 'quality candidates'
    },
    { 
      title: 'Under Review', 
      value: reviewingCount, 
      icon: Search, 
      color: 'bg-orange-500',
      trend: `${reviewingCount}`,
      trendUp: false,
      description: 'pending review'
    },
    { 
      title: 'Active JDs', 
      value: jobDescription ? 1 : 0, 
      icon: FileText, 
      color: 'bg-purple-500',
      trend: trends.jdsTrend || 'Active',
      trendUp: trends.jdsTrendUp,
      description: 'job descriptions'
    },
  ];

  const topCandidates = candidates
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl mb-2">Welcome back, HR Team! 👋</h2>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-64 bg-white/20" />
              </div>
            ) : (
              <p className="text-blue-100">
                You have {newCandidatesCount} new candidates to review and {reviewingCount} under review.
              </p>
            )}
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-12 mb-2 bg-white/30 mx-auto" />
                  <Skeleton className="h-4 w-20 bg-white/20 mx-auto" />
                </>
              ) : (
                <>
                  <div className="text-3xl mb-1">{highMatchCount}</div>
                  <div className="text-sm text-blue-100">High Matches</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          // Skeleton loading cards
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <Skeleton className="w-12 h-4 rounded" />
                </div>
                <div>
                  <Skeleton className="h-9 w-16 mb-2" />
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${stat.trendUp ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {stat.trendUp ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    <span>{stat.trend}</span>
                  </div>
                </div>
                <div>
                  <p className="text-3xl mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => onTabChange('fetch')}
            >
              <Upload className="w-4 h-4 mr-2" />
              Fetch New Resumes
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => onTabChange('fetch')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Upload Job Description
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => onTabChange('candidates')}
            >
              <Users className="w-4 h-4 mr-2" />
              View All Candidates
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => onTabChange('workflow')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              View AI Workflow
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <span className="ml-2">Loading activity...</span>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-xs mt-1">Activity will appear here when you upload resumes or create JDs</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'warning' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm">{activity.action}</p>
                        {activity.score && (
                          <Badge variant="secondary" className="text-xs">
                            {activity.score}% match
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {activity.candidate}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Calendar className="w-3 h-3" />
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Candidates & Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Matches */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Matches This Week
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onTabChange('candidates')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCandidates.map((candidate, index) => (
              <div key={candidate.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full text-white shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate mb-1">{candidate.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {candidate.title}
                  </p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {candidate.skills.slice(0, 3).map((skill, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl mb-1">{candidate.matchScore}%</div>
                  <Badge className={`${
                    candidate.matchScore >= 90 ? 'bg-green-500' :
                    candidate.matchScore >= 80 ? 'bg-blue-500' :
                    'bg-orange-500'
                  }`}>
                    Match
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Candidate Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Candidate Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">New Candidates</p>
                    <p className="text-2xl">{newCandidatesCount}</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => onTabChange('candidates')}>
                  Review
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Under Review</p>
                    <p className="text-2xl">{reviewingCount}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => onTabChange('candidates')}>
                  View
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contacted</p>
                    <p className="text-2xl">{contactedCount}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => onTabChange('candidates')}>
                  View
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Pipeline Progress</span>
                <span>{Math.round((contactedCount / candidates.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                  style={{ width: `${(contactedCount / candidates.length) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {contactedCount} of {candidates.length} candidates contacted
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}