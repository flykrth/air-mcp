import random
import uuid
import threading
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any, Callable
from app.features.simulator.models import (
    SimState, SimRack, SimWorkload, SimTechnician, 
    SimInventoryItem, SimSupplier, SimProcurementOrder, 
    SimMaintenanceTicket, SimIncident
)

class SimulatorEngine:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(SimulatorEngine, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.state = SimState()
        self.callbacks: List[Callable[[SimState], None]] = []
        self._loop_task: Optional[asyncio.Task] = None
        self._initialized = True
        self.reset()

    def register_callback(self, callback: Callable[[SimState], None]):
        """Register a hook to run after each simulation tick (e.g. database syncer)."""
        self.callbacks.append(callback)

    def trigger_callbacks(self):
        for cb in self.callbacks:
            try:
                cb(self.state)
            except Exception as e:
                print(f"[SIMULATOR] Error in tick callback: {e}")

    def reset(self):
        with self._lock:
            self.state = SimState()
            self.state.ambient_temp = 24.0
            self.state.ambient_humidity_percent = 45.0
            self.state.cooling_system_healthy = True
            self.state.cooling_system_efficiency = 1.0
            self.state.heatwave_active = False
            self.state.power_grid_frequency_hz = 50.0
            self.state.power_grid_voltage_v = 230.0
            self.state.ups_charge_percent = 100.0
            self.state.mode = "PAUSED"
            self.state.speed_factor = 1.0
            self.state.tick_count = 0
            self.state.last_tick_time = datetime.now()

            # Initialize 6 Racks (3x2 Grid) using the exact same names and UUIDs as database.py
            rack_names = ['Rack-A1', 'Rack-A2', 'Rack-B1', 'Rack-B2', 'Rack-C1', 'Rack-C2']
            rack_uuids = [
                "f7dfd754-b54a-47e5-b3f9-e5a662c8f84b",
                "0920f20a-7f86-4b80-9877-c0e717f4af70",
                "f23cf467-de30-4c47-8950-44bf5b321afd",
                "a9521a0e-6a88-4848-ad49-e64be022589f",
                "565755f8-8942-492e-9eb7-38c9b43bad1d",
                "5e71eb3f-eb20-476a-ac58-bd215e051e6b"
            ]
            
            self.state.racks = []
            for i in range(6):
                row = i // 2
                col = i % 2
                self.state.racks.append(SimRack(
                    id=uuid.UUID(rack_uuids[i]),
                    name=rack_names[i],
                    row_id=row,
                    column_id=col,
                    max_kw_capacity=15.0,
                    cpu_capacity_cores=64,
                    memory_capacity_gb=256,
                    status="OPTIMAL",
                    temperature_celsius=22.5,
                    cooling_flow_rate_lps=4.5,
                    fan_speed_rpm=3000.0,
                    power_draw_kw=2.0,
                    cpu_utilization_percent=0,
                    memory_utilization_percent=0,
                    fan_healthy=True,
                    sensor_healthy=True
                ))

            # Initialize workloads matching seed data
            now = datetime.now()
            self.state.workloads = []
            for i, rack in enumerate(self.state.racks):
                # Workload 1: Higher Priority
                self.state.workloads.append(SimWorkload(
                    id=uuid.uuid4(),
                    rack_id=rack.id,
                    name=f"{rack.name}-Job-1",
                    vcpus=8,
                    memory_gb=32,
                    power_kw=1.5,
                    priority=4 if i % 2 == 0 else 2,
                    sla_threshold_temp=35.0,
                    status="RUNNING",
                    created_at=now
                ))
                # Workload 2: Lower Priority
                self.state.workloads.append(SimWorkload(
                    id=uuid.uuid4(),
                    rack_id=rack.id,
                    name=f"{rack.name}-Job-2",
                    vcpus=4,
                    memory_gb=16,
                    power_kw=0.8,
                    priority=1,
                    sla_threshold_temp=32.0,
                    status="RUNNING",
                    created_at=now
                ))

            # Initialize Technicians
            tech_uuids = [
                "df6211f4-7879-4d10-8d2c-5b91b6bdb726",
                "6da60d86-2fda-41e0-8ef8-cf9a46c641ce",
                "55f8a3db-cd1b-4d3c-83e1-ab1ef3bdad37"
            ]
            self.state.technicians = [
                SimTechnician(id=uuid.UUID(tech_uuids[0]), name='Sarah Connor', skillset=['CRAC Repair', 'Cooling Loops', 'Piping'], status='AVAILABLE'),
                SimTechnician(id=uuid.UUID(tech_uuids[1]), name='John Connor', skillset=['GPU Replacement', 'Power Distribution', 'CRAC Repair'], status='AVAILABLE'),
                SimTechnician(id=uuid.UUID(tech_uuids[2]), name='T-800', skillset=['Physical Maintenance', 'Heavy Valve Replacement'], status='AVAILABLE')
            ]

            # Initialize Warehouse Inventory
            parts_list = [
                SimInventoryItem(part_name='chiller_fan_v2', stock=2, reorder_threshold=3, unit_cost=350.0),
                SimInventoryItem(part_name='coolant_valve_3in', stock=0, reorder_threshold=2, unit_cost=950.0),
                SimInventoryItem(part_name='ambient_sensor_hxt', stock=15, reorder_threshold=5, unit_cost=45.0),
                SimInventoryItem(part_name='crac_compressor_p4', stock=1, reorder_threshold=1, unit_cost=4500.0),
                SimInventoryItem(part_name='gpu_fan_block', stock=8, reorder_threshold=4, unit_cost=120.0)
            ]
            self.state.inventory = {p.part_name: p for p in parts_list}

            # Initialize Suppliers
            supplier_uuids = [
                "548fc991-0f04-45ed-a22b-c0337c7f4d9b",
                "c9ca69c3-f5ee-440d-b8fb-c06d7b3b9c34"
            ]
            self.state.suppliers = [
                SimSupplier(
                    id=uuid.UUID(supplier_uuids[0]),
                    name='Apex Cooling Systems Inc.',
                    rating=4.8,
                    inventory={
                        'chiller_fan_v2': {'stock': 5, 'price': 450.00, 'lead_time_hours': 2},
                        'coolant_valve_3in': {'stock': 2, 'price': 1200.00, 'lead_time_hours': 4},
                        'crac_compressor_p4': {'stock': 1, 'price': 4200.00, 'lead_time_hours': 6}
                    }
                ),
                SimSupplier(
                    id=uuid.UUID(supplier_uuids[1]),
                    name='Global HVAC Logistics',
                    rating=4.2,
                    inventory={
                        'chiller_fan_v2': {'stock': 12, 'price': 380.00, 'lead_time_hours': 8},
                        'coolant_valve_3in': {'stock': 0, 'price': 1100.00, 'lead_time_hours': 24}
                    }
                )
            ]
            self.state.orders = []
            self.state.tickets = []
            self.state.incidents = []
            self.state.telemetry_logs = []
            
            # Populate initial telemetry logs
            for rack in self.state.racks:
                self.state.telemetry_logs.append({
                    "id": len(self.state.telemetry_logs) + 1,
                    "rack_id": str(rack.id),
                    "temperature_celsius": rack.temperature_celsius,
                    "power_draw_kw": rack.power_draw_kw,
                    "cooling_flow_rate_lps": rack.cooling_flow_rate_lps,
                    "ambient_temperature": self.state.ambient_temp,
                    "cpu_utilization_percent": rack.cpu_utilization_percent,
                    "memory_utilization_percent": rack.memory_utilization_percent,
                    "recorded_at": (datetime.now() - timedelta(minutes=5)).isoformat()
                })


    def start(self, mode: str = "NORMAL", speed_factor: float = 1.0):
        with self._lock:
            self.state.mode = mode
            self.state.speed_factor = speed_factor

    def pause(self):
        with self._lock:
            self.state.mode = "PAUSED"

    def inject_incident(self, incident_type: str, rack_id: Optional[uuid.UUID] = None) -> SimIncident:
        with self._lock:
            incident_id = uuid.uuid4()
            description = ""
            severity = "WARNING"
            
            # Default to first rack if none provided
            r_id = rack_id or self.state.racks[0].id
            rack = next((r for r in self.state.racks if r.id == r_id), self.state.racks[0])
            
            if incident_type == "HEATWAVE":
                self.state.heatwave_active = True
                self.state.ambient_temp = 38.0
                description = "Severe regional heatwave. Ambient temperature rising rapidly."
                severity = "CRITICAL"
                r_id = rack.id  # generic location
            elif incident_type == "COOLING_DEGRADATION":
                self.state.cooling_system_healthy = False
                self.state.cooling_system_efficiency = 0.3
                description = "Primary HVAC cooling loop pressure loss. Restricting flow rate."
                severity = "CRITICAL"
                # Degrade flow rates immediately
                for r in self.state.racks:
                    if r.row_id != 2:
                        r.status = "CRITICAL"
                        r.temperature_celsius = 38.5
                        r.cooling_flow_rate_lps = 1.35
            elif incident_type == "FAN_FAILURE":
                rack.fan_healthy = False
                description = f"Local fan array failure on {rack.name}. Airflow obstructed."
                severity = "WARNING"
            elif incident_type == "POWER_FLUCTUATION":
                self.state.power_grid_voltage_v = 208.0
                self.state.power_grid_frequency_hz = 48.5
                description = "Grid frequency disturbance. Auxiliary UPS power engaged."
                severity = "CRITICAL"
            elif incident_type == "SENSOR_MALFUNCTION":
                rack.sensor_healthy = False
                description = f"Thermal sensor malfunction on {rack.name}. Stuck registers detected."
                severity = "WARNING"
            elif incident_type == "VALVE_BLOCKAGE":
                description = f"Local cooling loop valve blockage on {rack.name}. Flow restricted to minimum."
                severity = "CRITICAL"
            else:
                description = f"Generic operational anomaly on {rack.name}."

            new_incident = SimIncident(
                id=incident_id,
                rack_id=r_id,
                description=description,
                severity=severity,
                resolved=False,
                created_at=datetime.now()
            )
            self.state.incidents.append(new_incident)
            
            # Immediately trigger callbacks to synchronize status
            self.trigger_callbacks()
            return new_incident

    def tick(self):
        """Execute one simulation step and propagate all causal calculations."""
        with self._lock:
            self.state.tick_count += 1
            self.state.last_tick_time = datetime.now()

            # 1. Update Ambient Conditions
            if self.state.heatwave_active:
                # Ambient temp climbs to 42C max
                self.state.ambient_temp = min(42.0, self.state.ambient_temp + 0.5)
                self.state.ambient_humidity_percent = max(20.0, self.state.ambient_humidity_percent - 1.0)
            else:
                # Ambient temp cools down to 24C base
                self.state.ambient_temp = max(24.0, self.state.ambient_temp - 0.5)
                self.state.ambient_humidity_percent = min(45.0, self.state.ambient_humidity_percent + 0.5)

            # 2. Update Grid Conditions & UPS
            if any(inc.description.startswith("Grid") and not inc.resolved for inc in self.state.incidents):
                self.state.power_grid_voltage_v = round(208.0 + random.uniform(-2.0, 2.0), 1)
                self.state.power_grid_frequency_hz = round(48.5 + random.uniform(-0.3, 0.3), 2)
                # Discharge UPS
                self.state.ups_charge_percent = max(0.0, self.state.ups_charge_percent - 4.0)
            else:
                self.state.power_grid_voltage_v = round(230.0 + random.uniform(-1.0, 1.0), 1)
                self.state.power_grid_frequency_hz = round(50.0 + random.uniform(-0.05, 0.05), 2)
                # Recharge UPS
                self.state.ups_charge_percent = min(100.0, self.state.ups_charge_percent + 2.0)

            # Determine valve blockages
            valve_blocked_rack_ids = [
                inc.rack_id for inc in self.state.incidents 
                if "valve blockage" in inc.description.lower() and not inc.resolved
            ]

            # 3. Update Rack Physical Calculations
            for rack in self.state.racks:
                # Check active workloads
                active_workloads = [w for w in self.state.workloads if w.rack_id == rack.id and w.status == "RUNNING"]
                w_power = sum(w.power_kw for w in active_workloads)
                total_cpus = sum(w.vcpus for w in active_workloads)
                total_mem = sum(w.memory_gb for w in active_workloads)

                # Set resource utilization
                rack.cpu_utilization_percent = min(100, int((total_cpus / rack.cpu_capacity_cores) * 100))
                rack.memory_utilization_percent = min(100, int((total_mem / rack.memory_capacity_gb) * 100))

                # Cooling Loop Flow Rate (LPS)
                flow = 4.5
                if not self.state.cooling_system_healthy and rack.row_id != 2:
                    # Chiller failure degrades flow on Row A & B, Row C has backup loops
                    flow = flow * self.state.cooling_system_efficiency
                
                # Check for localized incident flow restrictions
                if rack.id in valve_blocked_rack_ids:
                    flow = 0.5  # severe valve blockage restriction
                
                if not rack.fan_healthy:
                    flow = flow * 0.4  # fan failure reduces cooling airflow efficiency
                
                rack.cooling_flow_rate_lps = max(0.2, round(flow, 2))

                # Fan Speed RPM
                fan_speed = 3000.0
                if not rack.fan_healthy:
                    fan_speed = 500.0  # fan failure slows speed to creep
                else:
                    # Fans ramp up with rack temperature
                    fan_speed += max(0.0, rack.temperature_celsius - 22.0) * 350.0
                
                rack.fan_speed_rpm = min(8000.0, round(fan_speed, 1))

                # Power Draw (Base 2.0kW + Workloads + Fan Power Draw cube law)
                p_fan = 0.25 * ((rack.fan_speed_rpm / 3000.0) ** 3)
                total_power = 2.0 + w_power + p_fan
                
                # If UPS is completely dead and grid is down, rack powers off
                if self.state.ups_charge_percent <= 0.0 and self.state.power_grid_voltage_v < 215.0:
                    total_power = 0.0
                    rack.cpu_utilization_percent = 0
                    rack.memory_utilization_percent = 0
                    for w in active_workloads:
                        w.status = "TERMINATED"
                
                rack.power_draw_kw = round(total_power, 2)

                # Thermal Propagation
                power_heat = rack.power_draw_kw * 1.6
                ambient_effect = (self.state.ambient_temp - 20.0) * 0.45
                cooling_effect = rack.cooling_flow_rate_lps * 4.8
                
                # Step delta (0.4 units)
                temp_delta = (power_heat + ambient_effect - cooling_effect) * 0.4
                temp_new = rack.temperature_celsius + temp_delta
                
                # Limit minimum temperature to air intake floor (17.5C)
                temp_new = max(17.5, temp_new)

                # Update temperature (simulate sensor failure if applicable)
                if not rack.sensor_healthy:
                    rack.temperature_celsius = 99.9  # register error spike
                else:
                    rack.temperature_celsius = round(temp_new, 1)

                # Update status
                if rack.temperature_celsius >= 40.0:
                    rack.status = "CRITICAL"
                elif rack.temperature_celsius >= 30.0 or rack.cooling_flow_rate_lps < 2.5 or not rack.fan_healthy:
                    rack.status = "DEGRADED"
                else:
                    rack.status = "OPTIMAL"

                # Append telemetry log
                self.state.telemetry_logs.append({
                    "id": self.state.tick_count * 10 + len(self.state.telemetry_logs) + 1,
                    "rack_id": str(rack.id),
                    "temperature_celsius": rack.temperature_celsius,
                    "power_draw_kw": rack.power_draw_kw,
                    "cooling_flow_rate_lps": rack.cooling_flow_rate_lps,
                    "ambient_temperature": self.state.ambient_temp,
                    "cpu_utilization_percent": rack.cpu_utilization_percent,
                    "memory_utilization_percent": rack.memory_utilization_percent,
                    "recorded_at": datetime.now().isoformat()
                })

            # Trim telemetry logs to keep the last 100 entries per rack
            if len(self.state.telemetry_logs) > 600:
                by_rack = {}
                for log in self.state.telemetry_logs:
                    r_id = log["rack_id"]
                    if r_id not in by_rack:
                        by_rack[r_id] = []
                    by_rack[r_id].append(log)
                
                trimmed_logs = []
                for r_id, logs in by_rack.items():
                    trimmed_logs.extend(logs[-100:])
                self.state.telemetry_logs = trimmed_logs


            # 4. Update Procurement Orders Progress
            for order in self.state.orders:
                if order.status == "ORDERED":
                    order.ticks_to_delivery -= 1
                    if order.ticks_to_delivery <= 0:
                        order.status = "DELIVERED"
                        # Replenish warehouse inventory
                        for item in order.items:
                            part_name = item["part_name"]
                            qty = item["quantity"]
                            if part_name in self.state.inventory:
                                self.state.inventory[part_name].stock += qty
                            else:
                                self.state.inventory[part_name] = SimInventoryItem(
                                    part_name=part_name,
                                    stock=qty,
                                    reorder_threshold=2,
                                    unit_cost=item["unit_price_usd"]
                                )
                        print(f"[SIMULATOR] Procurement order {order.id} delivered. Stock updated.")

            # 5. Update Maintenance Tickets & Technicians Progress
            for ticket in self.state.tickets:
                if ticket.status == "IN_PROGRESS":
                    tech = next((t for t in self.state.technicians if t.id == ticket.technician_id), None)
                    if tech:
                        tech.repair_time_remaining_ticks -= 1
                        if tech.repair_time_remaining_ticks <= 0:
                            # Repair complete!
                            ticket.status = "RESOLVED"
                            ticket.resolved_at = datetime.now()
                            tech.status = "AVAILABLE"
                            tech.current_ticket_id = None
                            
                            # Apply physical repairs to the target rack
                            target_rack = next((r for r in self.state.racks if r.id == ticket.target_rack_id), None)
                            if target_rack:
                                if ticket.issue_type == "COOLING_LEAK" or ticket.issue_type == "VALVE_BLOCKAGE":
                                    # Reset primary chiller health
                                    self.state.cooling_system_healthy = True
                                    self.state.cooling_system_efficiency = 1.0
                                    self.state.heatwave_active = False # Heatwave ends after repair
                                elif ticket.issue_type == "FAN_FAILURE":
                                    target_rack.fan_healthy = True
                                elif ticket.issue_type == "POWER_UNIT_FAULT":
                                    # Grid recovery
                                    pass
                                elif ticket.issue_type == "GPU_OVERHEAT":
                                    # Clean heatsinks
                                    pass
                                target_rack.status = "OPTIMAL"

                            # Resolve associated incidents
                            for inc in self.state.incidents:
                                if inc.rack_id == ticket.target_rack_id and not inc.resolved:
                                    inc.resolved = True
                                    inc.resolved_at = datetime.now()
                                    
                            print(f"[SIMULATOR] Ticket {ticket.id} resolved. Physical loop restored.")

                elif ticket.status == "ASSIGNED":
                    tech = next((t for t in self.state.technicians if t.id == ticket.technician_id), None)
                    if tech:
                        # Check if required parts are in stock in the warehouse
                        parts_available = True
                        for part_name, qty in ticket.parts_required.items():
                            item = self.state.inventory.get(part_name)
                            if not item or item.stock < qty:
                                parts_available = False
                                break
                        
                        if parts_available:
                            # Technician travels to site
                            tech.travel_time_remaining_ticks -= 1
                            if tech.travel_time_remaining_ticks <= 0:
                                # Deduct parts from stock
                                for part_name, qty in ticket.parts_required.items():
                                    self.state.inventory[part_name].stock -= qty
                                
                                # Start repair
                                ticket.status = "IN_PROGRESS"
                                tech.status = "ON_DUTY"
                        else:
                            # Tech is waiting at warehouse for procurement order delivery
                            tech.status = "ON_DUTY"
                            # Print warning once in a while
                            pass

        # Trigger registered callbacks (e.g. Supabase sync)
        self.trigger_callbacks()

    async def run_loop(self):
        """Asynchronous background loop runner."""
        print("[SIMULATOR] Background loop started.")
        while True:
            try:
                # Sleep based on mode and speed factor
                mode = self.state.mode
                speed = self.state.speed_factor
                
                if mode == "PAUSED":
                    await asyncio.sleep(1.0)
                    continue
                
                # Normal mode: 1 tick = 1 min, run tick every 5 seconds
                # Accelerated mode: 1 tick = 5 min, run tick every 1 second
                if mode == "ACCELERATED":
                    sleep_time = 1.0 / speed
                else:
                    sleep_time = 5.0 / speed
                
                await asyncio.sleep(sleep_time)
                
                # Tick calculations
                self.tick()
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[SIMULATOR] Error in simulator loop: {e}")
                await asyncio.sleep(1.0)

    def start_background_loop(self):
        """Start the background task loop if it is not already running."""
        if self._loop_task is None or self._loop_task.done():
            loop = asyncio.get_event_loop()
            self._loop_task = loop.create_task(self.run_loop())
            print("[SIMULATOR] Launched background loop task.")

    def stop_background_loop(self):
        if self._loop_task and not self._loop_task.done():
            self._loop_task.cancel()
            self._loop_task = None
            print("[SIMULATOR] Stopped background loop task.")

    def migrate_workload(self, workload_id: uuid.UUID, target_rack_id: uuid.UUID):
        with self._lock:
            workload = next((w for w in self.state.workloads if w.id == workload_id), None)
            if not workload:
                raise ValueError(f"Workload {workload_id} not found")
            workload.rack_id = target_rack_id
            workload.status = "RUNNING"
            self.trigger_callbacks()

    def plan_maintenance(self, target_rack_id: uuid.UUID, issue_type: str, description: str) -> SimMaintenanceTicket:
        with self._lock:
            parts_required = {}
            estimated_duration_hours = 2.0
            if issue_type == 'COOLING_LEAK':
                parts_required = { 'coolant_valve_3in': 1 }
                estimated_duration_hours = 3.0
            elif issue_type == 'FAN_FAILURE':
                parts_required = { 'chiller_fan_v2': 2 }
                estimated_duration_hours = 1.5
            elif issue_type == 'POWER_UNIT_FAULT':
                parts_required = { 'crac_compressor_p4': 1 }
                estimated_duration_hours = 4.0
            elif issue_type == 'GPU_OVERHEAT':
                parts_required = { 'gpu_fan_block': 2 }
                estimated_duration_hours = 2.0
            elif issue_type == 'VALVE_BLOCKAGE':
                parts_required = { 'coolant_valve_3in': 1, 'ambient_sensor_hxt': 1 }
                estimated_duration_hours = 2.5

            ticket_id = uuid.uuid4()
            ticket = SimMaintenanceTicket(
                id=ticket_id,
                target_rack_id=target_rack_id,
                issue_type=issue_type,
                description=description,
                technician_id=None,
                status="OPEN",
                parts_required=parts_required,
                scheduled_time=datetime.now() + timedelta(hours=1),
                resolved_at=None,
                estimated_duration_hours=estimated_duration_hours,
                labor_hours=estimated_duration_hours,
                calculated_cost=0.0
            )
            self.state.tickets.append(ticket)

            incident = SimIncident(
                id=uuid.uuid4(),
                rack_id=target_rack_id,
                description=f"Active maintenance incident: {issue_type} - {description}",
                severity="WARNING",
                resolved=False,
                created_at=datetime.now()
            )
            self.state.incidents.append(incident)
            self.trigger_callbacks()
            return ticket

    def schedule_technician(self, ticket_id: uuid.UUID, technician_id: uuid.UUID, scheduled_time: datetime):
        with self._lock:
            ticket = next((t for t in self.state.tickets if t.id == ticket_id), None)
            if not ticket:
                raise ValueError(f"Ticket {ticket_id} not found")
            tech = next((t for t in self.state.technicians if t.id == technician_id), None)
            if not tech:
                raise ValueError(f"Technician {technician_id} not found")
            if tech.status != 'AVAILABLE':
                raise ValueError(f"Technician {tech.name} is not available")

            tech.status = 'ON_DUTY'
            tech.current_ticket_id = ticket.id
            tech.travel_time_remaining_ticks = 2
            tech.repair_time_remaining_ticks = int(ticket.estimated_duration_hours * 2)

            ticket.technician_id = tech.id
            ticket.status = 'ASSIGNED'
            ticket.scheduled_time = scheduled_time
            self.trigger_callbacks()

    def confirm_maintenance_repair(self, ticket_id: uuid.UUID):
        with self._lock:
            ticket = next((t for t in self.state.tickets if t.id == ticket_id), None)
            if not ticket:
                raise ValueError(f"Ticket {ticket_id} not found")
            
            ticket.status = 'RESOLVED'
            ticket.resolved_at = datetime.now()
            
            if ticket.technician_id:
                tech = next((t for t in self.state.technicians if t.id == ticket.technician_id), None)
                if tech:
                    tech.status = 'AVAILABLE'
                    tech.current_ticket_id = None
            
            for inc in self.state.incidents:
                if inc.rack_id == ticket.target_rack_id and not inc.resolved:
                    inc.resolved = True
                    inc.resolved_at = datetime.now()
            
            self.state.cooling_system_healthy = True
            self.state.cooling_system_efficiency = 1.0
            self.state.ambient_temp = 24.0
            self.state.heatwave_active = False

            target_rack = next((r for r in self.state.racks if r.id == ticket.target_rack_id), None)
            if target_rack:
                target_rack.fan_healthy = True
                target_rack.sensor_healthy = True
                target_rack.status = 'OPTIMAL'
                
            self.trigger_callbacks()

    def generate_procurement_plan(self, ticket_id: uuid.UUID, supplier_id: uuid.UUID, parts: Dict[str, int]) -> SimProcurementOrder:
        with self._lock:
            ticket = next((t for t in self.state.tickets if t.id == ticket_id), None)
            if not ticket:
                raise ValueError(f"Ticket {ticket_id} not found")
            supplier = next((s for s in self.state.suppliers if s.id == supplier_id), None)
            if not supplier:
                raise ValueError(f"Supplier {supplier_id} not found")

            order_id = uuid.uuid4()
            ordered_items = []
            grand_total = 0.0
            max_lead_time_hours = 0.0

            for part_name, qty in parts.items():
                part = supplier.inventory.get(part_name)
                if not part:
                    raise ValueError(f"Supplier does not catalog component: {part_name}")
                if part["stock"] < qty:
                    raise ValueError(f"Insufficient stock for {part_name} at supplier. Available: {part['stock']}, Requested: {qty}")
                
                part["stock"] -= qty
                item_cost = part["price"] * qty
                grand_total += item_cost
                max_lead_time_hours = max(max_lead_time_hours, part["lead_time_hours"])
                
                ordered_items.append({
                    "part_name": part_name,
                    "quantity": qty,
                    "unit_price_usd": part["price"],
                    "total_price_usd": item_cost
                })

            ticks_to_delivery = max(1, int(max_lead_time_hours * 2))
            delivery_time = datetime.now() + timedelta(hours=max_lead_time_hours)

            order = SimProcurementOrder(
                id=order_id,
                ticket_id=ticket_id,
                supplier_id=supplier_id,
                supplier_name=supplier.name,
                items=ordered_items,
                total_cost=grand_total,
                status='ORDERED',
                ticks_to_delivery=ticks_to_delivery,
                estimated_delivery=delivery_time
            )
            self.state.orders.append(order)
            
            if ticket.status == 'OPEN':
                ticket.status = 'ASSIGNED'
                
            self.trigger_callbacks()
            return order
