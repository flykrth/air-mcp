'use client';

import React, { useState, useEffect } from 'react';
import { 
  Server, Thermometer, Activity, ShieldAlert, Wrench, 
  Truck, Cpu, CheckCircle2, RefreshCw, Play, Flame, Zap, HelpCircle
} from 'lucide-react';
import { 
  runWorkflow, getWorkflowState, resetWorkflowState 
} from '@/lib/api-client';
import { RunWorkflowResponse, Rack } from '@/types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function Dashboard() {
  const [state, setState] = useState<RunWorkflowResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'twin' | 'orchestrator' | 'history'>('twin');
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  // Fetch initial state
  const fetchState = async () => {
    try {
      const data = await getWorkflowState();
      setState(data);
      if (data.agent_logs) {
        setLogs(data.agent_logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000); // Poll state every 3s
    return () => clearInterval(interval);
  }, []);

  // Update chart data whenever state changes
  useEffect(() => {
    if (state && state.hotspots) {
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setChartData(prev => {
        const newData = [...prev];
        const entry: any = { time: timestamp, Ambient: state.cooling_loop.ambient_temp };
        
        state.hotspots.forEach(h => {
          entry[h.name] = h.temperature_celsius;
        });

        // Add dummy readings for non-hotspots so the chart has lines
        if (state.hotspots.length === 0) {
          entry['Average Racks'] = 22.5;
        }

        newData.push(entry);
        if (newData.length > 15) newData.shift(); // limit to 15 entries
        return newData;
      });
    }
  }, [state]);

  const handleTriggerAnomaly = async (type: 'HEATWAVE' | 'COOLING_DEGRADATION') => {
    setLoading(true);
    try {
      const API_BASE = 'http://localhost:8000/api/v1';
      await fetch(`${API_BASE}/orchestrator/run`, {
        method: 'POST', // Running triggers the event and loops the agents
      });
      await fetchState();
    } catch (err) {
      alert('Error triggering simulation.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await resetWorkflowState();
      setChartData([]);
      setSelectedRackId(null);
      await fetchState();
    } catch (err) {
      alert('Error resetting state.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunOrchestrator = async () => {
    setLoading(true);
    setActiveTab('orchestrator');
    try {
      const data = await runWorkflow();
      setState(data);
      setLogs(data.agent_logs || []);
    } catch (err) {
      alert('Workflow execution failed.');
    } finally {
      setLoading(false);
    }
  };

  // Find selected rack details
  const getSelectedRackDetails = () => {
    if (!selectedRackId || !state) return null;
    
    // Find in hotspots
    const hotspot = state.hotspots.find(h => h.rack_id === selectedRackId);
    if (hotspot) return hotspot;

    // Fetch baseline values if not active hotspot
    return {
      rack_id: selectedRackId,
      name: state.migrations_executed.find(m => m.workload_id === selectedRackId)?.target_rack || 'Rack Node',
      status: 'OPTIMAL',
      temperature_celsius: 22.5,
      power_draw_kw: 3.5,
      cooling_flow_rate_lps: 4.5,
      ambient_temperature: state.cooling_loop.ambient_temp
    };
  };

  const selectedRack = getSelectedRackDetails();

  // Helper to color rack state
  const getRackStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICAL': return 'bg-red-500/20 border-red-500 text-red-400 shadow-lg shadow-red-500/10 animate-pulse';
      case 'DEGRADED': return 'bg-amber-500/20 border-amber-500 text-amber-400';
      default: return 'bg-zinc-900/60 border-zinc-800 text-emerald-400 hover:border-emerald-500/50';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Banner */}
      <header className="border-b border-zinc-800 bg-zinc-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <Zap className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                AIR-MCP <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">Digital Twin</span>
              </h1>
              <p className="text-xs text-zinc-400">Adaptive Infrastructure Resilience Orchestrator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleReset}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 rounded-lg transition duration-200"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Reset System
            </button>
            <button 
              onClick={handleRunOrchestrator}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 rounded-lg transition duration-200 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Run Autonomous Mission
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: DC Layout Grid & Live Telemetry Panel */}
        <section className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Simulation Controls Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 backdrop-blur-md">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-400 mb-4 flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-400" />
              Simulate Environmental Outages
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => handleTriggerAnomaly('HEATWAVE')}
                className="flex flex-col text-left p-4 rounded-xl border border-red-950 bg-red-950/10 hover:bg-red-950/20 hover:border-red-800 transition duration-200 group cursor-pointer"
              >
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  Heatwave Trigger
                </span>
                <span className="text-sm font-semibold text-zinc-200 mb-0.5">Spike Ambient Temp</span>
                <span className="text-xs text-zinc-400 leading-normal">Forces cooling loop demand spike causing thermal hotspots.</span>
              </button>

              <button 
                onClick={() => handleTriggerAnomaly('COOLING_DEGRADATION')}
                className="flex flex-col text-left p-4 rounded-xl border border-amber-950 bg-amber-950/10 hover:bg-amber-950/20 hover:border-amber-800 transition duration-200 group cursor-pointer"
              >
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Cooling Degradation
                </span>
                <span className="text-sm font-semibold text-zinc-200 mb-0.5">Chiller Valve Restrict</span>
                <span className="text-xs text-zinc-400 leading-normal">Simulates severe cooling loop failure (flow restricted to 20%).</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-zinc-800 flex gap-6 text-sm">
            <button 
              onClick={() => setActiveTab('twin')}
              className={`pb-3 font-semibold transition ${activeTab === 'twin' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Digital Twin Layout
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`pb-3 font-semibold transition ${activeTab === 'history' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Real-time Analytics Chart
            </button>
          </div>

          {/* Tab Content 1: Digital Twin Grid */}
          {activeTab === 'twin' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {state?.hotspots && state.hotspots.length > 0 ? (
                state.hotspots.map(h => (
                  <button 
                    key={h.rack_id}
                    onClick={() => setSelectedRackId(h.rack_id)}
                    className={`flex flex-col justify-between text-left p-5 rounded-xl border transition duration-200 cursor-pointer ${getRackStatusColor(h.status)}`}
                  >
                    <div className="flex items-center justify-between w-full mb-4">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        <span className="font-bold text-sm">{h.name}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-zinc-950/60 border border-zinc-800">
                        Row {h.row_id} Col {h.column_id}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1 text-2xl font-black mb-1">
                        {h.temperature_celsius}°C
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-2 border-t border-zinc-800/40 pt-2">
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-zinc-500" />
                          {h.power_draw_kw}kW
                        </span>
                        <span className="flex items-center gap-1">
                          <Thermometer className="h-3 w-3 text-zinc-500" />
                          {h.cooling_flow_rate_lps} L/s
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                // Standard optimal racks grid
                state?.cooling_loop && Array.from({ length: 6 }).map((_, i) => {
                  const rackName = ['Rack-A1', 'Rack-A2', 'Rack-B1', 'Rack-B2', 'Rack-C1', 'Rack-C2'][i];
                  return (
                    <div 
                      key={i}
                      className="flex flex-col justify-between text-left p-5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-emerald-400"
                    >
                      <div className="flex items-center justify-between w-full mb-4">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-zinc-500" />
                          <span className="font-bold text-sm text-zinc-300">{rackName}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-zinc-950/60 text-zinc-500">
                          Row {Math.floor(i/2)} Col {i%2}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-baseline gap-1 text-2xl font-black text-zinc-100 mb-1">
                          22.5°C
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-2 border-t border-zinc-800/40 pt-2">
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3 text-zinc-500" />
                            {i === 5 ? '1.5' : i === 4 ? '3.5' : '6.2'}kW
                          </span>
                          <span className="flex items-center gap-1">
                            <Thermometer className="h-3 w-3 text-zinc-500" />
                            4.5 L/s
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab Content 2: Recharts Graph */}
          {activeTab === 'history' && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 backdrop-blur-md h-[320px]">
              <h3 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider mb-4">Real-Time Telemetry Curve</h3>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={10} />
                  <YAxis stroke="#71717a" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }} />
                  <Line type="monotone" dataKey="Ambient" stroke="#e11d48" strokeWidth={2} name="Ambient Temp" />
                  {state?.hotspots.map(h => (
                    <Line key={h.name} type="monotone" dataKey={h.name} stroke="#f59e0b" strokeWidth={1.5} />
                  ))}
                  {state?.hotspots.length === 0 && (
                    <Line type="monotone" dataKey="Average Racks" stroke="#10b981" strokeWidth={1.5} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

        </section>

        {/* Right Column: Mission Orchestrator Terminal Logs & Details */}
        <section className="flex flex-col gap-6">
          
          {/* Mission Progress Panel */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 backdrop-blur-md flex flex-col flex-1">
            <div className="border-b border-zinc-800 pb-3 mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-400 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-emerald-400" />
                Mission Orchestrator
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${state?.current_step === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : state?.current_step === 'IDLE' ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'}`}>
                {state?.current_step || 'IDLE'}
              </span>
            </div>

            {/* Steps Visual Flow */}
            <div className="mb-6 flex flex-col gap-2.5 text-xs">
              <div className={`flex items-center gap-2.5 p-2 rounded-lg border transition ${state?.step_history.includes('HEATWAVE_TRIGGERED') ? 'bg-red-500/10 border-red-500/20 text-red-300 font-semibold' : 'border-zinc-800/40 text-zinc-500'}`}>
                <Flame className="h-4 w-4" />
                1. Thermal/Cooling Anomaly
              </div>
              <div className={`flex items-center gap-2.5 p-2 rounded-lg border transition ${state?.step_history.includes('THERMAL_ANALYSIS') ? 'bg-amber-500/10 border-amber-500/20 text-amber-300 font-semibold' : 'border-zinc-800/40 text-zinc-500'}`}>
                <Activity className="h-4 w-4" />
                2. Health Telemetry Scan
              </div>
              <div className={`flex items-center gap-2.5 p-2 rounded-lg border transition ${state?.step_history.includes('RISK_ASSESSMENT') ? 'bg-amber-500/10 border-amber-500/20 text-amber-300 font-semibold' : 'border-zinc-800/40 text-zinc-500'}`}>
                <ShieldAlert className="h-4 w-4" />
                3. Financial Risk Analysis
              </div>
              <div className={`flex items-center gap-2.5 p-2 rounded-lg border transition ${state?.step_history.includes('WORKLOAD_MIGRATION') ? 'bg-blue-500/10 border-blue-500/20 text-blue-300 font-semibold' : 'border-zinc-800/40 text-zinc-500'}`}>
                <Server className="h-4 w-4" />
                4. Workload Hot Migration
              </div>
              <div className={`flex items-center gap-2.5 p-2 rounded-lg border transition ${state?.step_history.includes('MAINTENANCE_PLANNING') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 font-semibold' : 'border-zinc-800/40 text-zinc-500'}`}>
                <Wrench className="h-4 w-4" />
                5. Repair Dispatch Planning
              </div>
              <div className={`flex items-center gap-2.5 p-2 rounded-lg border transition ${state?.step_history.includes('SUPPLIER_EVALUATION') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 font-semibold' : 'border-zinc-800/40 text-zinc-500'}`}>
                <Truck className="h-4 w-4" />
                6. Supplier & Parts Selection
              </div>
              <div className={`flex items-center gap-2.5 p-2 rounded-lg border transition ${state?.step_history.includes('PROCUREMENT_AND_RECOVERY') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-semibold border-emerald-500/40' : 'border-zinc-800/40 text-zinc-500'}`}>
                <CheckCircle2 className="h-4 w-4" />
                7. PO Procurement & Recovery
              </div>
            </div>

            {/* Logs Area */}
            <div className="flex-1 min-h-[220px] bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 font-mono text-[11px] leading-relaxed text-zinc-400 overflow-y-auto max-h-[300px]">
              <div className="text-zinc-500 border-b border-zinc-900 pb-1.5 mb-2 uppercase text-[9px] tracking-widest font-bold">
                Live Orchestrator Console
              </div>
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className="mb-1.5 last:mb-0">
                    <span className="text-zinc-600">&gt;&gt;</span> {log}
                  </div>
                ))
              ) : (
                <div className="text-zinc-600 italic">No mission active. Waiting for trigger...</div>
              )}
            </div>
          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-4 bg-zinc-900/10">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-zinc-600">
          Amrita University MCP Hackathon 2026. Designed for absolute resilience.
        </div>
      </footer>
    </div>
  );
}
