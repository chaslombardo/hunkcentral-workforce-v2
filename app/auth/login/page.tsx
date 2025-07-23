// Login page - will be fully implemented in authentication task
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-hunks-green to-hunks-orange flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            <span className="text-primary">HUNK</span>
            <span className="text-accent">Central</span>
          </CardTitle>
          <CardDescription>
            Sign in to your workforce management account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              disabled
            />
          </div>
          <Button className="w-full" disabled>
            Sign In
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Authentication will be implemented in task 3
          </p>
        </CardContent>
      </Card>
    </div>
  );
}