"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { 
  TestTube, 
  Play, 
  Pause, 
  Square, 
  Plus, 
  BarChart3, 
  TrendingUp,
  Users,
  Calendar
} from "lucide-react";
import { ABTestConfig, ABTestVariant } from "@/lib/ab-testing";

interface ABTestExperiment {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  variants: ABTestVariant[];
  targetMetric: string;
  participants: number;
  conversions: number;
  conversionRate: number;
}

export function ABTestManager() {
  const [experiments, setExperiments] = useState<ABTestExperiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<ABTestExperiment | null>(null);
  const [experimentResults, setExperimentResults] = useState<{
    experiment: {
      name: string;
      description?: string;
      status: string;
      startDate?: string;
      endDate?: string;
      targetMetric: string;
    };
    results: Array<{
      variant: string;
      participants: number;
      conversions: number;
      conversionRate: number;
      interactions: number;
      averageValue: number;
      totalValue: number;
    }>;
    totalParticipants: number;
    totalEvents: number;
  } | null>(null);

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from your API
      // For now, we'll use mock data
      const mockExperiments: ABTestExperiment[] = [
        {
          id: "1",
          name: "dashboard-metrics-layout",
          description: "Test different layouts for dashboard metric cards",
          status: "active",
          startDate: "2024-01-10T00:00:00Z",
          variants: [
            { name: "control", weight: 50, config: { layout: "grid" } },
            { name: "list-view", weight: 50, config: { layout: "list" } },
          ],
          targetMetric: "dashboard_engagement",
          participants: 234,
          conversions: 89,
          conversionRate: 38.0,
        },
        {
          id: "2",
          name: "button-color-test",
          description: "Test primary button color variations",
          status: "completed",
          startDate: "2024-01-01T00:00:00Z",
          endDate: "2024-01-08T00:00:00Z",
          variants: [
            { name: "control", weight: 33, config: { color: "#026937" } },
            { name: "orange", weight: 33, config: { color: "#ea7200" } },
            { name: "blue", weight: 34, config: { color: "#3b82f6" } },
          ],
          targetMetric: "form_completion",
          participants: 456,
          conversions: 234,
          conversionRate: 51.3,
        },
        {
          id: "3",
          name: "navigation-structure",
          description: "Test simplified vs detailed navigation menu",
          status: "draft",
          variants: [
            { name: "control", weight: 50, config: { style: "detailed" } },
            { name: "simplified", weight: 50, config: { style: "simple" } },
          ],
          targetMetric: "navigation_efficiency",
          participants: 0,
          conversions: 0,
          conversionRate: 0,
        },
      ];

      setExperiments(mockExperiments);
    } catch (error) {
      console.error("Failed to load experiments:", error);
    } finally {
      setLoading(false);
    }
  };

  const createExperiment = async (config: ABTestConfig) => {
    try {
      // In a real implementation, this would call your API
      const newExperiment: ABTestExperiment = {
        id: Date.now().toString(),
        name: config.name,
        description: config.description,
        status: "draft",
        variants: config.variants,
        targetMetric: config.targetMetric,
        participants: 0,
        conversions: 0,
        conversionRate: 0,
      };

      setExperiments(prev => [...prev, newExperiment]);
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Failed to create experiment:", error);
    }
  };

  const updateExperimentStatus = async (id: string, status: string) => {
    try {
      setExperiments(prev => prev.map(exp => 
        exp.id === id 
          ? { 
              ...exp, 
              status,
              startDate: status === 'active' ? new Date().toISOString() : exp.startDate,
              endDate: status === 'completed' ? new Date().toISOString() : exp.endDate,
            }
          : exp
      ));
    } catch (error) {
      console.error("Failed to update experiment:", error);
    }
  };

  const viewResults = async (experiment: ABTestExperiment) => {
    try {
      // In a real implementation, this would call abTesting.getResults()
      const mockResults = {
        experiment: {
          name: experiment.name,
          description: experiment.description,
          status: experiment.status,
          startDate: experiment.startDate,
          endDate: experiment.endDate,
          targetMetric: experiment.targetMetric,
        },
        results: experiment.variants.map((variant) => ({
          variant: variant.name,
          participants: Math.floor(experiment.participants * (variant.weight / 100)),
          conversions: Math.floor(experiment.conversions * (variant.weight / 100) * (0.8 + Math.random() * 0.4)),
          conversionRate: 35 + Math.random() * 20,
          interactions: Math.floor(Math.random() * 1000),
          averageValue: Math.random() * 100,
          totalValue: Math.random() * 10000,
        })),
        totalParticipants: experiment.participants,
        totalEvents: Math.floor(experiment.participants * 3.5),
      };

      setExperimentResults(mockResults);
      setSelectedExperiment(experiment);
      setShowResultsDialog(true);
    } catch (error) {
      console.error("Failed to load results:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "completed": return "secondary";
      case "paused": return "outline";
      case "draft": return "outline";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Play className="h-4 w-4" />;
      case "completed": return <Square className="h-4 w-4" />;
      case "paused": return <Pause className="h-4 w-4" />;
      default: return <TestTube className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading A/B tests...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{experiments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {experiments.filter(e => e.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {experiments.filter(e => e.status === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {experiments.reduce((sum, e) => sum + e.participants, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Experiments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>A/B Test Experiments</CardTitle>
              <CardDescription>
                Manage and monitor your A/B testing experiments
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Test
                </Button>
              </DialogTrigger>
              <CreateExperimentDialog onSubmit={createExperiment} />
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Conversion Rate</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experiments.map((experiment) => (
                <TableRow key={experiment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{experiment.name}</div>
                      {experiment.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {experiment.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(experiment.status) as "default" | "secondary" | "destructive" | "outline"}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(experiment.status)}
                        {experiment.status}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {experiment.variants.map((variant, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {variant.name} ({variant.weight}%)
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {experiment.participants}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      {experiment.conversionRate.toFixed(1)}%
                    </div>
                  </TableCell>
                  <TableCell>
                    {experiment.startDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {Math.ceil((Date.now() - new Date(experiment.startDate).getTime()) / (1000 * 60 * 60 * 24))}d
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {experiment.status === "draft" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateExperimentStatus(experiment.id, "active")}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {experiment.status === "active" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateExperimentStatus(experiment.id, "paused")}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateExperimentStatus(experiment.id, "completed")}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {experiment.status === "paused" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateExperimentStatus(experiment.id, "active")}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewResults(experiment)}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {experimentResults && selectedExperiment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {selectedExperiment.name} - Results
                </DialogTitle>
                <DialogDescription>
                  Detailed results and performance metrics for this A/B test
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Overview Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{experimentResults.totalParticipants}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{experimentResults.totalEvents}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Target Metric</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-medium">{selectedExperiment.targetMetric}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Variant Results */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Variant Performance</h3>
                  <div className="grid gap-4">
                    {experimentResults.results.map((result, index: number) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span className="capitalize">{result.variant}</span>
                            <Badge variant={result.variant === "control" ? "default" : "secondary"}>
                              {result.conversionRate.toFixed(1)}% conversion
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4 md:grid-cols-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Participants</div>
                              <div className="text-2xl font-bold">{result.participants}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Conversions</div>
                              <div className="text-2xl font-bold">{result.conversions}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Interactions</div>
                              <div className="text-2xl font-bold">{result.interactions}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Avg Value</div>
                              <div className="text-2xl font-bold">${result.averageValue.toFixed(0)}</div>
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Conversion Rate</span>
                              <span>{result.conversionRate.toFixed(1)}%</span>
                            </div>
                            <Progress value={result.conversionRate} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Statistical Significance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Statistical Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Confidence Level:</span>
                        <span className="font-medium">95%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Statistical Significance:</span>
                        <Badge variant="default">Significant</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Recommended Action:</span>
                        <span className="font-medium">Implement winning variant</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowResultsDialog(false)}>
                  Close
                </Button>
                <Button onClick={() => updateExperimentStatus(selectedExperiment.id, "completed")}>
                  End Test
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateExperimentDialog({ onSubmit }: { onSubmit: (config: ABTestConfig) => void }) {
  const [config, setConfig] = useState<ABTestConfig>({
    name: "",
    description: "",
    variants: [
      { name: "control", weight: 50, config: {} },
      { name: "variant", weight: 50, config: {} },
    ],
    targetMetric: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Create A/B Test Experiment</DialogTitle>
        <DialogDescription>
          Set up a new A/B test to compare different variations of your UI
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="name">Experiment Name</Label>
            <Input
              id="name"
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., button-color-test"
              required
            />
          </div>
          <div>
            <Label htmlFor="targetMetric">Target Metric</Label>
            <Input
              id="targetMetric"
              value={config.targetMetric}
              onChange={(e) => setConfig(prev => ({ ...prev, targetMetric: e.target.value }))}
              placeholder="e.g., conversion_rate"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={config.description}
            onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what you're testing..."
          />
        </div>

        <div className="space-y-2">
          <Label>Variants</Label>
          {config.variants.map((variant, index) => (
            <div key={index} className="grid gap-2 md:grid-cols-3 p-3 border rounded">
              <Input
                value={variant.name}
                onChange={(e) => {
                  const newVariants = [...config.variants];
                  newVariants[index].name = e.target.value;
                  setConfig(prev => ({ ...prev, variants: newVariants }));
                }}
                placeholder="Variant name"
              />
              <Input
                type="number"
                value={variant.weight}
                onChange={(e) => {
                  const newVariants = [...config.variants];
                  newVariants[index].weight = parseInt(e.target.value) || 0;
                  setConfig(prev => ({ ...prev, variants: newVariants }));
                }}
                placeholder="Weight %"
                min="0"
                max="100"
              />
              <Input
                value={JSON.stringify(variant.config)}
                onChange={(e) => {
                  try {
                    const newVariants = [...config.variants];
                    newVariants[index].config = JSON.parse(e.target.value);
                    setConfig(prev => ({ ...prev, variants: newVariants }));
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='{"key": "value"}'
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="submit">Create Experiment</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}