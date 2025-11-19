'use client';

/**
 * Push Notifications Manager for HUNKCentral PWA
 * Handles push notification subscription, management, and delivery
 */

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: unknown;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    language: string;
  };
}

class PushNotificationManager {
  private vapidPublicKey: string | null = null;
  private subscription: PushSubscription | null = null;
  private isSupported: boolean = false;
  private permission: NotificationPermission = 'default';

  constructor() {
    this.checkSupport();
    this.updatePermissionStatus();
  }

  /**
   * Check if push notifications are supported
   */
  private checkSupport(): void {
    if (typeof window === 'undefined') {
      this.isSupported = false;
      return;
    }

    this.isSupported = !!(
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Update current permission status
   */
  private updatePermissionStatus(): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      this.permission = 'denied';
      return;
    }

    this.permission = Notification.permission;
  }

  /**
   * Check if push notifications are supported
   */
  public isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get current permission status
   */
  public getPermissionStatus(): NotificationPermission {
    this.updatePermissionStatus();
    return this.permission;
  }

  /**
   * Request notification permission
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      throw error;
    }
  }

  /**
   * Set VAPID public key for push subscriptions
   */
  public setVapidPublicKey(key: string): void {
    this.vapidPublicKey = key;
  }

  /**
   * Subscribe to push notifications
   */
  public async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    if (this.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      const existingSubscription =
        await registration.pushManager.getSubscription();
      if (existingSubscription) {
        this.subscription = existingSubscription;
        return this.serializeSubscription(existingSubscription);
      }

      // Create new subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.vapidPublicKey
          ? (this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource)
          : undefined,
      });

      this.subscription = subscription;
      return this.serializeSubscription(subscription);
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  public async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      const registration = await navigator.serviceWorker.ready;
      this.subscription = await registration.pushManager.getSubscription();
    }

    if (this.subscription) {
      try {
        const success = await this.subscription.unsubscribe();
        if (success) {
          this.subscription = null;
        }
        return success;
      } catch (error) {
        console.error('Failed to unsubscribe from push notifications:', error);
        throw error;
      }
    }

    return true;
  }

  /**
   * Get current subscription
   */
  public async getSubscription(): Promise<PushSubscriptionData | null> {
    if (!this.isSupported) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        this.subscription = subscription;
        return this.serializeSubscription(subscription);
      }
    } catch (error) {
      console.error('Failed to get push subscription:', error);
    }

    return null;
  }

  /**
   * Show a local notification
   */
  public async showNotification(
    options: PushNotificationOptions
  ): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Notifications are not supported');
    }

    if (this.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      const notificationOptions: NotificationOptions = {
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        badge: options.badge || '/icon-192x192.png',

        tag: options.tag,
        data: options.data,

        requireInteraction: options.requireInteraction,
        silent: options.silent,
      };

      await registration.showNotification(options.title, notificationOptions);
    } catch (error) {
      console.error('Failed to show notification:', error);
      throw error;
    }
  }

  /**
   * Send subscription to server
   */
  public async sendSubscriptionToServer(
    subscription: PushSubscriptionData
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
          },
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
      return false;
    }
  }

  /**
   * Remove subscription from server
   */
  public async removeSubscriptionFromServer(): Promise<boolean> {
    try {
      const subscription = await this.getSubscription();
      if (!subscription) {
        return true;
      }

      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
      return false;
    }
  }

  /**
   * Serialize push subscription for transmission
   */
  private serializeSubscription(
    subscription: PushSubscription
  ): PushSubscriptionData {
    const key = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: key ? this.arrayBufferToBase64(key) : '',
        auth: auth ? this.arrayBufferToBase64(auth) : '',
      },
    };
  }

  /**
   * Convert URL-safe base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// Create singleton instance
export const pushNotificationManager = new PushNotificationManager();

// React hook for push notifications
export function usePushNotifications() {
  const [isSupported, setIsSupported] = React.useState(false);
  const [permission, setPermission] =
    React.useState<NotificationPermission>('default');
  const [subscription, setSubscription] =
    React.useState<PushSubscriptionData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setIsSupported(pushNotificationManager.isNotificationSupported());
    setPermission(pushNotificationManager.getPermissionStatus());

    // Get current subscription
    pushNotificationManager.getSubscription().then(setSubscription);
  }, []);

  const requestPermission = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const newPermission = await pushNotificationManager.requestPermission();
      setPermission(newPermission);
      return newPermission;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const subscribe = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const newSubscription = await pushNotificationManager.subscribe();
      setSubscription(newSubscription);

      if (newSubscription) {
        await pushNotificationManager.sendSubscriptionToServer(newSubscription);
      }

      return newSubscription;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsubscribe = React.useCallback(async () => {
    setIsLoading(true);
    try {
      await pushNotificationManager.removeSubscriptionFromServer();
      const success = await pushNotificationManager.unsubscribe();

      if (success) {
        setSubscription(null);
      }

      return success;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const showNotification = React.useCallback(
    async (options: PushNotificationOptions) => {
      return pushNotificationManager.showNotification(options);
    },
    []
  );

  return {
    isSupported,
    permission,
    subscription,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
  };
}

// Notification types for HUNKCentral
export const NotificationTypes = {
  LOG_APPROVED: 'log_approved',
  LOG_REJECTED: 'log_rejected',
  COMMISSION_MATCHED: 'commission_matched',
  PAYROLL_READY: 'payroll_ready',
  SYSTEM_UPDATE: 'system_update',
  REMINDER: 'reminder',
} as const;

export type NotificationType =
  (typeof NotificationTypes)[keyof typeof NotificationTypes];

type NotificationTemplateData = {
  date: string;
  logId: string;
  reason?: string;
  clientName?: string;
  commissionId?: string;
  period?: string;
  periodId?: string;
  message?: string;
  version?: string;
  title?: string;
  reminderId?: string;
};

// Predefined notification templates
export const NotificationTemplates: Record<
  NotificationType,
  (data: NotificationTemplateData) => PushNotificationOptions
> = {
  [NotificationTypes.LOG_APPROVED]: (data) => ({
    title: 'Log Approved ✅',
    body: `Your daily log for ${data.date} has been approved.`,
    icon: '/icon-192x192.png',
    tag: 'log-approved',
    data: { type: 'log_approved', logId: data.logId },
    actions: [
      { action: 'view', title: 'View Log' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }),

  [NotificationTypes.LOG_REJECTED]: (data) => ({
    title: 'Log Needs Attention ⚠️',
    body: `Your daily log for ${data.date} needs corrections: ${data.reason}`,
    icon: '/icon-192x192.png',
    tag: 'log-rejected',
    data: { type: 'log_rejected', logId: data.logId },
    requireInteraction: true,
    actions: [
      { action: 'edit', title: 'Edit Log' },
      { action: 'view', title: 'View Details' },
    ],
  }),

  [NotificationTypes.COMMISSION_MATCHED]: (data) => ({
    title: 'Commission Matched 💰',
    body: `Your booking for ${data.clientName} has been matched to a completed job.`,
    icon: '/icon-192x192.png',
    tag: 'commission-matched',
    data: { type: 'commission_matched', commissionId: data.commissionId },
    actions: [
      { action: 'view', title: 'View Commission' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }),

  [NotificationTypes.PAYROLL_READY]: (data) => ({
    title: 'Payroll Ready 📊',
    body: `Your payroll for ${data.period} is ready for review.`,
    icon: '/icon-192x192.png',
    tag: 'payroll-ready',
    data: { type: 'payroll_ready', periodId: data.periodId },
    actions: [
      { action: 'view', title: 'View Payroll' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }),

  [NotificationTypes.SYSTEM_UPDATE]: (data) => ({
    title: 'System Update Available 🔄',
    body: data.message || 'A new version of HUNKCentral is available.',
    icon: '/icon-192x192.png',
    tag: 'system-update',
    data: { type: 'system_update', version: data.version },
    requireInteraction: true,
    actions: [
      { action: 'update', title: 'Update Now' },
      { action: 'later', title: 'Update Later' },
    ],
  }),

  [NotificationTypes.REMINDER]: (data) => ({
    title: data.title || 'Reminder',
    body: data.message || '',
    icon: '/icon-192x192.png',
    tag: 'reminder',
    data: { type: 'reminder', reminderId: data.reminderId },
    actions: [
      { action: 'complete', title: 'Mark Complete' },
      { action: 'snooze', title: 'Snooze' },
    ],
  }),
};

// Helper function to send notification
export async function sendNotification(
  type: NotificationType,
  data: NotificationTemplateData
): Promise<void> {
  const template = NotificationTemplates[type];
  const options = template(data);

  await pushNotificationManager.showNotification(options);
}

// Import React for the hook
import * as React from 'react';
