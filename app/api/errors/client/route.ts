import { NextRequest, NextResponse } from 'next/server';
import { logServerError } from '@/lib/errorLogger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const { level, message, context } = body;
    
    // Validate the request body
    if (!message || !context || !context.component || !context.action) {
      return NextResponse.json(
        { error: 'Invalid error log format' },
        { status: 400 }
      );
    }

    // Create a client error object
    const clientError = new Error(`[CLIENT] ${message}`);
    clientError.stack = context.stack;

    // Log the client error using our server error logger
    await logServerError(clientError, {
      component: `client_${context.component}`,
      action: context.action,
      userId: session?.user?.id || context.userId || 'anonymous',
      userAgent: context.userAgent || request.headers.get('user-agent') || 'unknown',
      url: context.url || 'unknown',
      additionalData: {
        level,
        timestamp: context.timestamp,
        clientContext: context.additionalData,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log the error in processing client error logs
    await logServerError(error, {
      component: 'api_client_errors',
      action: 'process_client_error',
      url: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json(
      { error: 'Failed to log client error' },
      { status: 500 }
    );
  }
}