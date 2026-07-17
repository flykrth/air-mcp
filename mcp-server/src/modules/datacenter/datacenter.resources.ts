import { ResourceDecorator as Resource, ExecutionContext } from '@nitrostack/core';
import { DatacenterState } from './datacenter.state.js';

export class DatacenterResources {
  private state = DatacenterState.getInstance();

  @Resource({
    uri: 'datacenter://telemetry/feed',
    name: 'Telemetry Feed',
    description: 'Real-time telemetry feed of all rack sensor data including temperature, power draw, and cooling flow.',
    mimeType: 'application/json'
  })
  async getTelemetryFeed(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Fetching resource: Telemetry Feed');
    await this.state.sync();
    
    const telemetryData = this.state.racks.map(rack => {
      const logs = this.state.telemetryLogs.filter(l => l.rack_id === rack.id);
      return {
        rack_id: rack.id,
        rack_name: rack.name,
        latest_telemetry: logs[logs.length - 1]
      };
    });

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(telemetryData, null, 2)
      }]
    };
  }

  @Resource({
    uri: 'datacenter://assets/registry',
    name: 'Asset Registry',
    description: 'Comprehensive registry of physical assets in the data center, including racks, cooling loops, and chillers.',
    mimeType: 'application/json'
  })
  async getAssetRegistry(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Fetching resource: Asset Registry');
    await this.state.sync();
    const assetData = {
      facility_name: 'Amrita Digital Twin DC-1',
      location: 'Bangalore, IN',
      racks: this.state.racks.map(r => ({
        id: r.id,
        name: r.name,
        position: { row: r.row_id, column: r.column_id },
        max_kw: r.max_kw_capacity,
        cpu_capacity: r.cpu_capacity_cores,
        memory_capacity: r.memory_capacity_gb,
        status: r.status
      })),
      cooling_chillers: [
        { id: 'chiller-001', name: 'Primary CRAC Unit A', status: this.state.coolingSystemHealthy ? 'OPTIMAL' : 'DEGRADED', efficiency: this.state.coolingSystemEfficiency }
      ]
    };

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(assetData, null, 2)
      }]
    };
  }

  @Resource({
    uri: 'datacenter://infrastructure/topology',
    name: 'Infrastructure Topology',
    description: '3D coordinates and topological connectivity mapping row/column alignment and HVAC distribution flow.',
    mimeType: 'application/json'
  })
  async getInfrastructureTopology(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Fetching resource: Infrastructure Topology');
    await this.state.sync();
    const topology = {
      dimensions: { rows: 3, columns: 2, height_u: 42 },
      nodes: this.state.racks.map(r => ({
        id: r.id,
        label: r.name,
        type: 'RACK',
        coordinates: { x: r.column_id * 2.5, y: r.row_id * 3.0, z: 0 }
      })),
      cooling_connections: [
        { source: 'chiller-001', target: 'Row-0 (Rack-A1, Rack-A2)', status: this.state.coolingSystemHealthy ? 'ACTIVE' : 'REDUCED_FLOW' },
        { source: 'chiller-001', target: 'Row-1 (Rack-B1, Rack-B2)', status: this.state.coolingSystemHealthy ? 'ACTIVE' : 'REDUCED_FLOW' },
        { source: 'chiller-001', target: 'Row-2 (Rack-C1, Rack-C2)', status: 'ACTIVE' } // backup loop always active
      ]
    };

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(topology, null, 2)
      }]
    };
  }

  @Resource({
    uri: 'maintenance://tickets/history',
    name: 'Maintenance History',
    description: 'Archived log of completed and resolved maintenance tickets and repair reports.',
    mimeType: 'application/json'
  })
  async getMaintenanceHistory(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Fetching resource: Maintenance History');
    await this.state.sync();
    const history = this.state.tickets.filter(t => t.status === 'RESOLVED');
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(history, null, 2)
      }]
    };
  }

  @Resource({
    uri: 'incidents://history',
    name: 'Incident History',
    description: 'Historic database of cooling degradations, thermal alerts, and grid instabilities.',
    mimeType: 'application/json'
  })
  async getIncidentHistory(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Fetching resource: Incident History');
    await this.state.sync();
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(this.state.incidents, null, 2)
      }]
    };
  }

  @Resource({
    uri: 'supplychain://inventory/catalog',
    name: 'Inventory Catalog',
    description: 'Warehouse catalog detailing stock quantities, reorder thresholds, and unit costs of replacement parts.',
    mimeType: 'application/json'
  })
  async getInventoryCatalog(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Fetching resource: Inventory Catalog');
    await this.state.sync();
    const catalog = Object.values(this.state.warehouseInventory);
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(catalog, null, 2)
      }]
    };
  }

  @Resource({
    uri: 'supplychain://suppliers/directory',
    name: 'Supplier Directory',
    description: 'Directory of qualified cooling system manufacturers and suppliers with part catalog prices and delivery times.',
    mimeType: 'application/json'
  })
  async getSupplierDirectory(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Fetching resource: Supplier Directory');
    await this.state.sync();
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(this.state.suppliers, null, 2)
      }]
    };
  }

  @Resource({
    uri: 'maintenance://technicians/registry',
    name: 'Technician Registry',
    description: 'Roster of HVAC and power grid certified technicians, including current availability and certifications.',
    mimeType: 'application/json'
  })
  async getTechnicianRegistry(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Fetching resource: Technician Registry');
    await this.state.sync();
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(this.state.technicians, null, 2)
      }]
    };
  }

  @Resource({
    uri: 'workloads://registry',
    name: 'Workload Registry',
    description: 'Cloud workload scheduling directory tracking container CPU, RAM, and priority parameters on active racks.',
    mimeType: 'application/json'
  })
  async getWorkloadRegistry(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Fetching resource: Workload Registry');
    await this.state.sync();
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(this.state.workloads, null, 2)
      }]
    };
  }

  @Resource({
    uri: 'slas://policies',
    name: 'SLA Policies',
    description: 'Service Level Agreement (SLA) contract guidelines mapping workload priorities to financial penalty limits.',
    mimeType: 'application/json'
  })
  async getSlaPolicies(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Fetching resource: SLA Policies');
    await this.state.sync();
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(this.state.slaPolicies, null, 2)
      }]
    };
  }

  @Resource({
    uri: 'datacenter://decisions/log',
    name: 'Decision Log',
    description: 'Audit trail log mapping all autonomous actions, diagnostic evaluations, and tool calls.',
    mimeType: 'application/json'
  })
  async getDecisionLog(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Fetching resource: Decision Log');
    await this.state.sync();
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(this.state.decisionLogs, null, 2)
      }]
    };
  }

  @Resource({
    uri: 'datacenter://procedures/sops',
    name: 'Standard Operating Procedures',
    description: 'Standard Operating Procedures (SOPs) for emergency cooling failure, hotspots, and power grid failures.',
    mimeType: 'text/markdown'
  })
  async getSops(uri: string, ctx: ExecutionContext) {
    ctx.logger.info('Fetching resource: Standard Operating Procedures');
    await this.state.sync();
    const sopsMarkdown = this.state.sops.map(sop => {
      return `## ${sop.title}\n\n${sop.content}\n\n---\n`;
    }).join('\n');

    return {
      contents: [{
        uri,
        mimeType: 'text/markdown',
        text: sopsMarkdown
      }]
    };
  }
}
