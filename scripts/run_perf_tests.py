#!/usr/bin/env python3
import sys
import os
import time
import json
import urllib.request
import urllib.error
import math

def calculate_percentile(sorted_list, percentile):
    if not sorted_list:
        return 0
    k = (len(sorted_list) - 1) * percentile
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return sorted_list[int(k)]
    d0 = sorted_list[int(f)] * (c - k)
    d1 = sorted_list[int(c)] * (k - f)
    return d0 + d1

def benchmark_endpoint(name, url, method="GET", data=None, headers=None, iterations=50):
    print(f"Benchmarking {name} ({iterations} iterations)...")
    latencies = []
    errors = 0
    
    for _ in range(iterations):
        t_start = time.perf_counter()
        req = urllib.request.Request(url, method=method)
        if headers:
            for k, v in headers.items():
                req.add_header(k, v)
        if data:
            req.add_header('Content-Type', 'application/json')
            jsondata = json.dumps(data).encode('utf-8')
        else:
            jsondata = None
            
        try:
            with urllib.request.urlopen(req, data=jsondata, timeout=5) as response:
                status = response.status
                response.read() # read body to complete request
        except urllib.error.HTTPError as e:
            status = e.code
            e.read()
            errors += 1
        except Exception:
            status = 0
            errors += 1
            
        t_end = time.perf_counter()
        latencies.append((t_end - t_start) * 1000) # milliseconds
        
    latencies.sort()
    
    min_lat = latencies[0] if latencies else 0
    max_lat = latencies[-1] if latencies else 0
    avg_lat = sum(latencies) / len(latencies) if latencies else 0
    p50 = calculate_percentile(latencies, 0.50)
    p90 = calculate_percentile(latencies, 0.90)
    p99 = calculate_percentile(latencies, 0.99)
    error_rate = (errors / iterations) * 100
    
    return {
        "name": name,
        "min": min_lat,
        "max": max_lat,
        "avg": avg_lat,
        "p50": p50,
        "p90": p90,
        "p99": p99,
        "error_rate": error_rate
    }

def main():
    print("=========================================================")
    print("        AIR-MCP API Gateway Performance Benchmark        ")
    print("=========================================================")
    
    base_url = os.getenv("BACKEND_URL", os.getenv("BACKEND_API_URL", "https://air-mcp-production.up.railway.app"))
    
    # First, check if backend is running
    try:
        urllib.request.urlopen(base_url, timeout=2)
    except Exception:
        print(f"\n[✗] Error: Backend API server is not running on {base_url}.")
        print("    Please start the backend before running performance tests.")
        sys.exit(1)
        
    auth_headers = {"Authorization": "Bearer mock-token"}
    endpoints = [
        {"name": "Root Endpoint (/) ", "url": f"{base_url}/", "headers": None},
        {"name": "Health Status API ", "url": f"{base_url}/api/v1/health", "headers": None},
        {"name": "Racks List GET    ", "url": f"{base_url}/api/v1/racks/", "headers": auth_headers},
        {"name": "Workloads GET     ", "url": f"{base_url}/api/v1/workloads/", "headers": auth_headers}
    ]
    
    results = []
    for ep in endpoints:
        res = benchmark_endpoint(ep["name"], ep["url"], headers=ep["headers"], iterations=50)
        results.append(res)
        
    # Simulator Tick benchmark (POST /api/v1/simulator/tick)
    sim_res = benchmark_endpoint("Simulator Tick     ", f"{base_url}/api/v1/simulator/tick", method="POST", iterations=10)
    results.append(sim_res)
    
    # Print results in Markdown Table format
    print("\n\n## Performance Benchmark Baseline Results")
    print("")
    print("| Endpoint/Operation | Min (ms) | Avg (ms) | Max (ms) | p50 (ms) | p90 (ms) | p99 (ms) | Error Rate (%) |")
    print("| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |")
    for r in results:
        print(f"| {r['name'].strip()} | {r['min']:.2f} | {r['avg']:.2f} | {r['max']:.2f} | {r['p50']:.2f} | {r['p90']:.2f} | {r['p99']:.2f} | {r['error_rate']:.1f}% |")
    print("")
    
if __name__ == "__main__":
    main()
