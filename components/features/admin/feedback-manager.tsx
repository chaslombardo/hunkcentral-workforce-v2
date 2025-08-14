"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bug, 
  Lightbulb, 
  Zap, 
  AlertTriangle, 
  MessageSquare, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  Filter,
  Search
} from "lucide-react";
import { formatDateDisplay } from "@/lib/formatters";

interface FeedbackItem {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  page: string;
  email?: string;
  userId?: string;
  timestamp: string;
  resolution?: string;
  resolvedAt?: string;
}

export function FeedbackManager() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState({
    status: "all",
    type: "all",
    priority: "all",
    search: "",
  });

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from your API
      // For now, we'll use mock data
      const mockFeedback: FeedbackItem[] = [
        {
          id: "1",
          type: "bug",
          title: "Log submission fails on mobile",
          description: "When trying to submit a log on mobile, the form doesn't respond after clicking submit.",
          priority: "high",
          status: "open",
          page: "/logs/create",
          email: "captain@example.com",
          timestamp: "2024-01-15T10:30:00Z",
        },
        {
          id: "2",
          type: "feature",
          title: "Add bulk approval for logs",
          description: "It would be helpful to approve multiple logs at once instead of one by one.",
          priority: "medium",
          status: "in_progress",
          page: "/logs/review",
          timestamp: "2024-01-14T14:20:00Z",
        },
        {
          id: "3",
          type: "improvement",
          title: "Dashboard loading is slow",
          description: "The dashboard takes too long to load, especially the metrics cards.",
          priority: "medium",
          status: "resolved",
          page: "/dashboard",
          timestamp: "2024-01-13T09:15:00Z",
          resolution: "Optimized database queries and added caching. Load time reduced from 3s to 1.2s.",
          resolvedAt: "2024-01-14T16:45:00Z",
        },
        {
          id: "4",
          type: "performance",
          title: "Payroll report generation timeout",
          description: "Large payroll reports fail to generate and show a timeout error.",
          priority: "critical",
          status: "open",
          page: "/reports/payroll",
          email: "admin@example.com",
          timestamp: "2024-01-15T08:45:00Z",
        },
        {
          id: "5",
          type: "general",
          title: "Love the new design!",
          description: "The recent UI updates look great and make the app much easier to use.",
          priority: "low",
          status: "closed",
          page: "/dashboard",
          timestamp: "2024-01-12T16:30:00Z",
        },
      ];

      setFeedback(mockFeedback);
    } catch (error) {
      console.error("Failed to load feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (id: string, status: string, resolution?: string) => {
    try {
      // In a real implementation, this would call your API
      setFeedback(prev => prev.map(item => 
        item.id === id 
          ? { 
              ...item, 
              status, 
              resolution,
              resolvedAt: status === 'resolved' ? new Date().toISOString() : undefined
            }
          : item
      ));
      
      if (selectedFeedback?.id === id) {
        setSelectedFeedback(prev => prev ? {
          ...prev,
          status,
          resolution,
          resolvedAt: status === 'resolved' ? new Date().toISOString() : undefined
        } : null);
      }
    } catch (error) {
      console.error("Failed to update feedback:", error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug": return <Bug className="h-4 w-4 text-red-500" />;
      case "feature": return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case "improvement": return <Zap className="h-4 w-4 text-blue-500" />;
      case "performance": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "destructive";
      case "in_progress": return "default";
      case "resolved": return "default";
      case "closed": return "secondary";
      default: return "outline";
    }
  };

  const filteredFeedback = feedback.filter(item => {
    if (filter.status !== "all" && item.status !== filter.status) return false;
    if (filter.type !== "all" && item.type !== filter.type) return false;
    if (filter.priority !== "all" && item.priority !== filter.priority) return false;
    if (filter.search && !item.title.toLowerCase().includes(filter.search.toLowerCase()) &&
        !item.description.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: feedback.length,
    open: feedback.filter(f => f.status === "open").length,
    inProgress: feedback.filter(f => f.status === "in_progress").length,
    resolved: feedback.filter(f => f.status === "resolved").length,
    critical: feedback.filter(f => f.priority === "critical").length,
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading feedback...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search feedback..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>
            <Select value={filter.status} onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filter.type} onValueChange={(value) => setFilter(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="feature">Feature Request</SelectItem>
                <SelectItem value="improvement">Improvement</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filter.priority} onValueChange={(value) => setFilter(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Table */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Items</CardTitle>
          <CardDescription>
            Manage user feedback and track resolution progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Page</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeedback.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      <span className="capitalize">{item.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">{item.title}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(item.priority) as any}>
                      {item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(item.status) as any}>
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {item.page}
                    </code>
                  </TableCell>
                  <TableCell>
                    {formatDateDisplay(item.timestamp)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFeedback(item);
                        setShowDetails(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Feedback Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedFeedback && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getTypeIcon(selectedFeedback.type)}
                  {selectedFeedback.title}
                </DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant={getPriorityColor(selectedFeedback.priority) as any}>
                      {selectedFeedback.priority} priority
                    </Badge>
                    <Badge variant={getStatusColor(selectedFeedback.status) as any}>
                      {selectedFeedback.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(selectedFeedback.timestamp).toLocaleString()}
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedFeedback.description}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Page</h4>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {selectedFeedback.page}
                    </code>
                  </div>
                  {selectedFeedback.email && (
                    <div>
                      <h4 className="font-medium mb-2">Contact Email</h4>
                      <p className="text-sm">{selectedFeedback.email}</p>
                    </div>
                  )}
                </div>

                {selectedFeedback.resolution && (
                  <div>
                    <h4 className="font-medium mb-2">Resolution</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedFeedback.resolution}
                    </p>
                    {selectedFeedback.resolvedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Resolved on {new Date(selectedFeedback.resolvedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-medium">Update Status</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateFeedbackStatus(selectedFeedback.id, "in_progress")}
                      disabled={selectedFeedback.status === "in_progress"}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      In Progress
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const resolution = prompt("Enter resolution details:");
                        if (resolution) {
                          updateFeedbackStatus(selectedFeedback.id, "resolved", resolution);
                        }
                      }}
                      disabled={selectedFeedback.status === "resolved"}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateFeedbackStatus(selectedFeedback.id, "closed")}
                      disabled={selectedFeedback.status === "closed"}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Close
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}