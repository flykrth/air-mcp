import { RunWorkflowResponse } from '@/types';

const API_BASE = 'http://localhost:8000/api/v1';

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
