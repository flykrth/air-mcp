import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    # The startup event triggers initialize_database() and seeds in-memory data
    with TestClient(app) as c:
        yield c

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_racks_endpoints(client):
    headers = {"Authorization": "Bearer mock-token"}
    
    # 1. List all racks
    response = client.get("/api/v1/racks/", headers=headers)
    assert response.status_code == 200
    racks = response.json()
    assert len(racks) == 6
    assert any(r["name"] == "Rack-A1" for r in racks)
    
    # 2. Get specific rack
    rack_id = racks[0]["id"]
    response = client.get(f"/api/v1/racks/{rack_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["id"] == rack_id

    # 3. Update rack status
    response = client.put(f"/api/v1/racks/{rack_id}/status?status_str=DEGRADED", headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "DEGRADED"

def test_workloads_endpoints(client):
    headers = {"Authorization": "Bearer mock-token"}
    
    # 1. List all workloads
    response = client.get("/api/v1/workloads/", headers=headers)
    assert response.status_code == 200
    workloads = response.json()
    assert len(workloads) > 0
    
    # 2. List workloads by rack
    rack_id = workloads[0]["rack_id"]
    response = client.get(f"/api/v1/workloads/rack/{rack_id}", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) > 0

def test_telemetry_endpoints(client):
    headers = {"Authorization": "Bearer mock-token"}
    
    # 1. List racks to find an ID
    response = client.get("/api/v1/racks/", headers=headers)
    rack_id = response.json()[0]["id"]
    
    # 2. Get latest telemetry (none seeded initially, but check 404 or add one)
    response = client.get(f"/api/v1/telemetry/rack/{rack_id}/latest", headers=headers)
    # Since we didn't add historical logs yet, it might 404
    assert response.status_code in [200, 404]

    # 3. Post telemetry log
    log_payload = {
        "rack_id": rack_id,
        "temperature_celsius": 28.5,
        "power_draw_kw": 4.5,
        "cooling_flow_rate_lps": 4.5,
        "ambient_temperature": 24.0,
        "recorded_at": "2026-07-17T18:30:00"
    }
    response = client.post("/api/v1/telemetry/", json=log_payload, headers=headers)
    assert response.status_code == 201
    
    # 4. Now get latest should succeed
    response = client.get(f"/api/v1/telemetry/rack/{rack_id}/latest", headers=headers)
    assert response.status_code == 200
    assert response.json()["temperature_celsius"] == 28.5

def test_tickets_endpoints(client):
    headers = {"Authorization": "Bearer mock-token"}
    
    # 1. List tickets (empty initially)
    response = client.get("/api/v1/tickets/", headers=headers)
    assert response.status_code == 200
    
    # 2. List racks to create a ticket
    racks_res = client.get("/api/v1/racks/", headers=headers)
    rack_id = racks_res.json()[0]["id"]
    
    # 3. Create ticket
    ticket_payload = {
        "id": "11111111-2222-3333-4444-555555555555",
        "target_rack_id": rack_id,
        "description": "Verify chiller cooling block pressure drop.",
        "status": "OPEN",
        "parts_required": {"coolant_valve_3in": 1},
        "scheduled_time": "2026-07-17T19:00:00"
    }
    response = client.post("/api/v1/tickets/", json=ticket_payload, headers=headers)
    assert response.status_code == 201
    assert response.json()["status"] == "OPEN"

def test_orders_endpoints(client):
    headers = {"Authorization": "Bearer mock-token"}
    
    # 1. Create procurement order
    order_payload = {
        "id": "99999999-8888-7777-6666-555555555555",
        "ticket_id": "11111111-2222-3333-4444-555555555555",
        "supplier_id": "548fc991-0f04-45ed-a22b-c0337c7f4d9b",
        "item_name": "coolant_valve_3in",
        "quantity": 1,
        "total_cost": 1200.0,
        "status": "ORDERED",
        "estimated_delivery": "2026-07-17T20:00:00"
    }
    response = client.post("/api/v1/orders/", json=order_payload, headers=headers)
    assert response.status_code == 201
    assert response.json()["status"] == "ORDERED"

    # 2. List orders
    response = client.get("/api/v1/orders/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) > 0
