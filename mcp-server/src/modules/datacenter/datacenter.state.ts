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

  async sync() {
    try {
      const response = await fetch('http://localhost:8000/api/v1/simulator/state');
      if (response.ok) {
        const data = (await response.json()) as any;
        
        this.ambientTemp = data.ambient_temp;
        this.coolingSystemHealthy = data.cooling_system_healthy;
        this.coolingSystemEfficiency = data.cooling_system_efficiency;
        this.heatwaveActive = data.heatwave_active;

        this.racks = data.racks.map((r: any) => ({
          id: r.id,
          name: r.name,
          row_id: r.row_id,
          column_id: r.column_id,
          max_kw_capacity: r.max_kw_capacity,
          cpu_capacity_cores: r.cpu_capacity_cores,
          memory_capacity_gb: r.memory_capacity_gb,
          status: r.status,
          created_at: r.created_at || new Date().toISOString()
        }));

        this.workloads = data.workloads.map((w: any) => ({
          id: w.id,
          rack_id: w.rack_id,
          name: w.name,
          vcpus: w.vcpus,
          memory_gb: w.memory_gb,
          power_kw: w.power_kw,
          priority: w.priority,
          sla_threshold_temp: w.sla_threshold_temp,
          status: w.status,
          created_at: w.created_at
        }));

        this.technicians = data.technicians.map((t: any) => ({
          id: t.id,
          name: t.name,
          skillset: t.skillset,
          status: t.status,
          current_ticket_id: t.current_ticket_id
        }));

        this.suppliers = data.suppliers.map((s: any) => ({
          id: s.id,
          name: s.name,
          rating: s.rating,
          inventory: s.inventory
        }));

        this.orders = data.orders.map((o: any) => ({
          id: o.id,
          ticket_id: o.ticket_id,
          supplier_id: o.supplier_id,
          items: o.items.map((item: any) => ({
            part_name: item.part_name,
            quantity: item.quantity,
            unit_price_usd: item.unit_price_usd,
            total_price_usd: item.total_price_usd
          })),
          total_cost: o.total_cost,
          status: o.status,
          estimated_delivery: o.estimated_delivery
        }));

        this.tickets = data.tickets.map((t: any) => ({
          id: t.id,
          target_rack_id: t.target_rack_id,
          issue_type: t.issue_type,
          description: t.description,
          technician_id: t.technician_id,
          status: t.status,
          parts_required: t.parts_required,
          scheduled_time: t.scheduled_time,
          resolved_at: t.resolved_at,
          estimated_duration_hours: t.estimated_duration_hours,
          labor_hours: t.labor_hours,
          calculated_cost: t.calculated_cost
        }));

        this.incidents = data.incidents.map((i: any) => ({
          id: i.id,
          rack_id: i.rack_id,
          description: i.description,
          severity: i.severity,
          resolved: i.resolved,
          created_at: i.created_at,
          resolved_at: i.resolved_at
        }));

        this.telemetryLogs = data.telemetry_logs.map((log: any) => ({
          id: log.id,
          rack_id: log.rack_id,
          temperature_celsius: log.temperature_celsius,
          power_draw_kw: log.power_draw_kw,
          cooling_flow_rate_lps: log.cooling_flow_rate_lps,
          ambient_temperature: log.ambient_temperature,
          cpu_utilization_percent: log.cpu_utilization_percent,
          memory_utilization_percent: log.memory_utilization_percent,
          recorded_at: log.recorded_at
        }));

        for (const key of Object.keys(data.inventory)) {
          const inv = data.inventory[key];
          this.warehouseInventory[key] = {
            part_name: inv.part_name,
            stock: inv.stock,
            reorder_threshold: inv.reorder_threshold,
            unit_cost: inv.unit_cost
          };
        }
        return true;
      }
    } catch (err) {
      // console.warn("[MCP STATE] Simulator backend offline. Running in standalone mode.");
    }
    return false;
  }

  async resetBackend() {
    try {
      const response = await fetch('http://localhost:8000/api/v1/simulator/reset', { method: 'POST' });
      if (response.ok) {
        await this.sync();
        return true;
      }
    } catch (err) {}
    this.resetLocal();
    return false;
  }

  async tickBackend() {
    try {
      const response = await fetch('http://localhost:8000/api/v1/simulator/tick', { method: 'POST' });
      if (response.ok) {
        await this.sync();
        return true;
      }
    } catch (err) {}
    this.tickLocal();
    return false;
  }

  async migrateWorkloadBackend(workloadId: string, targetRackId: string) {
    try {
      const response = await fetch('http://localhost:8000/api/v1/simulator/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workload_id: workloadId, target_rack_id: targetRackId })
      });
      if (response.ok) {
        await this.sync();
        return true;
      }
    } catch (err) {}
    return false;
  }

  async planMaintenanceBackend(targetRackId: string, issueType: string, description: string) {
    try {
      const response = await fetch('http://localhost:8000/api/v1/simulator/maintenance/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_rack_id: targetRackId, issue_type: issueType, description })
      });
      if (response.ok) {
        const data = (await response.json()) as any;
        await this.sync();
        return data.ticket;
      }
    } catch (err) {}
    return null;
  }

  async scheduleTechnicianBackend(ticketId: string, technicianId: string, scheduledTime: string) {
    try {
      const response = await fetch('http://localhost:8000/api/v1/simulator/maintenance/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketId, technician_id: technicianId, scheduled_time: scheduledTime })
      });
      if (response.ok) {
        await this.sync();
        return true;
      }
    } catch (err) {}
    return false;
  }

  async confirmMaintenanceRepairBackend(ticketId: string) {
    try {
      const response = await fetch('http://localhost:8000/api/v1/simulator/maintenance/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketId })
      });
      if (response.ok) {
        await this.sync();
        return true;
      }
    } catch (err) {}
    return false;
  }

  async generateProcurementPlanBackend(ticketId: string, supplierId: string, parts: Record<string, number>) {
    try {
      const response = await fetch('http://localhost:8000/api/v1/simulator/procure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketId, supplier_id: supplierId, parts })
      });
      if (response.ok) {
        const data = (await response.json()) as any;
        await this.sync();
        return data.procurement_order;
      }
    } catch (err) {}
    return null;
  }

  async triggerSimulationEventBackend(eventType: string) {
    try {
      const response = await fetch('http://localhost:8000/api/v1/simulator/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: eventType })
      });
      if (response.ok) {
        await this.sync();
        return true;
      }
    } catch (err) {}
    return false;
  }

  reset() {
    this.resetLocal();
  }

  tick() {
    this.tickLocal();
  }

  resetLocal() {
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

    // Initialize Racks
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
        content: `# SOP: Emergency Chiller/Cooling Loop Failure Response\n\n## 1. Diagnostics & Verification\n- Check Telemetry Feed...\n`
      },
      {
        id: 'sop-thermal-hotspot',
        title: 'Localized Thermal Hotspot Investigation SOP',
        content: `# SOP: Localized Thermal Hotspot Investigation\n\n## 1. Hotspot Identification...\n`
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

    // Initialize Workloads
    const nowStr = new Date().toISOString();
    for (let i = 0; i < this.racks.length; i++) {
      const rack = this.racks[i];
      this.workloads.push({
        id: randomUUID(),
        rack_id: rack.id,
        name: `${rack.name}-Job-1`,
        vcpus: 8,
        memory_gb: 32,
        power_kw: 1.5,
        priority: i % 2 === 0 ? 4 : 2,
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

    // Initialize Telemetry
    for (const rack of this.racks) {
      const activeWorkloads = this.workloads.filter(w => w.rack_id === rack.id && w.status === 'RUNNING');
      const powerLoad = activeWorkloads.reduce((acc, w) => acc + w.power_kw, 2.0);
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

  tickLocal() {
    const nowStr = new Date().toISOString();
    
    if (this.heatwaveActive) {
      this.ambientTemp = Math.min(42.0, this.ambientTemp + 0.5);
    } else {
      this.ambientTemp = Math.max(24.0, this.ambientTemp - 0.5);
    }

    for (const rack of this.racks) {
      const logs = this.telemetryLogs.filter(l => l.rack_id === rack.id);
      const latest = logs[logs.length - 1];

      let coolingFlow = 4.5;
      if (!this.coolingSystemHealthy && rack.row_id !== 2) {
        coolingFlow = Math.max(0.5, coolingFlow * this.coolingSystemEfficiency);
      }

      const activeWorkloads = this.workloads.filter(w => w.rack_id === rack.id && w.status === 'RUNNING');
      const powerLoad = activeWorkloads.reduce((acc, w) => acc + w.power_kw, 2.0);
      const totalCpuUsed = activeWorkloads.reduce((acc, w) => acc + w.vcpus, 0);
      const totalMemUsed = activeWorkloads.reduce((acc, w) => acc + w.memory_gb, 0);

      const powerHeat = powerLoad * 1.5;
      const ambientEffect = (this.ambientTemp - 20.0) * 0.4;
      const coolingEffect = coolingFlow * 5.0;

      let temp = (latest ? latest.temperature_celsius : 22.5) + (powerHeat + ambientEffect - coolingEffect) * 0.4;
      temp = Math.max(18.0, temp);

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
