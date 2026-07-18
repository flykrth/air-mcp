import { NextResponse } from 'next/server';

export async function GET() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  let backendReachable = false;
  let backendHealthDetails = null;

  try {
    const res = await fetch(`${apiBase}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 0 } // Disable fetch caching for health probes
    });
    
    if (res.ok) {
      backendReachable = true;
      backendHealthDetails = await res.json();
    } else {
      backendHealthDetails = { status: 'error', code: res.status };
    }
  } catch (err: any) {
    backendHealthDetails = { status: 'unreachable', error: err.message };
  }

  const responseBody = {
    status: backendReachable ? 'healthy' : 'degraded',
    frontend: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      nodeVersion: process.version
    },
    backend: {
      status: backendReachable ? 'healthy' : 'unhealthy',
      endpoint: apiBase,
      details: backendHealthDetails
    }
  };

  return NextResponse.json(responseBody, {
    status: backendReachable ? 200 : 503
  });
}
