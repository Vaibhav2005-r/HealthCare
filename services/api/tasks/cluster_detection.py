import datetime

async def detect_severe_clusters(case_reports: list):
    """
    Scans the last N hours of case_reports for 3+ severe cases within a configurable radius.
    Simplified here to just check if 3+ severe cases exist in the same district.
    """
    severe_cases = [r for r in case_reports if r.get('severity') == 'severe']
    
    district_counts = {}
    for case in severe_cases:
        dist = case.get('district')
        if dist:
            district_counts[dist] = district_counts.get(dist, 0) + 1
            
    alerts = []
    for dist, count in district_counts.items():
        if count >= 3:
            alerts.append({
                "district": dist,
                "type": "SEVERE_CLUSTER",
                "count": count,
                "timestamp": str(datetime.datetime.now())
            })
            print(f"ALERT: Severe cluster detected in {dist} with {count} cases!")
            
    return alerts
