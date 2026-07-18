export interface Rack {
  id: string;
  name: string;
  row_id: number;
  column_id: number;
  max_kw_capacity: number;
  status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
  created_at: string;
}

export interface TelemetryLog {
  id?: number;
  rack_id: string;
  temperature_celsius: number;
  power_draw_kw: number;
  cooling_flow_rate_lps: number;
  ambient_temperature: number;
  recorded_at: string;
}

export interface CloudWorkload {
  id: string;
  rack_id: string;
  name: string;
  vcpus: number;
  memory_gb: number;
  priority: number;
  sla_threshold_temp: number;
  status: 'RUNNING' | 'MIGRATING' | 'TERMINATED' | 'COMPLETED';
  created_at: string;
}

export interface MaintenanceTicket {
  id: string;
  target_rack_id: string;
  description: string;
  technician_id: string | null;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
  parts_required: Record<string, number>;
  scheduled_time: string;
  resolved_at: string | null;
}

export interface Technician {
  id: string;
  name: string;
  skillset: string[];
  status: 'AVAILABLE' | 'ON_DUTY' | 'OFF_LINE';
  current_ticket_id: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  rating: number;
  inventory: Record<string, { stock: number; price: number; lead_time_hours: number }>;
}

export interface ProcurementOrder {
  id: string;
  ticket_id: string;
  supplier_id: string;
  item_name: string;
  quantity: number;
  total_cost: number;
  status: 'PENDING' | 'ORDERED' | 'DELIVERED';
  estimated_delivery: string;
}

export interface RunWorkflowResponse {
  status: string;
  current_step: string;
  step_history: string[];
  agent_logs: string[];
  hotspots: Array<{
    rack_id: string;
    name: string;
    status: string;
    row_id: number;
    column_id: number;
    temperature_celsius: number;
    power_draw_kw: number;
    cooling_flow_rate_lps: number;
    ambient_temperature: number;
    recorded_at: string;
  }>;
  cooling_loop: {
    healthy: boolean;
    efficiency: number;
    ambient_temp: number;
    status: string;
    chiller_flow_lps: number;
  };
  risk_exposure_usd: number;
  at_risk_workloads: Array<{
    workload_id: string;
    workload_name: string;
    current_rack: string;
    temperature: number;
    threshold: number;
    failure_probability: number;
    potential_penalty_usd: number;
    calculated_risk_cost_usd: number;
  }>;
  migrations_executed: Array<{
    workload_id: string;
    workload_name: string;
    target_rack: string;
    status: string;
  }>;
  ticket: MaintenanceTicket | null;
  selected_technician: Technician | null;
  selected_supplier: Supplier | null;
  order: ProcurementOrder | null;
  recovery_verified: boolean;
  recovery_message: string | null;
}

export interface HotspotRack {
  rack_id: string;
  name: string;
  status: string;
  row_id: number;
  column_id: number;
  temperature_celsius: number;
  power_draw_kw: number;
  cooling_flow_rate_lps: number;
  ambient_temperature: number;
  recorded_at: string;
}

export type JudgeModeStepId =
  | 'overview'
  | 'trigger'
  | 'telemetry'
  | 'agents'
  | 'mcp'
  | 'decision'
  | 'recovery'
  | 'audit';

export interface JudgeModeStep {
  id: JudgeModeStepId;
  title: string;
  subtitle: string;
}

export interface TelemetryChartPoint {
  time: string;
  ambient: number;
  [key: string]: string | number;
}

export type OrchestratorStep =
  | 'IDLE'
  | 'HEATWAVE_TRIGGERED'
  | 'COOLING_DEGRADATION'
  | 'THERMAL_ANALYSIS'
  | 'RISK_ASSESSMENT'
  | 'WORKLOAD_MIGRATION'
  | 'MAINTENANCE_PLANNING'
  | 'SUPPLIER_EVALUATION'
  | 'PROCUREMENT_AND_RECOVERY'
  | 'COMPLETED';

export interface AtRiskWorkload {
  workload_id: string;
  workload_name: string;
  current_rack: string;
  temperature: number;
  threshold: number;
  failure_probability: number;
  potential_penalty_usd: number;
  calculated_risk_cost_usd: number;
}
