import { useState, useEffect, useCallback } from "react";
import { prisma } from "@/lib/prisma";
import { analytics } from "@/lib/analytics";

export interface ABTestVariant {
  name: string;
  weight: number; // 0-100, percentage of traffic
  config: Record<string, unknown>;
}

export interface ABTestConfig {
  name: string;
  description?: string;
  variants: ABTestVariant[];
  targetMetric: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ABTestResult {
  variant: string;
  config: Record<string, unknown>;
  isControl: boolean;
}

interface ABTestExperiment {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  targetMetric: string;
  variants: ABTestVariant[];
}

class ABTestingService {
  private static instance: ABTestingService;
  private cache = new Map<string, unknown>();
  private cacheExpiry = new Map<string, number>();

  private constructor() {}

  static getInstance(): ABTestingService {
    if (!ABTestingService.instance) {
      ABTestingService.instance = new ABTestingService();
    }
    return ABTestingService.instance;
  }

  // Create a new A/B test experiment
  async createExperiment(config: ABTestConfig) {
    // Validate variants weights sum to 100
    const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error("Variant weights must sum to 100");
    }

    const experiment = await prisma.aBTestExperiment.create({
      data: {
        name: config.name,
        description: config.description,
        variants: JSON.parse(JSON.stringify(config.variants)),
        targetMetric: config.targetMetric,
        startDate: config.startDate,
        endDate: config.endDate,
        status: "draft",
      },
    });

    return experiment;
  }

  // Start an experiment
  async startExperiment(experimentName: string) {
    const experiment = await prisma.aBTestExperiment.update({
      where: { name: experimentName },
      data: {
        status: "active",
        startDate: new Date(),
      },
    });

    // Clear cache for this experiment
    this.clearCache(experimentName);

    return experiment;
  }

  // Stop an experiment
  async stopExperiment(experimentName: string) {
    const experiment = await prisma.aBTestExperiment.update({
      where: { name: experimentName },
      data: {
        status: "completed",
        endDate: new Date(),
      },
    });

    // Clear cache for this experiment
    this.clearCache(experimentName);

    return experiment;
  }

  // Get variant assignment for a user
  async getVariant(
    experimentName: string,
    userId?: string,
    sessionId?: string
  ): Promise<ABTestResult | null> {
    if (!userId && !sessionId) {
      throw new Error("Either userId or sessionId must be provided");
    }

    // Check cache first
    const cacheKey = `${experimentName}:${userId || sessionId}`;
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey) as ABTestResult | null;
    }

    // Get experiment
    const experiment = await this.getExperiment(experimentName);
    if (!experiment || experiment.status !== "active") {
      return null;
    }

    // Check if user already has an assignment
    let assignment = await prisma.aBTestAssignment.findFirst({
      where: {
        experimentId: experiment.id,
        ...(userId ? { userId } : { sessionId }),
      },
    });

    // If no assignment exists, create one
    if (!assignment) {
      const variant = this.selectVariant(experiment.variants as ABTestVariant[]);
      assignment = await prisma.aBTestAssignment.create({
        data: {
          experimentId: experiment.id,
          userId,
          sessionId,
          variant: variant.name,
        },
      });
    }

    const selectedVariant = (experiment.variants as ABTestVariant[]).find(
      v => v.name === assignment!.variant
    );

    if (!selectedVariant) {
      return null;
    }

    const result: ABTestResult = {
      variant: selectedVariant.name,
      config: selectedVariant.config,
      isControl: selectedVariant.name === "control",
    };

    // Cache the result
    this.cache.set(cacheKey, result);
    this.cacheExpiry.set(cacheKey, Date.now() + 5 * 60 * 1000); // 5 minutes

    return result;
  }

  // Track an A/B test event
  async trackEvent(
    experimentName: string,
    eventType: string,
    userId?: string,
    sessionId?: string,
    value?: number,
    metadata?: Record<string, unknown>
  ) {
    const experiment = await this.getExperiment(experimentName);
    if (!experiment || experiment.status !== "active") {
      return;
    }

    // Get user's variant assignment
    const assignment = await prisma.aBTestAssignment.findFirst({
      where: {
        experimentId: experiment.id,
        ...(userId ? { userId } : { sessionId }),
      },
    });

    if (!assignment) {
      return; // User not in experiment
    }

    // Track the event
    await prisma.aBTestEvent.create({
      data: {
        experimentId: experiment.id,
        userId,
        sessionId,
        variant: assignment.variant,
        eventType,
        value,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      },
    });

    // Also track in general analytics
    analytics.trackInteraction({
      eventType: 'click',
      page: 'ab-test',
      userId,
      metadata: {
        experiment: experimentName,
        variant: assignment.variant,
        eventType,
        value,
        ...metadata,
      },
    });
  }

  // Get experiment results
  async getResults(experimentName: string) {
    const experiment = await this.getExperiment(experimentName);
    if (!experiment) {
      throw new Error("Experiment not found");
    }

    // Get all events for this experiment
    const events = await prisma.aBTestEvent.findMany({
      where: { experimentId: experiment.id },
    });

    // Get assignments count by variant
    const assignments = await prisma.aBTestAssignment.groupBy({
      by: ['variant'],
      where: { experimentId: experiment.id },
      _count: { variant: true },
    });

    // Calculate metrics by variant
    const results = assignments.map(assignment => {
      const variantEvents = events.filter(e => e.variant === assignment.variant);
      const conversions = variantEvents.filter(e => e.eventType === 'conversion');
      const interactions = variantEvents.filter(e => e.eventType === 'interaction');
      
      const conversionRate = assignment._count.variant > 0 
        ? conversions.length / assignment._count.variant 
        : 0;
      
      const avgValue = conversions.length > 0
        ? conversions.reduce((sum, e) => sum + (e.value || 0), 0) / conversions.length
        : 0;

      return {
        variant: assignment.variant,
        participants: assignment._count.variant,
        conversions: conversions.length,
        conversionRate,
        interactions: interactions.length,
        averageValue: avgValue,
        totalValue: conversions.reduce((sum, e) => sum + (e.value || 0), 0),
      };
    });

    return {
      experiment: {
        name: experiment.name,
        description: experiment.description,
        status: experiment.status,
        startDate: experiment.startDate,
        endDate: experiment.endDate,
        targetMetric: experiment.targetMetric,
      },
      results,
      totalParticipants: assignments.reduce((sum, a) => sum + a._count.variant, 0),
      totalEvents: events.length,
    };
  }

  // Helper methods
  private async getExperiment(name: string): Promise<ABTestExperiment | null> {
    const cacheKey = `experiment:${name}`;
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey) as ABTestExperiment | null;
    }

    const experiment = await prisma.aBTestExperiment.findUnique({
      where: { name },
    });

    if (experiment) {
      this.cache.set(cacheKey, experiment);
      this.cacheExpiry.set(cacheKey, Date.now() + 10 * 60 * 1000); // 10 minutes
    }

    return experiment as ABTestExperiment | null;
  }

  private selectVariant(variants: ABTestVariant[]): ABTestVariant {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        return variant;
      }
    }

    // Fallback to first variant
    return variants[0];
  }

  private isValidCache(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return false;
    }
    return this.cache.has(key);
  }

  private clearCache(experimentName: string) {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(experimentName)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
    });
  }
}

export const abTesting = ABTestingService.getInstance();

// React hook for A/B testing
export function useABTest(experimentName: string, userId?: string) {
  const [variant, setVariant] = useState<ABTestResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getVariant = async () => {
      try {
        // Generate session ID if no user ID
        const sessionId = userId ? undefined : generateSessionId();
        const result = await abTesting.getVariant(experimentName, userId, sessionId);
        setVariant(result);
      } catch (error) {
        console.error('Error getting A/B test variant:', error);
        setVariant(null);
      } finally {
        setLoading(false);
      }
    };

    getVariant();
  }, [experimentName, userId]);

  const trackEvent = useCallback(
    (eventType: string, value?: number, metadata?: Record<string, unknown>) => {
      if (variant) {
        const sessionId = userId ? undefined : generateSessionId();
        abTesting.trackEvent(experimentName, eventType, userId, sessionId, value, metadata);
      }
    },
    [experimentName, userId, variant]
  );

  return {
    variant,
    loading,
    trackEvent,
    isControl: variant?.isControl || false,
    config: variant?.config || {},
  };
}

// Generate a session ID for anonymous users
function generateSessionId(): string {
  if (typeof window !== 'undefined') {
    let sessionId = sessionStorage.getItem('ab_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('ab_session_id', sessionId);
    }
    return sessionId;
  }
  return Math.random().toString(36).substring(2, 15);
}