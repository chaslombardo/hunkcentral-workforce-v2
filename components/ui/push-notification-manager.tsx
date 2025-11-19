'use client';

import * as React from 'react';
import { Bell, BellOff, Settings, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePushNotifications } from '@/lib/push-notifications';
import { useToast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  logApproved: boolean;
  logRejected: boolean;
  commissionMatched: boolean;
  payrollReady: boolean;
  systemUpdates: boolean;
  reminders: boolean;
}

export function PushNotificationManager() {
  const {
    isSupported,
    permission,
    subscription,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const { toast } = useToast();
  const [preferences, setPreferences] = React.useState<NotificationPreferences>(
    {
      logApproved: true,
      logRejected: true,
      commissionMatched: true,
      payrollReady: true,
      systemUpdates: true,
      reminders: true,
    }
  );

  // Load preferences from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('notification-preferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = React.useCallback(
    (newPreferences: NotificationPreferences) => {
      setPreferences(newPreferences);
      localStorage.setItem(
        'notification-preferences',
        JSON.stringify(newPreferences)
      );
    },
    []
  );

  const handleEnableNotifications = async () => {
    try {
      if (permission === 'default') {
        const newPermission = await requestPermission();
        if (newPermission !== 'granted') {
          toast({
            title: 'Permission Denied',
            description:
              'Notifications were not enabled. You can change this in your browser settings.',
            variant: 'destructive',
          });
          return;
        }
      }

      if (!subscription) {
        await subscribe();
        toast({
          title: 'Notifications Enabled',
          description:
            'You will now receive push notifications for important updates.',
        });
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      toast({
        title: 'Failed to Enable Notifications',
        description:
          'There was an error setting up notifications. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDisableNotifications = async () => {
    try {
      await unsubscribe();
      toast({
        title: 'Notifications Disabled',
        description: 'You will no longer receive push notifications.',
      });
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      toast({
        title: 'Failed to Disable Notifications',
        description:
          'There was an error disabling notifications. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusInfo = () => {
    if (!isSupported) {
      return {
        status: 'unsupported',
        title: 'Not Supported',
        description: 'Push notifications are not supported in this browser.',
        color: 'text-muted-foreground',
        icon: BellOff,
      };
    }

    if (permission === 'denied') {
      return {
        status: 'denied',
        title: 'Permission Denied',
        description:
          'Notifications are blocked. Enable them in your browser settings.',
        color: 'text-destructive',
        icon: BellOff,
      };
    }

    if (permission === 'granted' && subscription) {
      return {
        status: 'enabled',
        title: 'Notifications Enabled',
        description: 'You will receive notifications for important updates.',
        color: 'text-green-600',
        icon: Bell,
      };
    }

    return {
      status: 'disabled',
      title: 'Notifications Disabled',
      description: 'Enable notifications to stay updated on important events.',
      color: 'text-muted-foreground',
      icon: BellOff,
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn('h-5 w-5', statusInfo.color)} />
            <div>
              <CardTitle className="text-lg">{statusInfo.title}</CardTitle>
              <CardDescription>{statusInfo.description}</CardDescription>
            </div>
          </div>
          <Badge
            variant={statusInfo.status === 'enabled' ? 'default' : 'secondary'}
          >
            {statusInfo.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isSupported && (
          <Alert>
            <BellOff className="h-4 w-4" />
            <AlertDescription>
              Your browser doesn&apos;t support push notifications. Consider
              updating to a modern browser for the best experience.
            </AlertDescription>
          </Alert>
        )}

        {permission === 'denied' && (
          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertDescription>
              Notifications are blocked. To enable them:
              <br />
              1. Click the lock icon in your address bar
              <br />
              2. Set notifications to &quot;Allow&quot;
              <br />
              3. Refresh the page
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {statusInfo.status === 'disabled' &&
            isSupported &&
            permission !== 'denied' && (
              <Button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="bg-[#026937] hover:bg-[#026937]/90"
              >
                <Bell className="mr-2 h-4 w-4" />
                {isLoading ? 'Enabling...' : 'Enable Notifications'}
              </Button>
            )}

          {statusInfo.status === 'enabled' && (
            <Button
              onClick={handleDisableNotifications}
              disabled={isLoading}
              variant="outline"
            >
              <BellOff className="mr-2 h-4 w-4" />
              {isLoading ? 'Disabling...' : 'Disable Notifications'}
            </Button>
          )}

          {(statusInfo.status === 'enabled' ||
            statusInfo.status === 'disabled') && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Preferences
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Notification Preferences</DialogTitle>
                  <DialogDescription>
                    Choose which types of notifications you want to receive.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="log-approved">Log Approved</Label>
                        <p className="text-sm text-muted-foreground">
                          When your daily logs are approved by managers
                        </p>
                      </div>
                      <Switch
                        id="log-approved"
                        checked={preferences.logApproved}
                        onCheckedChange={(checked: boolean) =>
                          savePreferences({
                            ...preferences,
                            logApproved: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="log-rejected">Log Corrections</Label>
                        <p className="text-sm text-muted-foreground">
                          When your logs need corrections or are rejected
                        </p>
                      </div>
                      <Switch
                        id="log-rejected"
                        checked={preferences.logRejected}
                        onCheckedChange={(checked: boolean) =>
                          savePreferences({
                            ...preferences,
                            logRejected: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="commission-matched">
                          Commission Updates
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          When your bookings are matched to completed jobs
                        </p>
                      </div>
                      <Switch
                        id="commission-matched"
                        checked={preferences.commissionMatched}
                        onCheckedChange={(checked: boolean) =>
                          savePreferences({
                            ...preferences,
                            commissionMatched: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="payroll-ready">Payroll Ready</Label>
                        <p className="text-sm text-muted-foreground">
                          When your payroll is ready for review
                        </p>
                      </div>
                      <Switch
                        id="payroll-ready"
                        checked={preferences.payrollReady}
                        onCheckedChange={(checked: boolean) =>
                          savePreferences({
                            ...preferences,
                            payrollReady: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="system-updates">System Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          When new app versions are available
                        </p>
                      </div>
                      <Switch
                        id="system-updates"
                        checked={preferences.systemUpdates}
                        onCheckedChange={(checked: boolean) =>
                          savePreferences({
                            ...preferences,
                            systemUpdates: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="reminders">Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Task reminders and deadline notifications
                        </p>
                      </div>
                      <Switch
                        id="reminders"
                        checked={preferences.reminders}
                        onCheckedChange={(checked: boolean) =>
                          savePreferences({
                            ...preferences,
                            reminders: checked,
                          })
                        }
                      />
                    </div>
                  </div>

                  {statusInfo.status === 'enabled' && (
                    <Alert>
                      <Check className="h-4 w-4" />
                      <AlertDescription>
                        Your preferences are automatically saved and will take
                        effect immediately.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {subscription && (
          <div className="text-xs text-muted-foreground">
            <p>Device registered for notifications</p>
            <p className="font-mono truncate">
              {subscription.endpoint.split('/').pop()?.substring(0, 20)}...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Notification permission prompt component
export function NotificationPermissionPrompt() {
  const { isSupported, permission, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = React.useState(false);
  const { toast } = useToast();

  // Check if we should show the prompt
  const shouldShow = React.useMemo(() => {
    if (!isSupported || dismissed) return false;
    if (permission !== 'default') return false;

    // Check if user has already dismissed this prompt
    const dismissedTime = localStorage.getItem('notification-prompt-dismissed');
    if (dismissedTime) {
      const timeSinceDismissed = Date.now() - parseInt(dismissedTime, 10);
      // Don't show again for 7 days
      if (timeSinceDismissed < 7 * 24 * 60 * 60 * 1000) {
        return false;
      }
    }

    return true;
  }, [isSupported, permission, dismissed]);

  const handleEnable = async () => {
    try {
      await subscribe();
      setDismissed(true);
      toast({
        title: 'Notifications Enabled',
        description: 'You will now receive important updates.',
      });
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      toast({
        title: 'Failed to Enable Notifications',
        description: 'Please try again or check your browser settings.',
        variant: 'destructive',
      });
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(
      'notification-prompt-dismissed',
      Date.now().toString()
    );
  };

  if (!shouldShow) return null;

  return (
    <Alert className="border-[#026937]/20 bg-[#026937]/5">
      <Bell className="h-4 w-4 text-[#026937]" />
      <div className="flex-1">
        <AlertDescription className="text-[#026937]">
          <strong>Stay updated!</strong> Enable notifications to receive
          important updates about your logs, commissions, and payroll.
        </AlertDescription>
      </div>
      <div className="flex gap-2 ml-4">
        <Button
          size="sm"
          onClick={handleEnable}
          className="bg-[#026937] hover:bg-[#026937]/90 text-white"
        >
          Enable
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          className="text-[#026937] hover:bg-[#026937]/10"
        >
          Not now
        </Button>
      </div>
    </Alert>
  );
}
