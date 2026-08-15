def build_heatmap_geodata(case_reports: list, district_forecasts: dict):
    """
    District risk centroids + case point clusters.
    Returns GeoJSON-like structured data for the frontend heatmap.
    """
    points = []
    for report in case_reports:
        if report.get('latitude') and report.get('longitude'):
            points.append({
                "lat": report['latitude'],
                "lng": report['longitude'],
                "severity": report.get('severity', 'mild'),
                "disease": report.get('suspected_disease')
            })
            
    return {
        "clusters": points,
        "district_risk": district_forecasts
    }
