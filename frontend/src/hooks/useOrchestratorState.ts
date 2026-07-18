import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkflowState, runWorkflow } from '@/lib/api-client';

export const ORCHESTRATOR_KEY = ['orchestratorState'] as const;

export function useOrchestratorState() {
  return useQuery({
    queryKey: ORCHESTRATOR_KEY,
    queryFn: getWorkflowState,
    refetchInterval: (query) => {
      const state = query.state.data;
      if (state && state.status !== 'IDLE' && !state.recovery_verified && state.current_step !== 'COMPLETED') {
        return 1500;
      }
      return 5000;
    },
  });
}

export function useRunOrchestrator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runWorkflow,
    onSuccess: (data) => {
      queryClient.setQueryData(ORCHESTRATOR_KEY, data);
    },
  });
}
