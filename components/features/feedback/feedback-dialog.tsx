"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Bug, Lightbulb, Zap, AlertTriangle } from "lucide-react";
import { analytics } from "@/lib/analytics";

interface FeedbackFormData {
  type: string;
  title: string;
  description: string;
  page: string;
  priority: string;
  email?: string;
  reproductionSteps?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  browserInfo?: string;
  attachScreenshot?: boolean;
}

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackType, setFeedbackType] = useState("general");
  const [browserInfo, setBrowserInfo] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Collect browser information
    if (typeof window !== 'undefined') {
      const info = {
        userAgent: navigator.userAgent,
        screen: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
      };
      setBrowserInfo(JSON.stringify(info, null, 2));
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const feedback: FeedbackFormData = {
      type: formData.get("type") as string,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      page: window.location.pathname,
      priority: formData.get("priority") as string,
      email: formData.get("email") as string || undefined,
      reproductionSteps: formData.get("reproductionSteps") as string || undefined,
      expectedBehavior: formData.get("expectedBehavior") as string || undefined,
      actualBehavior: formData.get("actualBehavior") as string || undefined,
      browserInfo: browserInfo,
      attachScreenshot: formData.get("attachScreenshot") === "on",
    };

    try {
      // Track feedback submission attempt
      analytics.trackInteraction({
        eventType: 'form_submit',
        element: 'feedback_form',
        page: window.location.pathname,
        metadata: { feedbackType: feedback.type, priority: feedback.priority },
      });

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...feedback,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          referrer: document.referrer,
        }),
      });

      if (response.ok) {
        toast({
          title: "Feedback submitted",
          description: "Thank you for your feedback! We'll review it soon.",
        });
        
        // Track successful submission
        analytics.trackInteraction({
          eventType: 'form_submit',
          element: 'feedback_form_success',
          page: window.location.pathname,
          metadata: { feedbackType: feedback.type },
        });

        setOpen(false);
        // Reset form
        (event.target as HTMLFormElement).reset();
        setFeedbackType("general");
      } else {
        throw new Error("Failed to submit feedback");
      }
    } catch (error) {
      // Track error
      analytics.trackError(error as Error, window.location.pathname, undefined, {
        context: 'feedback_submission',
        feedbackType: feedback.type,
      });

      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 shadow-lg bg-hunks-green text-white hover:bg-hunks-green/90"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {feedbackType === "bug" && <Bug className="h-5 w-5 text-red-500" />}
              {feedbackType === "feature" && <Lightbulb className="h-5 w-5 text-yellow-500" />}
              {feedbackType === "improvement" && <Zap className="h-5 w-5 text-blue-500" />}
              {feedbackType === "performance" && <AlertTriangle className="h-5 w-5 text-orange-500" />}
              {feedbackType === "general" && <MessageSquare className="h-5 w-5 text-hunks-green" />}
              Share Your Feedback
            </DialogTitle>
            <DialogDescription>
              Help us improve HUNKCentral by sharing your thoughts, reporting issues, or suggesting improvements.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={feedbackType} onValueChange={setFeedbackType} className="py-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="bug" className="text-xs">
                <Bug className="h-3 w-3 mr-1" />
                Bug
              </TabsTrigger>
              <TabsTrigger value="feature" className="text-xs">
                <Lightbulb className="h-3 w-3 mr-1" />
                Feature
              </TabsTrigger>
              <TabsTrigger value="improvement" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                UX
              </TabsTrigger>
              <TabsTrigger value="performance" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Speed
              </TabsTrigger>
              <TabsTrigger value="general" className="text-xs">
                <MessageSquare className="h-3 w-3 mr-1" />
                Other
              </TabsTrigger>
            </TabsList>

            <input type="hidden" name="type" value={feedbackType} />

            <div className="grid gap-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" required>
                  <SelectTrigger>
                    <SelectValue placeholder="How urgent is this?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Nice to have</SelectItem>
                    <SelectItem value="medium">Medium - Should be fixed</SelectItem>
                    <SelectItem value="high">High - Important issue</SelectItem>
                    <SelectItem value="critical">Critical - Blocking work</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder={
                    feedbackType === "bug" ? "Brief description of the bug" :
                    feedbackType === "feature" ? "Feature you'd like to see" :
                    feedbackType === "improvement" ? "What could be improved?" :
                    feedbackType === "performance" ? "What's running slowly?" :
                    "Brief description of your feedback"
                  }
                  required
                />
              </div>

              <TabsContent value="bug" className="space-y-4 mt-0">
                <div className="grid gap-2">
                  <Label htmlFor="actualBehavior">What happened?</Label>
                  <Textarea
                    id="actualBehavior"
                    name="actualBehavior"
                    placeholder="Describe what actually happened..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expectedBehavior">What should have happened?</Label>
                  <Textarea
                    id="expectedBehavior"
                    name="expectedBehavior"
                    placeholder="Describe what you expected to happen..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reproductionSteps">Steps to reproduce</Label>
                  <Textarea
                    id="reproductionSteps"
                    name="reproductionSteps"
                    placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                    className="min-h-[80px]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="feature" className="space-y-4 mt-0">
                <div className="grid gap-2">
                  <Label htmlFor="description">Feature Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the feature you'd like to see and how it would help you..."
                    className="min-h-[120px]"
                    required
                  />
                </div>
              </TabsContent>

              <TabsContent value="improvement" className="space-y-4 mt-0">
                <div className="grid gap-2">
                  <Label htmlFor="description">Improvement Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="What could be improved? How would this make your work easier?"
                    className="min-h-[120px]"
                    required
                  />
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4 mt-0">
                <div className="grid gap-2">
                  <Label htmlFor="description">Performance Issue</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="What's running slowly? When does this happen? How long does it take?"
                    className="min-h-[120px]"
                    required
                  />
                </div>
              </TabsContent>

              <TabsContent value="general" className="space-y-4 mt-0">
                <div className="grid gap-2">
                  <Label htmlFor="description">Your Feedback</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Share your thoughts, suggestions, or any other feedback..."
                    className="min-h-[120px]"
                    required
                  />
                </div>
              </TabsContent>

              <div className="grid gap-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  We&apos;ll only use this to follow up on your feedback if needed.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="attachScreenshot" name="attachScreenshot" />
                <Label htmlFor="attachScreenshot" className="text-sm">
                  Include browser and system information to help with debugging
                </Label>
              </div>
            </div>
          </Tabs>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>Submitting...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}