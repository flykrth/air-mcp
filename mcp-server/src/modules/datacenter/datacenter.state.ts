import { randomUUID } from 'crypto';

export interface Rack {
  id: string;
  name: string;
  row_id: number;
  column_id: number;
  max_kw_capacity: number;
  cpu_capacity_cores: number;
  memory_capacity_gb: number;
  status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
  created_at: string;
}

export interface TelemetryLog {
  id: number;
  rack_id: string;
  temperature_celsius: number;
  power_draw_kw: number;
  cooling_flow_rate_lps: number;
  ambient_temperature: number;
  cpu_utilization_percent: number;
  memory_utilization_percent: number;
  recorded_at: string;
}

export interface CloudWorkload {
  id: string;
  rack_id: string;
  name: string;
  vcpus: number;
  memory_gb: number;
  power_kw: number;
  priority: number; // 1 to 5
  sla_threshold_temp: number;
  status: 'RUNNING' | 'MIGRATING' | 'TERMINATED' | 'COMPLETED';
  created_at: string;
}

export interface MaintenanceTicket {
  id: string;
  target_rack_id: string;
  issue_type: 'COOLING_LEAK' | 'FAN_FAILURE' | 'POWER_UNIT_FAULT' | 'GPU_OVERHEAT' | 'VALVE_BLOCKAGE';
  description: string;
  technician_id: string | null;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
  parts_required: Record<string, number>;
  scheduled_time: string;
  resolved_at: string | null;
  estimated_duration_hours: number;
  labor_hours: number;
  calculated_cost: number;
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
  items: {
    part_name: string;
    quantity: number;
    unit_price_usd: number;
    total_price_usd: number;
  }[];
  total_cost: number;
  status: 'PENDING' | 'ORDERED' | 'DELIVERED';
  estimated_delivery: string;
}

export interface IncidentHistory {
  id: string;
  rack_id: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  resolved: boolean;
  created_at: string;
  resolved_at: string | null;
}

export interface DecisionLogEntry {
  id: string;
  timestamp: string;
  toolName: string;
  input: any;
  outputSummary: string;
  reasoning: string;
}

export interface InventoryItem {
  part_name: string;
  stock: number;
  reorder_threshold: number;
  unit_cost: number;
}

export interface SlaPolicy {
  priority: number;
  category: string;
  penalty_per_hour_usd: number;
  max_allowable_temp: number;
}

export interface SopDocument {
  id: string;
  title: string;
  content: string;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  incident_id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  channel: 'EMAIL' | 'SLACK' | 'PAGERDUTY';
  message: string;
  status: 'SENT';
}

export class DatacenterState {
  private static instance: DatacenterState;

  racks: Rack[] = [];
  telemetryLogs: TelemetryLog[] = [];
  workloads: CloudWorkload[] = [];
  tickets: MaintenanceTicket[] = [];
  technicians: Technician[] = [];
  suppliers: Supplier[] = [];
  orders: ProcurementOrder[] = [];
  incidents: IncidentHistory[] = [];
  decisionLogs: DecisionLogEntry[] = [];
  warehouseInventory: Record<string, InventoryItem> = {};
  slaPolicies: SlaPolicy[] = [];
  sops: SopDocument[] = [];
  notifications: NotificationLog[] = [];

  // Simulation parameters
  ambientTemp = 24.0;
  coolingSystemHealthy = true;
  coolingSystemEfficiency = 1.0; // 0.0 to 1.0
  heatwaveActive = false;

  private telemetryLogCounter = 1;

  private constructor() {
    this.reset();
  }

  static getInstance(): DatacenterState {
    if (!DatacenterState.instance) {
      DatacenterState.instance = new DatacenterState();
    }
    return DatacenterState.instance;
  }

  logDecision(toolName: string, input: any, outputSummary: string, reasoning: string) {
    this.decisionLogs.push({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      toolName,
      input,
      outputSummary,
      reasoning
    });
  }

  reset() {
    this.racks = [];
    this.telemetryLogs = [];
    this.workloads = [];
    this.tickets = [];
    this.technicians = [];
    this.suppliers = [];
    this.orders = [];
    this.incidents = [];
    this.decisionLogs = [];
    this.warehouseInventory = {};
    this.slaPolicies = [];
    this.sops = [];
    this.notifications = [];
    this.ambientTemp = 24.0;
    this.coolingSystemHealthy = true;
    this.coolingSystemEfficiency = 1.0;
    this.heatwaveActive = false;
    this.telemetryLogCounter = 1;

    // Initialize 6 Racks (3x2 Grid)
    const rackNames = ['Rack-A1', 'Rack-A2', 'Rack-B1', 'Rack-B2', 'Rack-C1', 'Rack-C2'];
    let idx = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const name = rackNames[idx++];
        this.racks.push({
          id: randomUUID(),
          name,
          row_id: row,
          column_id: col,
          max_kw_capacity: 15.0,
          cpu_capacity_cores: 64,
          memory_capacity_gb: 256,
          status: 'OPTIMAL',
          created_at: new Date().toISOString()
        });
      }
    }

    // Initialize Warehouse Inventory
    const partsList = [
      { part_name: 'chiller_fan_v2', stock: 2, reorder_threshold: 3, unit_cost: 350 },
      { part_name: 'coolant_valve_3in', stock: 0, reorder_threshold: 2, unit_cost: 950 },
      { part_name: 'ambient_sensor_hxt', stock: 15, reorder_threshold: 5, unit_cost: 45 },
      { part_name: 'crac_compressor_p4', stock: 1, reorder_threshold: 1, unit_cost: 4500 },
      { part_name: 'gpu_fan_block', stock: 8, reorder_threshold: 4, unit_cost: 120 }
    ];
    for (const p of partsList) {
      this.warehouseInventory[p.part_name] = p;
    }

    // Initialize SLA Policies
    this.slaPolicies = [
      { priority: 5, category: 'Mission Critical', penalty_per_hour_usd: 5000, max_allowable_temp: 35.0 },
      { priority: 4, category: 'Production Tier 1', penalty_per_hour_usd: 2500, max_allowable_temp: 35.0 },
      { priority: 3, category: 'Production Tier 2', penalty_per_hour_usd: 1000, max_allowable_temp: 32.0 },
      { priority: 2, category: 'Dev/Test Environment', penalty_per_hour_usd: 250, max_allowable_temp: 32.0 },
      { priority: 1, category: 'Batch Processing', penalty_per_hour_usd: 50, max_allowable_temp: 30.0 }
    ];

    // Initialize SOPs
    this.sops = [
      {
        id: 'sop-cooling-failure',
        title: 'Emergency Chiller/Cooling Loop Failure Response SOP',
        content: `# SOP: Emergency Chiller/Cooling Loop Failure Response

## 1. Diagnostics & Verification
- Check \`Telemetry Feed\` to confirm drop in cooling flow rates (\`cooling_flow_rate_lps\` < 2.0 L/s).
- Verify chiller efficiency rating and chiller valve pressure.

## 2. Mitigation Strategy
- Identify all racks with temperature trending above 30.0°C.
- Calculate SLA financial exposure and failure risks.
- Migrate high-priority workloads (Priority 4 and 5) first to stable zones (Row C, column 1 & 2).

## 3. Maintenance and Technician Dispatch
- File an emergency corrective maintenance work order detailing needed parts.
- Allocate certified technicians matching the required skillset (e.g. "CRAC Repair").
- Check warehouse inventory. If parts are missing, submit procurement order.
`
      },
      {
        id: 'sop-thermal-hotspot',
        title: 'Localized Thermal Hotspot Investigation SOP',
        content: `# SOP: Localized Thermal Hotspot Investigation

## 1. Hotspot Identification
- A localized thermal hotspot is defined as any server rack temperature exceeding 35.0°C while surrounding racks remain stable.
- Check fans and air exhaust blockage telemetry.

## 2. Load Management
- Migrate low-priority workloads away from the affected rack to reduce power draw.
- Cap power draw if temperature exceeds 40.0°C.

## 3. Physical Dispatch
- Schedule a technician to inspect rack fan array and airflow baffles.
`
      },
      {
        id: 'sop-power-instability',
        title: 'Power Distribution Unit (PDU) & Power Grid Instability SOP',
        content: `# SOP: Power Grid and PDU Instability

## 1. Emergency Assessment
- Evaluate grid frequency fluctuations.
- Run load balancing to balance power draw across grid phases.
`
      }
    ];

    // Seed Incidents
    this.incidents = [
      {
        id: 'inc-001',
        rack_id: this.racks[0].id,
        description: 'Chiller valve pressure fluctuation detected. Local temperature spike.',
        severity: 'WARNING',
        resolved: true,
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        resolved_at: new Date(Date.now() - 3600000 * 23).toISOString()
      }
    ];

    // Initialize Workloads on Racks
    const nowStr = new Date().toISOString();
    for (let i = 0; i < this.racks.length; i++) {
      const rack = this.racks[i];
      // 2 workloads per rack
      this.workloads.push({
        id: randomUUID(),
        rack_id: rack.id,
        name: `${rack.name}-Job-1`,
        vcpus: 8,
        memory_gb: 32,
        power_kw: 1.5,
        priority: i % 2 === 0 ? 4 : 2, // High priority on some
        sla_threshold_temp: 35.0,
        status: 'RUNNING',
        created_at: nowStr
      });
      this.workloads.push({
        id: randomUUID(),
        rack_id: rack.id,
        name: `${rack.name}-Job-2`,
        vcpus: 4,
        memory_gb: 16,
        power_kw: 0.8,
        priority: 1,
        sla_threshold_temp: 32.0,
        status: 'RUNNING',
        created_at: nowStr
      });
    }

    // Initialize Telemetry with varied power loads (realistic thermal dynamics)
    for (const rack of this.racks) {
      // Calculate active workload power draw
      const activeWorkloads = this.workloads.filter(w => w.rack_id === rack.id && w.status === 'RUNNING');
      const powerLoad = activeWorkloads.reduce((acc, w) => acc + w.power_kw, 2.0); // 2.0kW base rack overhead
      const totalCpuUsed = activeWorkloads.reduce((acc, w) => acc + w.vcpus, 0);
      const totalMemUsed = activeWorkloads.reduce((acc, w) => acc + w.memory_gb, 0);

      this.telemetryLogs.push({
        id: this.telemetryLogCounter++,
        rack_id: rack.id,
        temperature_celsius: 22.5,
        power_draw_kw: powerLoad,
        cooling_flow_rate_lps: 4.5,
        ambient_temperature: this.ambientTemp,
        cpu_utilization_percent: Math.round((totalCpuUsed / rack.cpu_capacity_cores) * 100),
        memory_utilization_percent: Math.round((totalMemUsed / rack.memory_capacity_gb) * 100),
        recorded_at: nowStr
      });
    }

    // Initialize Technicians
    this.technicians = [
      { id: randomUUID(), name: 'Sarah Connor', skillset: ['CRAC Repair', 'Cooling Loops', 'Piping'], status: 'AVAILABLE', current_ticket_id: null },
      { id: randomUUID(), name: 'John Connor', skillset: ['GPU Replacement', 'Power Distribution', 'CRAC Repair'], status: 'AVAILABLE', current_ticket_id: null },
      { id: randomUUID(), name: 'T-800', skillset: ['Physical Maintenance', 'Heavy Valve Replacement'], status: 'AVAILABLE', current_ticket_id: null }
    ];

    // Initialize Suppliers
    this.suppliers = [
      {
        id: randomUUID(),
        name: 'Apex Cooling Systems Inc.',
        rating: 4.8,
        inventory: {
          'chiller_fan_v2': { stock: 5, price: 450.00, lead_time_hours: 2 },
          'coolant_valve_3in': { stock: 2, price: 1200.00, lead_time_hours: 4 },
          'crac_compressor_p4': { stock: 1, price: 4200.00, lead_time_hours: 6 }
        }
      },
      {
        id: randomUUID(),
        name: 'Global HVAC Logistics',
        rating: 4.2,
        inventory: {
          'chiller_fan_v2': { stock: 12, price: 380.00, lead_time_hours: 8 },
          'coolant_valve_3in': { stock: 0, price: 1100.00, lead_time_hours: 24 }
        }
      }
    ];
  }

  // Update telemetry based on simulation state
  tick() {
    const nowStr = new Date().toISOString();
    
    // Determine heatwave effect
    if (this.heatwaveActive) {
      this.ambientTemp = Math.min(42.0, this.ambientTemp + 0.5);
    } else {
      this.ambientTemp = Math.max(24.0, this.ambientTemp - 0.5);
    }

    for (const rack of this.racks) {
      // Find latest telemetry
      const logs = this.telemetryLogs.filter(l => l.rack_id === rack.id);
      const latest = logs[logs.length - 1];

      // Base cooling flow
      let coolingFlow = 4.5;
      if (!this.coolingSystemHealthy && rack.row_id !== 2) {
        // Zone 1 (Row A & B) is degraded. Zone 2 (Row C) has backup CRAC active
        coolingFlow = Math.max(0.5, coolingFlow * this.coolingSystemEfficiency);
      }

      // Calculate power draw and utilization dynamically based on workloads
      const activeWorkloads = this.workloads.filter(w => w.rack_id === rack.id && w.status === 'RUNNING');
      const powerLoad = activeWorkloads.reduce((acc, w) => acc + w.power_kw, 2.0);
      const totalCpuUsed = activeWorkloads.reduce((acc, w) => acc + w.vcpus, 0);
      const totalMemUsed = activeWorkloads.reduce((acc, w) => acc + w.memory_gb, 0);

      // Calculate new temperature based on heat production and cooling effectiveness
      const powerHeat = powerLoad * 1.5;
      const ambientEffect = (this.ambientTemp - 20.0) * 0.4;
      const coolingEffect = coolingFlow * 5.0;

      let temp = (latest ? latest.temperature_celsius : 22.5) + (powerHeat + ambientEffect - coolingEffect) * 0.4;
      // Cap minimum at cooling air floor temperature (18.0 C)
      temp = Math.max(18.0, temp);

      // Check threshold and update status
      if (temp >= 40.0) {
        rack.status = 'CRITICAL';
      } else if (temp >= 30.0) {
        rack.status = 'DEGRADED';
      } else {
        rack.status = 'OPTIMAL';
      }

      this.telemetryLogs.push({
        id: this.telemetryLogCounter++,
        rack_id: rack.id,
        temperature_celsius: Math.round(temp * 10) / 10,
        power_draw_kw: Math.round(powerLoad * 10) / 10,
        cooling_flow_rate_lps: Math.round(coolingFlow * 10) / 10,
        ambient_temperature: Math.round(this.ambientTemp * 10) / 10,
        cpu_utilization_percent: Math.round((totalCpuUsed / rack.cpu_capacity_cores) * 100),
        memory_utilization_percent: Math.round((totalMemUsed / rack.memory_capacity_gb) * 100),
        recorded_at: nowStr
      });
    }
  }
}
