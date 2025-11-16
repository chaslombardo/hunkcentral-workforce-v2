'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Please enter your email or username'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const errorMessages = {
  session_required: 'Please sign in to access this page.',
  invalid_session: 'Your session has expired. Please sign in again.',
  middleware_error: 'A system error occurred. Please try signing in again.',
  access_denied: 'Access denied. Please contact your administrator.',
  session_recovery_failed:
    'Unable to recover your session. Please sign in again.',
  authentication_failed: 'Authentication failed. Please try again.',
  signout_failed: 'There was a problem signing out. Please try again.',
  account_deactivated:
    'Your account has been deactivated. Contact your administrator.',
  system_error: 'A system error occurred. Please try again.',
  session_error: 'There was a problem with your session. Please sign in again.',
  CredentialsSignin: 'Invalid credentials. Please try again.',
  default: 'An unexpected error occurred. Please try again.',
};

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'form'>) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Handle URL error parameters
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      const errorMessage =
        errorMessages[urlError as keyof typeof errorMessages] ||
        errorMessages.default;
      setError(errorMessage);
    }
  }, [searchParams]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
      const result = await signIn('credentials', {
        identifier: data.identifier.trim(),
        password: data.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        const errorMessage =
          errorMessages[result.error as keyof typeof errorMessages] ||
          errorMessages.default;
        setError(errorMessage);
        return;
      }

      if (result?.ok) {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('error');
        cleanUrl.searchParams.delete('callbackUrl');
        window.history.replaceState({}, document.title, cleanUrl.toString());
        router.replace(cleanUrl.toString());
        router.refresh();
        return;
      }

      setError(errorMessages.authentication_failed);
    } catch (authError) {
      console.error('Login error:', authError);
      setError(errorMessages.system_error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className={cn('flex flex-col gap-6', className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">
          <span className="text-hunks-green">HUNK</span>
          <span className="text-hunks-orange">Central</span>
        </h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your credentials to access your workforce management account
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="identifier">Email or Username</Label>
          <Input
            id="identifier"
            type="text"
            placeholder="Enter your email or username"
            autoComplete="username"
            {...register('identifier')}
            disabled={isLoading}
            required
          />
          {errors.identifier && (
            <p className="text-sm text-destructive">
              {errors.identifier.message}
            </p>
          )}
        </div>

        <div className="grid gap-3">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            {...register('password')}
            disabled={isLoading}
            required
          />
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-hunks-green hover:bg-hunks-green/90 text-white"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Contact your administrator if you need help accessing your account
      </div>
    </form>
  );
}
