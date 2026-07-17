import { PromptDecorator as Prompt, ExecutionContext } from '@nitrostack/core';

export class DatacenterPrompts {

  @Prompt({
    name: 'emergency_cooling_response',
    description: 'Formulate an emergency response plan to stabilize server temperature during cooling system failure.',
    arguments: [
      { name: 'cooling_efficiency', description: 'Current chiller cooling efficiency (0.0 to 1.0)', required: true },
      { name: 'ambient_temp', description: 'Ambient temperature inside data center', required: true },
      { name: 'impacted_racks', description: 'Comma separated list of impacted rack IDs', required: true }
    ]
  })
  async emergencyCoolingResponse(args: { cooling_efficiency: string; ambient_temp: string; impacted_racks: string }, ctx: ExecutionContext) {
    return [
      {
        role: 'user' as const,
        content: `### WORKFLOW: EMERGENCY COOLING RESPONSE
**Trigger**: Total cooling capacity loss or chiller loop pressure drop.
**Variables**:
- Cooling Efficiency: ${args.cooling_efficiency}
- Ambient Temp: ${args.ambient_temp}°C
- Impacted Racks: ${args.impacted_racks}

**Description**: Formulate an immediate containment plan to prevent hardware damage and mitigate SLA breach penalties.
**Expected Output**: An actionable list of workload migrations, power caps, and HVAC configuration commands.
**Example Usage**: Migrate high-priority workloads to backup zone racks (Row C) and plan corrective fan maintenance.

**Procedures**:
1. Check the \`Telemetry Feed\` and filter for racks: ${args.impacted_racks}.
2. Run \`recommend_workload_migration\` for these racks.
3. Outline which workloads must be migrated immediately based on SLA thresholds.
4. Prepare PagerDuty notification parameters to alert facility managers.`
      }
    ];
  }

  @Prompt({
    name: 'thermal_hotspot_investigation',
    description: 'Analyze localized thermal hotspots and draft troubleshooting tasks.',
    arguments: [
      { name: 'rack_id', description: 'The rack UUID experiencing the hotspot', required: true },
      { name: 'temperature_celsius', description: 'Current temperature of the rack', required: true },
      { name: 'cooling_flow_rate', description: 'Current cooling flow rate at the rack', required: true }
    ]
  })
  async thermalHotspotInvestigation(args: { rack_id: string; temperature_celsius: string; cooling_flow_rate: string }, ctx: ExecutionContext) {
    return [
      {
        role: 'user' as const,
        content: `### WORKFLOW: THERMAL HOTSPOT INVESTIGATION
**Trigger**: Localized server rack temperature exceeding 35.0°C.
**Variables**:
- Target Rack ID: ${args.rack_id}
- Temperature: ${args.temperature_celsius}°C
- Cooling Flow: ${args.cooling_flow_rate} L/s

**Description**: Investigate isolated thermal anomalies on a specific rack to diagnose airflow blockage, fan failure, or CPU thrashing.
**Expected Output**: Diagnosis report with suspected root cause and recommended hardware repair parts.
**Example Usage**: Check warehouse inventory for chiller fans and schedule a technician for repair.

**Procedures**:
1. Run \`predict_failure\` for rack ${args.rack_id} to assess thermal runaway timeframe.
2. Run \`assess_operational_risk\` to determine which workloads on this rack are violating SLA thresholds.
3. Recommend physical inspection checklist (check fan status, air filter, and cooling valves).`
      }
    ];
  }

  @Prompt({
    name: 'power_instability_assessment',
    description: 'Evaluate power feed stability and balance workload phases.',
    arguments: [
      { name: 'power_draw_kw', description: 'Current power load of the data center', required: true },
      { name: 'max_capacity_kw', description: 'Maximum power capacity limit', required: true },
      { name: 'grid_stability_index', description: 'Utility grid frequency stability score (0.0 to 1.0)', required: true }
    ]
  })
  async powerInstabilityAssessment(args: { power_draw_kw: string; max_capacity_kw: string; grid_stability_index: string }, ctx: ExecutionContext) {
    return [
      {
        role: 'user' as const,
        content: `### WORKFLOW: POWER INSTABILITY ASSESSMENT
**Trigger**: Power fluctuation warning, utility grid frequency drop, or PDU overload.
**Variables**:
- Current Power Draw: ${args.power_draw_kw} kW
- Max Capacity: ${args.max_capacity_kw} kW
- Grid Stability Index: ${args.grid_stability_index}

**Description**: Perform dynamic electrical headroom analysis and balance workload phases across power feeds.
**Expected Output**: Load balancing plan detailing power caps, battery backup status, and scheduled batch workload suspensions.
**Example Usage**: Use \`estimate_capacity\` to find alternative racks that can absorb workload migrations without overloading their power phase.

**Procedures**:
1. Calculate the current power safety headroom: (${args.max_capacity_kw} - ${args.power_draw_kw}) kW.
2. Determine if the grid stability index (${args.grid_stability_index}) warrants starting backup generator feeds.
3. List the low-priority batch workloads that can be paused to reduce power draw.`
      }
    ];
  }

  @Prompt({
    name: 'maintenance_planning',
    description: 'Draft corrective or preventative maintenance orders.',
    arguments: [
      { name: 'ticket_id', description: 'Maintenance ticket UUID', required: true },
      { name: 'issue_description', description: 'Description of the physical fault', required: true },
      { name: 'affected_assets', description: 'List of assets affected by the issue', required: true }
    ]
  })
  async maintenancePlanning(args: { ticket_id: string; issue_description: string; affected_assets: string }, ctx: ExecutionContext) {
    return [
      {
        role: 'user' as const,
        content: `### WORKFLOW: MAINTENANCE PLANNING
**Trigger**: Diagnostic tools detect hardware degradations requiring physical technician dispatch.
**Variables**:
- Ticket ID: ${args.ticket_id}
- Issue Description: ${args.issue_description}
- Affected Assets: ${args.affected_assets}

**Description**: Create a complete maintenance work order containing parts list, skill requirements, and labor estimates.
**Expected Output**: A comprehensive maintenance plan detailing parts required, required certifications, labor hours, and total cost estimate.
**Example Usage**: Call \`estimate_maintenance_cost\` for the ticket to approve budget allocations.

**Procedures**:
1. Query \`check_inventory\` for parts needed to resolve "${args.issue_description}".
2. Inspect if parts are out of stock; if so, trigger a supplier evaluation.
3. Formulate the estimated technician skills needed (e.g. CRAC Repair vs Electrical PDU certification).`
      }
    ];
  }

  @Prompt({
    name: 'workload_migration_strategy',
    description: 'Determine optimal destination racks for virtual workloads.',
    arguments: [
      { name: 'workload_ids', description: 'Comma separated list of workload UUIDs to relocate', required: true },
      { name: 'source_rack_id', description: 'The rack UUID where workloads currently run', required: true }
    ]
  })
  async workloadMigrationStrategy(args: { workload_ids: string; source_rack_id: string }, ctx: ExecutionContext) {
    return [
      {
        role: 'user' as const,
        content: `### WORKFLOW: WORKLOAD MIGRATION STRATEGY
**Trigger**: Impending rack maintenance or thermal warning requires clearing workloads.
**Variables**:
- Workload IDs: ${args.workload_ids}
- Source Rack ID: ${args.source_rack_id}

**Description**: Formulate a migration map for relocation of virtual workloads to ensure target racks do not breach capacity.
**Expected Output**: Relocation mapping list pairing each workload to a target rack along with capacity check validations.
**Example Usage**: Call \`recommend_workload_migration\` to find optimal target hosts and execute migration.

**Procedures**:
1. Run \`recommend_workload_migration\` on source rack ${args.source_rack_id}.
2. Verify that target racks have sufficient CPU, Memory, and Power by calling \`estimate_capacity\` with workload resource demands.
3. Outline migration order (highest priority workloads first).`
      }
    ];
  }

  @Prompt({
    name: 'supplier_selection',
    description: 'Select the best supplier matching parts and speed requirements.',
    arguments: [
      { name: 'part_name', description: 'Replacement part SKU or name required', required: true },
      { name: 'required_quantity', description: 'Number of units required', required: true }
    ]
  })
  async supplierSelection(args: { part_name: string; required_quantity: string }, ctx: ExecutionContext) {
    return [
      {
        role: 'user' as const,
        content: `### WORKFLOW: SUPPLIER SELECTION
**Trigger**: Crucial HVAC or electrical components are out of stock in the local warehouse.
**Variables**:
- Part Name: ${args.part_name}
- Required Quantity: ${args.required_quantity}

**Description**: Query registered supplier directories to select the best supplier matching speed, cost, and logistics metrics.
**Expected Output**: Supplier selection matrix sorting suppliers by price, lead time, rating, and overall suitability score.
**Example Usage**: Call \`evaluate_suppliers\` to get scoring logs.

**Procedures**:
1. Run \`evaluate_suppliers\` for ${args.required_quantity}x ${args.part_name}.
2. Choose the best supplier option (balancing delivery hours vs. total cost).
3. Draft a procurement plan with the selected supplier.`
      }
    ];
  }

  @Prompt({
    name: 'procurement_recommendation',
    description: 'Validate and format emergency procurement requests.',
    arguments: [
      { name: 'ticket_id', description: 'Maintenance ticket UUID', required: true },
      { name: 'selected_supplier_name', description: 'Name of the chosen supplier', required: true },
      { name: 'total_cost_usd', description: 'Total cost of procurement in USD', required: true }
    ]
  })
  async procurementRecommendation(args: { ticket_id: string; selected_supplier_name: string; total_cost_usd: string }, ctx: ExecutionContext) {
    return [
      {
        role: 'user' as const,
        content: `### WORKFLOW: PROCUREMENT RECOMMENDATION
**Trigger**: Supply chain parts ordering is required for a corrective maintenance order.
**Variables**:
- Ticket ID: ${args.ticket_id}
- Selected Supplier: ${args.selected_supplier_name}
- Total Cost: $${args.total_cost_usd} USD

**Description**: Format and submit an emergency purchase request to operations management for approval.
**Expected Output**: Formal procurement plan listing parts details, supplier credentials, estimated delivery, and budget impact.
**Example Usage**: Call \`generate_procurement_plan\` to execute order after validation.

**Procedures**:
1. Confirm the procurement details match supplier specifications.
2. Outline the operational downtime risks if the order is delayed.
3. Submit order and update the maintenance ticket status.`
      }
    ];
  }

  @Prompt({
    name: 'technician_dispatch',
    description: 'Prepare technician dispatch briefing and checklist.',
    arguments: [
      { name: 'technician_name', description: 'Assigned technician name', required: true },
      { name: 'ticket_id', description: 'Maintenance ticket UUID', required: true },
      { name: 'parts_list', description: 'Comma separated list of parts to be checked out', required: true }
    ]
  })
  async technicianDispatch(args: { technician_name: string; ticket_id: string; parts_list: string }, ctx: ExecutionContext) {
    return [
      {
        role: 'user' as const,
        content: `### WORKFLOW: TECHNICIAN DISPATCH
**Trigger**: A technician has been allocated and scheduled to resolve a server/chiller issue.
**Variables**:
- Technician: ${args.technician_name}
- Ticket ID: ${args.ticket_id}
- Parts Checkout: ${args.parts_list}

**Description**: Draft a briefing checklist for the field technician outlining safety rules, diagnostic symptoms, and required parts.
**Expected Output**: Technician dispatch briefing sheet containing safety procedures, target rack grid location, and parts checklist.
**Example Usage**: Call \`schedule_technician\` to formalize assignment.

**Procedures**:
1. Read the standard operating procedure for the specific issue.
2. Confirm the technician has checked out: ${args.parts_list} from the warehouse.
3. List safety rules (e.g. pressure line lockout, high voltage warnings).`
      }
    ];
  }

  @Prompt({
    name: 'incident_recovery',
    description: 'Confirm system recovery and workload re-balancing.',
    arguments: [
      { name: 'ticket_id', description: 'Maintenance ticket UUID', required: true },
      { name: 'stabilization_duration_minutes', description: 'Number of minutes to monitor telemetry post-repair', required: true }
    ]
  })
  async incidentRecovery(args: { ticket_id: string; stabilization_duration_minutes: string }, ctx: ExecutionContext) {
    return [
      {
        role: 'user' as const,
        content: `### WORKFLOW: INCIDENT RECOVERY
**Trigger**: Physical repair is complete and cooling systems are powered back up.
**Variables**:
- Resolved Ticket ID: ${args.ticket_id}
- Monitoring Window: ${args.stabilization_duration_minutes} minutes

**Description**: Validate that temperatures and flow rates have stabilized at nominal levels, then re-balance workloads.
**Expected Output**: Verification report detailing post-repair temperature stabilization and workload fail-back schedule.
**Example Usage**: Call \`analyze_infrastructure_health\` to confirm all racks are back to 'OPTIMAL'.

**Procedures**:
1. Check \`Telemetry Feed\` to verify temperatures are below 25.0°C and flow rate is stable.
2. Check if migrated workloads should be failed back to their original home racks.
3. Mark the incident and ticket as resolved in the logs.`
      }
    ];
  }

  @Prompt({
    name: 'executive_incident_summary',
    description: 'Draft executive incident summaries detailing root cause, downtime, and SLA penalties.',
    arguments: [
      { name: 'incident_id', description: 'Incident UUID', required: true },
      { name: 'downtime_minutes', description: 'Total system downtime or degradation duration in minutes', required: true },
      { name: 'financial_impact_usd', description: 'Calculated SLA breach penalty cost in USD', required: true }
    ]
  })
  async executiveIncidentSummary(args: { incident_id: string; downtime_minutes: string; financial_impact_usd: string }, ctx: ExecutionContext) {
    return [
      {
        role: 'user' as const,
        content: `### WORKFLOW: EXECUTIVE INCIDENT SUMMARY
**Trigger**: Incident has been resolved and closed; reporting to leadership is required.
**Variables**:
- Incident ID: ${args.incident_id}
- Downtime Duration: ${args.downtime_minutes} minutes
- Financial Exposure: $${args.financial_impact_usd} USD

**Description**: Draft a clean, professional executive summary outlining root cause analysis, response timelines, and mitigation steps.
**Expected Output**: Executive briefing document containing incident timeline, root cause, cost breakdown, and long-term infrastructure improvements.
**Example Usage**: Present audit trails from \`datacenter://decisions/log\` to demonstrate autonomous mitigation actions.

**Procedures**:
1. Review the \`Incident History\` for incident ${args.incident_id}.
2. Query the \`Decision Log\` to extract timeline details of all tool executions.
3. Summarize key lessons learned and steps taken to prevent recurrence (e.g. warehouse stocking updates).`
      }
    ];
  }
}
