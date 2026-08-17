import asyncio
import datetime
from .supabase_client import fetch_new_case_reports
from .qdrant_sync import embed_and_upsert_notes
from .data_aggregation import aggregate_district_timeseries, compute_dashboard_statistics
from .ml_inference import run_outbreak_dl_inference
from .geospatial import build_heatmap_geodata
from .redis_cache import cache_dashboard_payload
from .alert_generator import generate_alert_summary
from .cluster_detection import detect_severe_clusters

async def run_backend_pipeline():
    print(f"[{datetime.datetime.now()}] Starting backend pipeline run...")
    
    try:
        # 1. Fetch new reports
        reports = await fetch_new_case_reports()
        print(f"Fetched {len(reports)} new case reports.")
        
        if not reports:
            print("No new reports to process.")
            return

        # 2. Embed and Upsert notes
        await embed_and_upsert_notes(reports)
        
        # 3. Detect Severe Clusters (SOS check)
        cluster_alerts = await detect_severe_clusters(reports)
        
        # 4. Aggregation
        timeseries_df = await aggregate_district_timeseries(reports)
        stats = await compute_dashboard_statistics(reports)
        
        # 5. ML Inference
        forecasts = await run_outbreak_dl_inference(timeseries_df)
        
        # 6. Check for LLM Alerts
        generated_alerts = []
        for dist, data in forecasts.items():
            if data['label'] in ['HIGH', 'CRITICAL']:
                msg = await generate_alert_summary(dist, data['label'], stats['total_cases'])
                generated_alerts.append({"district": dist, "message": msg})
                
        # 7. Heatmap Geodata
        heatmap_data = build_heatmap_geodata(reports, forecasts)
        
        # 8. Cache Payload
        payload = {
            "statistics": stats,
            "forecasts": forecasts,
            "heatmap": heatmap_data,
            "cluster_alerts": cluster_alerts,
            "generated_alerts": generated_alerts,
            "last_updated": str(datetime.datetime.now())
        }
        await cache_dashboard_payload(payload)
        print("Pipeline run completed successfully.")
        
    except Exception as e:
        print(f"Pipeline error: {e}")

async def start_scheduler():
    """
    Runs the pipeline periodically. 
    (Simulated as every 60 seconds for testing, should be 30-60 mins in prod)
    """
    while True:
        await run_backend_pipeline()
        await asyncio.sleep(60)

if __name__ == "__main__":
    asyncio.run(start_scheduler())
