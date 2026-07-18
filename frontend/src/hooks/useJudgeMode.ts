import { useState, useEffect, useCallback } from 'react';
import type { JudgeModeStepId, JudgeModeStep } from '@/types';

export const JUDGE_STEPS: JudgeModeStep[] = [
  { id: 'overview', title: 'System Overview', subtitle: 'Nominal operational status' },
  { id: 'trigger', title: 'Trigger Scenario', subtitle: 'Simulate critical infrastructure event' },
  { id: 'telemetry', title: 'Live Telemetry', subtitle: 'Real-time cooling and sensor data' },
  { id: 'agents', title: 'Agent Activity', subtitle: 'Autonomous agent activation' },
  { id: 'mcp', title: 'MCP Invocations', subtitle: 'MCP tools and resource access logs' },
  { id: 'decision', title: 'Orchestrated Plan', subtitle: 'Actionable recovery directives' },
  { id: 'recovery', title: 'System Recovery', subtitle: 'Verifying system restoration' },
  { id: 'audit', title: 'Explainability & Audit', subtitle: 'Workflow execution logs' },
];

export function useJudgeMode() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<JudgeModeStepId>('overview');

  const currentIndex = JUDGE_STEPS.findIndex((s) => s.id === currentStepId);
  const currentStep = JUDGE_STEPS[currentIndex];

  const canGoNext = currentIndex < JUDGE_STEPS.length - 1;
  const canGoPrev = currentIndex > 0;
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === JUDGE_STEPS.length - 1;

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const goToStep = useCallback((id: JudgeModeStepId) => setCurrentStepId(id), []);

  const goNext = useCallback(() => {
    if (canGoNext) {
      setCurrentStepId(JUDGE_STEPS[currentIndex + 1].id);
    }
  }, [canGoNext, currentIndex]);

  const goPrev = useCallback(() => {
    if (canGoPrev) {
      setCurrentStepId(JUDGE_STEPS[currentIndex - 1].id);
    }
  }, [canGoPrev, currentIndex]);

  const advanceIfReady = useCallback((stepHistory: string[]) => {
    if (stepHistory.length === 0) return;
    const latest = stepHistory[stepHistory.length - 1];

    if (latest === 'HEATWAVE_TRIGGERED' || latest === 'COOLING_DEGRADATION') {
      if (currentStepId === 'trigger') {
        setCurrentStepId('telemetry');
      }
    } else if (latest === 'THERMAL_ANALYSIS') {
      if (currentStepId === 'telemetry') {
        setCurrentStepId('agents');
      }
    } else if (latest === 'RISK_ASSESSMENT') {
      if (currentStepId === 'agents') {
        setCurrentStepId('mcp');
      }
    } else if (latest === 'WORKLOAD_MIGRATION' || latest === 'MAINTENANCE_PLANNING') {
      if (currentStepId === 'mcp') {
        setCurrentStepId('decision');
      }
    } else if (latest === 'SUPPLIER_EVALUATION') {
      if (currentStepId === 'decision') {
        setCurrentStepId('recovery');
      }
    } else if (latest === 'PROCUREMENT_AND_RECOVERY' || latest === 'COMPLETED') {
      if (currentStepId === 'recovery') {
        setCurrentStepId('audit');
      }
    }
  }, [currentStepId]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') {
        goNext();
      } else if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === 'Escape') {
        close();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goNext, goPrev, close]);

  return {
    isOpen,
    currentStepId,
    currentStep,
    currentIndex,
    canGoNext,
    canGoPrev,
    isFirstStep,
    isLastStep,
    open,
    close,
    goToStep,
    goNext,
    goPrev,
    advanceIfReady,
  };
}
