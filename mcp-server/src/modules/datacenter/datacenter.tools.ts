import { ToolDecorator as Tool, ExecutionContext, z } from '@nitrostack/core';
import { DatacenterState } from './datacenter.state.js';
import { randomUUID } from 'crypto';

export class DatacenterTools {
  private state = DatacenterState.getInstance();

  @Tool({
    name: 'analyze_infrastructure_health',
    description: 'Analyze real-time health metrics of data center infrastructure racks.',
    inputSchema: z.object({
      rack_id: z.string().optional().describe('Optional rack UUID to filter health analysis'),
      all: z.boolean().optional().default(true).describe('If true, analyze health of all racks')
    }),
    examples: {
      request: {
        all: true
      },
      response: {
        status: 'success',
        health_metrics: [
          {
            rack_id: 'rack-uuid-123',
            name: 'Rack-A1',
            health_score: 95,
            status: 'OPTIMAL',
            temperature: 24.5,
            power_draw_kw: 4.3,
            cpu_utilization: 15,
            memory_utilization: 12,
            anomalies: []
          }
        ]
      }
    }
  })
  async analyzeInfrastructureHealth(input: { rack_id?: string; all?: boolean }, ctx: ExecutionContext) {
    ctx.logger.info('Executing tool: analyze_infrastructure_health', input);
    this.state.tick();

    let targetRacks = this.state.racks;
    if (input.rack_id) {
      targetRacks = this.state.racks.filter(r => r.id === input.rack_id);
      if (targetRacks.length === 0) {
        throw new Error(`Rack with ID ${input.rack_id} not found.`);
      }
    }

    const healthMetrics = targetRacks.map(rack => {
      const logs = this.state.telemetryLogs.filter(l => l.rack_id === rack.id);
      const latest = logs[logs.length - 1] || {
        temperature_celsius: 22.5,
        power_draw_kw: 2.0,
        cooling_flow_rate_lps: 4.5,
        cpu_utilization_percent: 0,
        memory_utilization_percent: 0,
        ambient_temperature: 24.0
      };

      let healthScore = 100;
      const anomalies: string[] = [];

      // Temperature penalty
      if (latest.temperature_celsius > 35.0) {
        healthScore -= (latest.temperature_celsius - 35.0) * 4 + 20;
        anomalies.push(`Critical temperature threshold exceeded: ${latest.temperature_celsius}°C`);
      } else if (latest.temperature_celsius > 28.0) {
        healthScore -= (latest.temperature_celsius - 28.0) * 2 + 5;
        anomalies.push(`Elevated temperature detected: ${latest.temperature_celsius}°C`);
      }

      // Cooling flow penalty
      if (latest.cooling_flow_rate_lps < 2.0) {
        healthScore -= 25;
        anomalies.push(`Cooling flow rate critically low: ${latest.cooling_flow_rate_lps} L/s`);
      } else if (latest.cooling_flow_rate_lps < 3.5) {
        healthScore -= 10;
        anomalies.push(`Cooling flow rate degraded: ${latest.cooling_flow_rate_lps} L/s`);
      }

      // Resource utilization penalty
      if (latest.cpu_utilization_percent > 90) {
        healthScore -= 15;
        anomalies.push(`CPU utilization near limit: ${latest.cpu_utilization_percent}%`);
      }
      if (latest.memory_utilization_percent > 90) {
        healthScore -= 15;
        anomalies.push(`Memory utilization near limit: ${latest.memory_utilization_percent}%`);
      }

      // Status penalty
      if (rack.status === 'CRITICAL') {
        healthScore -= 40;
      } else if (rack.status === 'DEGRADED') {
        healthScore -= 20;
      }

      healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

      return {
        rack_id: rack.id,
        name: rack.name,
        health_score: healthScore,
        status: rack.status,
        temperature: latest.temperature_celsius,
        power_draw_kw: latest.power_draw_kw,
        cpu_utilization: latest.cpu_utilization_percent,
        memory_utilization: latest.memory_utilization_percent,
        anomalies
      };
    });

    const summary = `Analyzed health of ${healthMetrics.length} rack(s). Average score: ${Math.round(healthMetrics.reduce((acc, h) => acc + h.health_score, 0) / healthMetrics.length)}%.`;
    this.state.logDecision('analyze_infrastructure_health', input, summary, 'Requested infrastructure health audit.');

    return {
      status: 'success',
      health_metrics: healthMetrics
    };
  }

  @Tool({
    name: 'predict_failure',
    description: 'Predict failure probability and time-to-failure based on telemetry data trends.',
    inputSchema: z.object({
      rack_id: z.string().describe('The rack UUID to run failure prediction on'),
      forecast_hours: z.number().optional().default(24).describe('Number of hours to forecast trend')
    }),
    examples: {
      request: {
        rack_id: 'rack-uuid-123',
        forecast_hours: 12
      }
    }
  })
  async predictFailure(input: { rack_id: string; forecast_hours?: number }, ctx: ExecutionContext) {
    ctx.logger.info('Executing tool: predict_failure', input);
    this.state.tick();

    const rack = this.state.racks.find(r => r.id === input.rack_id);
    if (!rack) {
      throw new Error(`Rack with ID ${input.rack_id} not found.`);
    }

    const forecastHours = input.forecast_hours || 24;
    const logs = this.state.telemetryLogs.filter(l => l.rack_id === rack.id);
    
    // Analyze temperature trend
    let tempTrend = 0; // degrees per log interval
    if (logs.length >= 3) {
      const recent = logs.slice(-3);
      const diff1 = recent[1].temperature_celsius - recent[0].temperature_celsius;
      const diff2 = recent[2].temperature_celsius - recent[1].temperature_celsius;
      tempTrend = (diff1 + diff2) / 2;
    }

    const currentTemp = logs[logs.length - 1]?.temperature_celsius || 22.5;
    const coolingFlow = logs[logs.length - 1]?.cooling_flow_rate_lps || 4.5;
    
    let failureProbability = 0.05; // 5% base risk
    const riskFactors: string[] = [];

    if (tempTrend > 0) {
      riskFactors.push(`Temperature is rising at a rate of ${Math.round(tempTrend * 10) / 10}°C per interval`);
      failureProbability += tempTrend * 3.0; // scale risk based on rate
    }

    if (coolingFlow < 3.0) {
      riskFactors.push(`Cooling flow is degraded (${coolingFlow} L/s)`);
      failureProbability += 0.30;
    }

    if (!this.state.coolingSystemHealthy) {
      riskFactors.push('Primary cooling chiller system is degraded');
      failureProbability += 0.25;
    }

    if (currentTemp > 30.0) {
      riskFactors.push(`High current temperature (${currentTemp}°C)`);
      failureProbability += 0.20;
    }

    failureProbability = Math.max(0.01, Math.min(0.99, failureProbability));

    let timeToFailureHours: number | null = null;
    if (tempTrend > 0 && currentTemp < 40.0) {
      // Assuming 1 log interval represents 10 minutes (0.16 hours) of operation
      const hourlyRiseRate = tempTrend / 0.16;
      if (hourlyRiseRate > 0) {
        timeToFailureHours = Math.round(((40.0 - currentTemp) / hourlyRiseRate) * 10) / 10;
      }
    } else if (currentTemp >= 40.0) {
      timeToFailureHours = 0; // immediate failure risk
    }

    const outputSummary = `Failure prediction for ${rack.name}: ${Math.round(failureProbability * 100)}% probability. MTTF: ${timeToFailureHours !== null ? `${timeToFailureHours} hrs` : 'N/A'}.`;
    this.state.logDecision('predict_failure', input, outputSummary, 'Calculated predictive health indices based on local thermal trends.');

    return {
      status: 'success',
      rack_id: rack.id,
      rack_name: rack.name,
      failure_probability: Math.round(failureProbability * 100) / 100,
      estimated_time_to_failure_hours: timeToFailureHours,
      risk_factors: riskFactors
    };
  }

  @Tool({
    name: 'assess_operational_risk',
    description: 'Assess operational risks to active workloads and SLA commitments.',
    inputSchema: z.object({
      rack_id: z.string().optional().describe('Optional rack UUID to filter risk analysis')
    }),
    examples: {
      request: {}
    }
  })
  async assessOperationalRisk(input: { rack_id?: string }, ctx: ExecutionContext) {
    ctx.logger.info('Executing tool: assess_operational_risk', input);
    this.state.tick();

    const risks = [];
    let totalRiskCost = 0;

    const targetWorkloads = input.rack_id 
      ? this.state.workloads.filter(w => w.rack_id === input.rack_id && w.status === 'RUNNING')
      : this.state.workloads.filter(w => w.status === 'RUNNING');

    for (const workload of targetWorkloads) {
      const rack = this.state.racks.find(r => r.id === workload.rack_id);
      if (!rack) continue;

      const logs = this.state.telemetryLogs.filter(l => l.rack_id === rack.id);
      const temp = logs[logs.length - 1]?.temperature_celsius || 22.5;

      const policy = this.state.slaPolicies.find(p => p.priority === workload.priority) || {
        penalty_per_hour_usd: 100,
        max_allowable_temp: 32.0
      };

      if (temp > workload.sla_threshold_temp) {
        const delta = temp - workload.sla_threshold_temp;
        const breachProbability = Math.min(0.98, delta * 0.20);
        const penaltyCost = policy.penalty_per_hour_usd;
        const calculatedRisk = breachProbability * penaltyCost;

        risks.push({
          workload_id: workload.id,
          workload_name: workload.name,
          current_rack: rack.name,
          temperature: temp,
          threshold: workload.sla_threshold_temp,
          breach_probability: Math.round(breachProbability * 100) / 100,
          potential_penalty_usd: penaltyCost,
          calculated_risk_cost_usd: Math.round(calculatedRisk * 100) / 100
        });

        totalRiskCost += calculatedRisk;
      }
    }

    const summary = `Assessed operational risk for ${targetWorkloads.length} workloads. Total financial exposure: $${Math.round(totalRiskCost)} USD.`;
    this.state.logDecision('assess_operational_risk', input, summary, 'Assessed SLA breach costs due to thermal thresholds.');

    return {
      status: 'success',
      at_risk_workloads: risks,
      total_financial_exposure_usd: Math.round(totalRiskCost * 100) / 100
    };
  }

  @Tool({
    name: 'plan_maintenance',
    description: 'Plan preventative or corrective maintenance work orders, listing required parts.',
    inputSchema: z.object({
      target_rack_id: z.string().describe('The rack UUID requiring maintenance'),
      issue_type: z.enum(['COOLING_LEAK', 'FAN_FAILURE', 'POWER_UNIT_FAULT', 'GPU_OVERHEAT', 'VALVE_BLOCKAGE']).describe('Type of failure/maintenance issue'),
      description: z.string().describe('Detailed symptoms and troubleshooting notes')
    }),
    examples: {
      request: {
        target_rack_id: 'rack-uuid-123',
        issue_type: 'COOLING_LEAK',
        description: 'Slow fluid drip at joint'
      }
    }
  })
  async planMaintenance(input: { target_rack_id: string; issue_type: 'COOLING_LEAK' | 'FAN_FAILURE' | 'POWER_UNIT_FAULT' | 'GPU_OVERHEAT' | 'VALVE_BLOCKAGE'; description: string }, ctx: ExecutionContext) {
    ctx.logger.info('Executing tool: plan_maintenance', input);

    const rack = this.state.racks.find(r => r.id === input.target_rack_id);
    if (!rack) {
      throw new Error(`Rack with ID ${input.target_rack_id} not found.`);
    }

    // Determine parts and skills based on issue type
    let partsRequired: Record<string, number> = {};
    let requiredSkills: string[] = [];
    let estimatedDurationHours = 2.0;

    switch (input.issue_type) {
      case 'COOLING_LEAK':
        partsRequired = { 'coolant_valve_3in': 1 };
        requiredSkills = ['Cooling Loops', 'Piping'];
        estimatedDurationHours = 3.0;
        break;
      case 'FAN_FAILURE':
        partsRequired = { 'chiller_fan_v2': 2 };
        requiredSkills = ['CRAC Repair'];
        estimatedDurationHours = 1.5;
        break;
      case 'POWER_UNIT_FAULT':
        partsRequired = { 'crac_compressor_p4': 1 };
        requiredSkills = ['Power Distribution', 'CRAC Repair'];
        estimatedDurationHours = 4.0;
        break;
      case 'GPU_OVERHEAT':
        partsRequired = { 'gpu_fan_block': 2 };
        requiredSkills = ['GPU Replacement', 'Physical Maintenance'];
        estimatedDurationHours = 2.0;
        break;
      case 'VALVE_BLOCKAGE':
        partsRequired = { 'coolant_valve_3in': 1, 'ambient_sensor_hxt': 1 };
        requiredSkills = ['Cooling Loops', 'CRAC Repair'];
        estimatedDurationHours = 2.5;
        break;
    }

    const ticketId = randomUUID();
    const ticket = {
      id: ticketId,
      target_rack_id: input.target_rack_id,
      issue_type: input.issue_type,
      description: input.description,
      technician_id: null,
      status: 'OPEN' as const,
      parts_required: partsRequired,
      scheduled_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now default
      resolved_at: null,
      estimated_duration_hours: estimatedDurationHours,
      labor_hours: estimatedDurationHours,
      calculated_cost: 0
    };

    this.state.tickets.push(ticket);

    // Create incident event
    const incident = {
      id: randomUUID(),
      rack_id: input.target_rack_id,
      description: `Active maintenance incident: ${input.issue_type} - ${input.description}`,
      severity: 'WARNING' as const,
      resolved: false,
      created_at: new Date().toISOString(),
      resolved_at: null
    };
    this.state.incidents.push(incident);

    const summary = `Created maintenance ticket ${ticketId} for ${rack.name} (${input.issue_type}).`;
    this.state.logDecision('plan_maintenance', input, summary, 'Planned corrective maintenance based on diagnostic logs.');

    return {
      status: 'success',
      ticket,
      required_skills: requiredSkills
    };
  }

  @Tool({
    name: 'schedule_technician',
    description: 'Schedule and assign certified technicians to maintenance tasks.',
    inputSchema: z.object({
      ticket_id: z.string().describe('Maintenance ticket UUID'),
      technician_id: z.string().describe('Technician UUID'),
      scheduled_time: z.string().describe('ISO timestamp of scheduled maintenance')
    })
  })
  async scheduleTechnician(input: { ticket_id: string; technician_id: string; scheduled_time: string }, ctx: ExecutionContext) {
    ctx.logger.info('Executing tool: schedule_technician', input);

    const ticket = this.state.tickets.find(t => t.id === input.ticket_id);
    if (!ticket) {
      throw new Error(`Ticket with ID ${input.ticket_id} not found.`);
    }

    const tech = this.state.technicians.find(t => t.id === input.technician_id);
    if (!tech) {
      throw new Error(`Technician with ID ${input.technician_id} not found.`);
    }

    if (tech.status !== 'AVAILABLE') {
      throw new Error(`Technician ${tech.name} is currently not available (status: ${tech.status}).`);
    }

    // Allocate tech
    tech.status = 'ON_DUTY';
    tech.current_ticket_id = ticket.id;

    // Update ticket
    ticket.technician_id = tech.id;
    ticket.status = 'ASSIGNED';
    ticket.scheduled_time = input.scheduled_time;

    const summary = `Assigned technician ${tech.name} to ticket ${ticket.id} scheduled at ${input.scheduled_time}.`;
    this.state.logDecision('schedule_technician', input, summary, 'Matched technician skills to work order requirements.');

    return {
      status: 'success',
      message: `Technician ${tech.name} has been assigned and scheduled.`,
      ticket,
      technician: {
        id: tech.id,
        name: tech.name,
        status: tech.status
      }
    };
  }

  @Tool({
    name: 'estimate_maintenance_cost',
    description: 'Estimate total cost of maintenance including labor, parts, and downtime.',
    inputSchema: z.object({
      ticket_id: z.string().describe('Maintenance ticket UUID')
    })
  })
  async estimateMaintenanceCost(input: { ticket_id: string }, ctx: ExecutionContext) {
    ctx.logger.info('Executing tool: estimate_maintenance_cost', input);

    const ticket = this.state.tickets.find(t => t.id === input.ticket_id);
    if (!ticket) {
      throw new Error(`Ticket with ID ${input.ticket_id} not found.`);
    }

    const laborRate = 120; // USD per hour
    const laborCost = ticket.estimated_duration_hours * laborRate;

    // Calculate parts cost from local warehouse inventory catalog pricing
    let partsCost = 0;
    for (const [partName, qty] of Object.entries(ticket.parts_required)) {
      const inv = this.state.warehouseInventory[partName];
      const unitCost = inv ? inv.unit_cost : 500; // default to $500 if unknown
      partsCost += unitCost * qty;
    }

    // Calculate potential SLA penalty during maintenance window
    let penaltyCost = 0;
    const workloadsOnRack = this.state.workloads.filter(w => w.rack_id === ticket.target_rack_id && w.status === 'RUNNING');
    for (const workload of workloadsOnRack) {
      const policy = this.state.slaPolicies.find(p => p.priority === workload.priority);
      const penaltyRate = policy ? policy.penalty_per_hour_usd : 100;
      penaltyCost += penaltyRate * ticket.estimated_duration_hours;
    }

    const totalCost = laborCost + partsCost + penaltyCost;
    ticket.calculated_cost = totalCost;

    const summary = `Estimated total cost for ticket ${ticket.id}: $${totalCost} USD.`;
    this.state.logDecision('estimate_maintenance_cost', input, summary, 'Calculated combined labor, materials, and SLA penalties.');

    return {
      status: 'success',
      ticket_id: ticket.id,
      parts_cost_usd: partsCost,
      labor_cost_usd: laborCost,
      downtime_penalty_cost_usd: penaltyCost,
      total_estimated_cost_usd: totalCost
    };
  }

  @Tool({
    name: 'recommend_workload_migration',
    description: 'Recommend optimal target racks for migrating workloads away from degraded/critical racks.',
    inputSchema: z.object({
      source_rack_id: z.string().describe('Source rack UUID containing workloads to migrate')
    })
  })
  async recommendWorkloadMigration(input: { source_rack_id: string }, ctx: ExecutionContext) {
    ctx.logger.info('Executing tool: recommend_workload_migration', input);

    const sourceRack = this.state.racks.find(r => r.id === input.source_rack_id);
    if (!sourceRack) {
      throw new Error(`Source rack with ID ${input.source_rack_id} not found.`);
    }

    const workloadsToMigrate = this.state.workloads.filter(w => w.rack_id === input.source_rack_id && w.status === 'RUNNING');
    const recommendations = [];

    for (const workload of workloadsToMigrate) {
      // Find suitable targets
      const targetOptions = [];

      for (const rack of this.state.racks) {
        if (rack.id === input.source_rack_id) continue;

        // Check telemetry
        const logs = this.state.telemetryLogs.filter(l => l.rack_id === rack.id);
        const latest = logs[logs.length - 1];
        const temp = latest ? latest.temperature_celsius : 22.5;

        if (rack.status !== 'OPTIMAL' || temp > 28.0) continue;

        // Check remaining vCPUs & Memory capacity
        const activeWorkloads = this.state.workloads.filter(w => w.rack_id === rack.id && w.status === 'RUNNING');
        const cpuUsed = activeWorkloads.reduce((acc, w) => acc + w.vcpus, 0);
        const memUsed = activeWorkloads.reduce((acc, w) => acc + w.memory_gb, 0);

        const cpuFree = rack.cpu_capacity_cores - cpuUsed;
        const memFree = rack.memory_capacity_gb - memUsed;

        if (cpuFree >= workload.vcpus && memFree >= workload.memory_gb) {
          // Score suitability: lower temperature is better, more remaining capacity is better
          let score = 100 - (temp - 18.0) * 4; // base 18C cooling floor
          score += (cpuFree / rack.cpu_capacity_cores) * 20;

          targetOptions.push({
            rack_id: rack.id,
            rack_name: rack.name,
            score: Math.round(score),
            temperature: temp,
            remaining_cores: cpuFree,
            remaining_memory_gb: memFree
          });
        }
      }

      // Sort by score descending
      targetOptions.sort((a, b) => b.score - a.score);

      recommendations.push({
        workload_id: workload.id,
        workload_name: workload.name,
        vcpus: workload.vcpus,
        memory_gb: workload.memory_gb,
        priority: workload.priority,
        recommended_target: targetOptions[0] || null,
        alternative_targets: targetOptions.slice(1, 3)
      });
    }

    const summary = `Generated migration recommendations for ${workloadsToMigrate.length} workloads.`;
    this.state.logDecision('recommend_workload_migration', input, summary, 'Evaluated target rack capacities and thermal safety limits.');

    return {
      status: 'success',
      recommendations
    };
  }

  @Tool({
    name: 'estimate_capacity',
    description: 'Estimate thermal and electrical capacity of rows/columns/racks for scheduling new workloads.',
    inputSchema: z.object({
      target_rack_id: z.string().optional().describe('Optional target rack UUID'),
      vcpus_required: z.number().describe('vCPUs required for new workload'),
      memory_gb_required: z.number().describe('Memory in GB required for new workload'),
      power_kw_required: z.number().describe('Power draw in kW required for new workload')
    })
  })
  async estimateCapacity(input: { target_rack_id?: string; vcpus_required: number; memory_gb_required: number; power_kw_required: number }, ctx: ExecutionContext) {
    ctx.logger.info('Executing tool: estimate_capacity', input);
    this.state.tick();

    const results = [];
    const checkRacks = input.target_rack_id 
      ? this.state.racks.filter(r => r.id === input.target_rack_id)
      : this.state.racks;

    for (const rack of checkRacks) {
      const logs = this.state.telemetryLogs.filter(l => l.rack_id === rack.id);
      const latest = logs[logs.length - 1];
      const currentPower = latest ? latest.power_draw_kw : 2.0;

      const activeWorkloads = this.state.workloads.filter(w => w.rack_id === rack.id && w.status === 'RUNNING');
      const cpuUsed = activeWorkloads.reduce((acc, w) => acc + w.vcpus, 0);
      const memUsed = activeWorkloads.reduce((acc, w) => acc + w.memory_gb, 0);

      const cpuFree = rack.cpu_capacity_cores - cpuUsed;
      const memFree = rack.memory_capacity_gb - memUsed;
      const powerFree = rack.max_kw_capacity - currentPower;

      const feasible = cpuFree >= input.vcpus_required && 
                       memFree >= input.memory_gb_required && 
                       powerFree >= input.power_kw_required && 
                       rack.status === 'OPTIMAL';

      results.push({
        rack_id: rack.id,
        rack_name: rack.name,
        feasible,
        remaining_cores: cpuFree,
        remaining_memory_gb: memFree,
        remaining_power_kw: Math.round(powerFree * 10) / 10,
        status: rack.status
      });
    }

    const feasibleCount = results.filter(r => r.feasible).length;
    const summary = `Checked capacity for new workload. Found ${feasibleCount} feasible racks out of ${results.length}.`;
    this.state.logDecision('estimate_capacity', input, summary, 'Estimated available spatial, electrical, and cooling headroom.');

    return {
      status: 'success',
      capacity_check: results
    };
  }

  @Tool({
    name: 'check_inventory',
    description: 'Check stock levels of critical replacement parts.',
    inputSchema: z.object({
      part_names: z.array(z.string()).optional().describe('Optional list of part names to check stock for')
    })
  })
  async checkInventory(input: { part_names?: string[] }, ctx: ExecutionContext) {
    ctx.logger.info('Executing tool: check_inventory', input);

    let parts = Object.values(this.state.warehouseInventory);
    if (input.part_names && input.part_names.length > 0) {
      parts = parts.filter(p => input.part_names!.includes(p.part_name));
    }

    const results = parts.map(p => ({
      part_name: p.part_name,
      in_stock: p.stock,
      reorder_threshold: p.reorder_threshold,
      unit_cost_usd: p.unit_cost,
      status: p.stock === 0 ? 'OUT_OF_STOCK' : p.stock <= p.reorder_threshold ? 'REORDER_WARNING' : 'OK'
    }));

    const summary = `Checked inventory for ${results.length} part types.`;
    this.state.logDecision('check_inventory', input, summary, 'Queried warehouse ERP catalog for replacement availability.');

    return {
      status: 'success',
      inventory: results
    };
  }

  @Tool({
    name: 'evaluate_suppliers',
    description: 'Evaluate suppliers by inventory, rating, cost, and lead times.',
    inputSchema: z.object({
      part_name: z.string().describe('The name of the component required'),
      quantity: z.number().describe('Quantity of the component required')
    })
  })
  async evaluateSuppliers(input: { part_name: string; quantity: number }, ctx: ExecutionContext) {
    ctx.logger.info('Executing tool: evaluate_suppliers', input);

    const results = [];
    for (const supplier of this.state.suppliers) {
      const part = supplier.inventory[input.part_name];
      if (part) {
        const totalCost = part.price * input.quantity;
        const available = part.stock >= input.quantity;

        // Scoring algorithm: higher rating is better, lower cost is better, faster lead time is better
        let score = (supplier.rating * 15);
        if (available) {
          score += 30; // priority points for availability
        }
        score -= (totalCost / 200); // penalty for high price
        score -= (part.lead_time_hours * 1.5); // penalty for delay

        results.push({
          supplier_id: supplier.id,
          supplier_name: supplier.name,
          rating: supplier.rating,
          part_name: input.part_name,
          unit_price_usd: part.price,
          total_price_usd: totalCost,
          stock_available: part.stock,
          lead_time_hours: part.lead_time_hours,
          selection_score: Math.max(0, Math.round(score))
        });
      }
    }

    // Sort by selection score descending
    results.sort((a, b) => b.selection_score - a.selection_score);

    const summary = `Evaluated ${results.length} suppliers for ${input.quantity}x ${input.part_name}. Best: ${results[0]?.supplier_name || 'None'}.`;
    this.state.logDecision('evaluate_suppliers', input, summary, 'Ranked suppliers based on supply chain logistics and rating index.');

    return {
      status: 'success',
      supplier_evaluations: results
    };
  }

  @Tool({
    name: 'generate_procurement_plan',
    description: 'Generate an emergency procurement order when parts are out of stock.',
    inputSchema: z.object({
      ticket_id: z.string().describe('Associated maintenance ticket UUID'),
      supplier_id: z.string().describe('Supplier UUID'),
      parts: z.record(z.number()).describe('JSON Map of parts needed and quantities (e.g. {"chiller_fan_v2": 1})')
    })
  })
  async generateProcurementPlan(input: { ticket_id: string; supplier_id: string; parts: Record<string, number> }, ctx: ExecutionContext) {
    ctx.logger.info('Executing tool: generate_procurement_plan', input);

    const supplier = this.state.suppliers.find(s => s.id === input.supplier_id);
    if (!supplier) {
      throw new Error(`Supplier with ID ${input.supplier_id} not found.`);
    }

    const ticket = this.state.tickets.find(t => t.id === input.ticket_id);
    if (!ticket) {
      throw new Error(`Ticket with ID ${input.ticket_id} not found.`);
    }

    const orderId = randomUUID();
    const orderedItems = [];
    let grandTotal = 0;
    let maxLeadTimeHours = 0;

    for (const [partName, qty] of Object.entries(input.parts)) {
      const part = supplier.inventory[partName];
      if (!part) {
        throw new Error(`Supplier ${supplier.name} does not catalog component: ${partName}`);
      }

      if (part.stock < qty) {
        throw new Error(`Insufficient stock for ${partName} at supplier ${supplier.name}. Available: ${part.stock}, Requested: ${qty}`);
      }

      // Deduct stock from supplier
      part.stock -= qty;

      const itemCost = part.price * qty;
      grandTotal += itemCost;
      maxLeadTimeHours = Math.max(maxLeadTimeHours, part.lead_time_hours);

      orderedItems.push({
        part_name: partName,
        quantity: qty,
        unit_price_usd: part.price,
        total_price_usd: itemCost
      });

      // Update local inventory (simulate parts arrival later, but for now log incoming)
      const localItem = this.state.warehouseInventory[partName];
      if (localItem) {
        localItem.stock += qty; // automatically replenish local stock upon delivery order
      }
    }

    const deliveryTime = new Date(Date.now() + maxLeadTimeHours * 3600000).toISOString();

    const order = {
      id: orderId,
      ticket_id: input.ticket_id,
      supplier_id: input.supplier_id,
      supplier_name: supplier.name,
      items: orderedItems,
      total_cost: grandTotal,
      status: 'ORDERED' as const,
      estimated_delivery: deliveryTime
    };

    this.state.orders.push(order);

    // If ticket was OPEN, move to ASSIGNED (or pending parts)
    if (ticket.status === 'OPEN') {
      ticket.status = 'ASSIGNED';
    }

    const summary = `Generated procurement order ${orderId} from ${supplier.name} for ticket ${ticket.id}. Total: $${grandTotal} USD.`;
    this.state.logDecision('generate_procurement_plan', input, summary, 'Generated emergency procurement release for HVAC parts.');

    return {
      status: 'success',
      procurement_order: order
    };
  }

  @Tool({
    name: 'notify_stakeholders',
    description: 'Send incident notifications to relevant stakeholders.',
    inputSchema: z.object({
      incident_id: z.string().describe('Incident UUID'),
      severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).describe('Incident severity level'),
      channel: z.enum(['EMAIL', 'SLACK', 'PAGERDUTY']).describe('Notification channel to use'),
      message: z.string().describe('Notification alert message body')
    })
  })
  async notifyStakeholders(input: { incident_id: string; severity: 'INFO' | 'WARNING' | 'CRITICAL'; channel: 'EMAIL' | 'SLACK' | 'PAGERDUTY'; message: string }, ctx: ExecutionContext) {
    ctx.logger.info('Executing tool: notify_stakeholders', input);

    const notificationId = randomUUID();
    const deliveryTimestamp = new Date().toISOString();

    const logEntry = {
      id: notificationId,
      timestamp: deliveryTimestamp,
      incident_id: input.incident_id,
      severity: input.severity,
      channel: input.channel,
      message: input.message,
      status: 'SENT' as const
    };

    this.state.notifications.push(logEntry);

    const summary = `Dispatched incident notification ${notificationId} via ${input.channel} (${input.severity}).`;
    this.state.logDecision('notify_stakeholders', input, summary, 'Dispatched incident status alerts to Operations and Facilities channels.');

    return {
      status: 'success',
      notification_id: notificationId,
      channel: input.channel,
      delivery_timestamp: deliveryTimestamp
    };
  }
}
