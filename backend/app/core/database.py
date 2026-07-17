import uuid
from datetime import datetime
from typing import Optional
from supabase import create_async_client, AsyncClient
from app.core.config import settings
from app.domain.models import Rack, Technician, Supplier, CloudWorkload

_client: Optional[AsyncClient] = None

async def get_supabase_client() -> AsyncClient:
    global _client
    if _client is None:
        _client = await create_async_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _client

async def initialize_database():
    """
    Initializes and seeds the database with the default digital twin state.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        print("[DATABASE] Supabase URL or Key not set. Running in offline fallback mode.")
        # Seed in-memory repositories
        from app.api.dependencies import (
            get_rack_repository, get_technician_repository,
            get_supplier_repository, get_workload_repository
        )
        rack_repo = get_rack_repository(None)
        tech_repo = get_technician_repository(None)
        supplier_repo = get_supplier_repository(None)
        workload_repo = get_workload_repository(None)

        racks = await rack_repo.list_all()
        if not racks:
            print("[DATABASE] Seeding in-memory repositories...")
            await seed_repositories(rack_repo, tech_repo, supplier_repo, workload_repo)
        return

    try:
        supabase = await get_supabase_client()
        # Check if racks table is empty
        res = await supabase.table("racks").select("id").limit(1).execute()
        if not res.data:
            print("[DATABASE] Database is empty. Seeding Supabase tables...")
            from app.api.dependencies import (
                get_rack_repository, get_technician_repository,
                get_supplier_repository, get_workload_repository
            )
            rack_repo = get_rack_repository(supabase)
            tech_repo = get_technician_repository(supabase)
            supplier_repo = get_supplier_repository(supabase)
            workload_repo = get_workload_repository(supabase)
            await seed_repositories(rack_repo, tech_repo, supplier_repo, workload_repo)
            print("[DATABASE] Supabase database seeding complete.")
    except Exception as e:
        print(f"[DATABASE] Error during database initialization: {e}")

async def seed_repositories(rack_repo, tech_repo, supplier_repo, workload_repo):
    # Racks
    rack_names = ['Rack-A1', 'Rack-A2', 'Rack-B1', 'Rack-B2', 'Rack-C1', 'Rack-C2']
    racks = []
    idx = 0
    now = datetime.now()
    # Fixed UUIDs to keep them consistent with TS server
    rack_uuids = [
        "f7dfd754-b54a-47e5-b3f9-e5a662c8f84b",
        "0920f20a-7f86-4b80-9877-c0e717f4af70",
        "f23cf467-de30-4c47-8950-44bf5b321afd",
        "a9521a0e-6a88-4848-ad49-e64be022589f",
        "565755f8-8942-492e-9eb7-38c9b43bad1d",
        "5e71eb3f-eb20-476a-ac58-bd215e051e6b"
    ]
    for row in range(3):
        for col in range(2):
            name = rack_names[idx]
            u = uuid.UUID(rack_uuids[idx])
            rack = Rack(
                id=u,
                name=name,
                row_id=row,
                column_id=col,
                max_kw_capacity=15.0,
                status="OPTIMAL",
                created_at=now
            )
            await rack_repo.upsert(rack)
            racks.append(rack)
            idx += 1

    # Technicians
    tech_uuids = [
        "df6211f4-7879-4d10-8d2c-5b91b6bdb726",
        "6da60d86-2fda-41e0-8ef8-cf9a46c641ce",
        "55f8a3db-cd1b-4d3c-83e1-ab1ef3bdad37"
    ]
    techs = [
        Technician(id=uuid.UUID(tech_uuids[0]), name='Sarah Connor', skillset=['CRAC Repair', 'Cooling Loops', 'Piping'], status='AVAILABLE'),
        Technician(id=uuid.UUID(tech_uuids[1]), name='John Connor', skillset=['GPU Replacement', 'Power Distribution', 'CRAC Repair'], status='AVAILABLE'),
        Technician(id=uuid.UUID(tech_uuids[2]), name='T-800', skillset=['Physical Maintenance', 'Heavy Valve Replacement'], status='AVAILABLE')
    ]
    for tech in techs:
        await tech_repo.upsert(tech)

    # Suppliers
    supplier_uuids = [
        "548fc991-0f04-45ed-a22b-c0337c7f4d9b",
        "c9ca69c3-f5ee-440d-b8fb-c06d7b3b9c34"
    ]
    suppliers = [
        Supplier(
            id=uuid.UUID(supplier_uuids[0]),
            name='Apex Cooling Systems Inc.',
            rating=4.8,
            inventory={
                'chiller_fan_v2': {'stock': 5, 'price': 450.00, 'lead_time_hours': 2},
                'coolant_valve_3in': {'stock': 2, 'price': 1200.00, 'lead_time_hours': 4},
                'crac_compressor_p4': {'stock': 1, 'price': 4200.00, 'lead_time_hours': 6}
            }
        ),
        Supplier(
            id=uuid.UUID(supplier_uuids[1]),
            name='Global HVAC Logistics',
            rating=4.2,
            inventory={
                'chiller_fan_v2': {'stock': 12, 'price': 380.00, 'lead_time_hours': 8},
                'coolant_valve_3in': {'stock': 0, 'price': 1100.00, 'lead_time_hours': 24}
            }
        )
    ]
    for s in suppliers:
        await supplier_repo.upsert(s)

    # Workloads
    for i, rack in enumerate(racks):
        # Workload 1
        w1 = CloudWorkload(
            id=uuid.uuid4(),
            rack_id=rack.id,
            name=f"{rack.name}-Job-1",
            vcpus=8,
            memory_gb=32,
            priority=4 if i % 2 == 0 else 2,
            sla_threshold_temp=35.0,
            status="RUNNING",
            created_at=now
        )
        await workload_repo.upsert(w1)

        # Workload 2
        w2 = CloudWorkload(
            id=uuid.uuid4(),
            rack_id=rack.id,
            name=f"{rack.name}-Job-2",
            vcpus=4,
            memory_gb=16,
            priority=1,
            sla_threshold_temp=32.0,
            status="RUNNING",
            created_at=now
        )
        await workload_repo.upsert(w2)
