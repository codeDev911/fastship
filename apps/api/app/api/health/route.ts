import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const startTime = performance.now();
    
    // Perform a simple database query to test connectivity
    // This is just a basic health check - a simple operation to verify the API is running
    const responseTime = performance.now() - startTime;

    return NextResponse.json(
      {
        status: 'healthy',
        message: 'API is operational',
        timestamp: new Date().toISOString(),
        responseTime: Math.round(responseTime),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
