import { RunWorkflowResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function runWorkflow(): Promise<RunWorkflowResponse> {
  const res = await fetch(`${API_BASE}/orchestrator/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error('Failed to run orchestrator workflow.');
  }
  return res.json();
}

export async function getWorkflowState(): Promise<RunWorkflowResponse> {
  const res = await fetch(`${API_BASE}/orchestrator/state`);
  if (!res.ok) {
    throw new Error('Failed to fetch orchestrator state.');
  }
  return res.json();
}

export async function resetWorkflowState(): Promise<any> {
  const res = await fetch(`${API_BASE}/orchestrator/reset`, {
    method: 'POST'
  });
  if (!res.ok) {
    throw new Error('Failed to reset orchestrator state.');
  }
  return res.json();
}

export async function injectIncident(eventType: string, rackId?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/simulator/incident`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: eventType, rack_id: rackId || null })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to inject incident.');
  }
  return res.json();
}

export async function runOrchestrator(): Promise<RunWorkflowResponse> {
  return runWorkflow();
}
