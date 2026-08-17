import pandas as pd
import datetime

async def aggregate_district_timeseries(case_reports: list):
    """
    Rolls up case counts into daily per-district time series.
    Input: list of case report dicts.
    Returns: DataFrame with district, date, and counts for ML inference.
    """
    if not case_reports:
        return pd.DataFrame()
        
    df = pd.DataFrame(case_reports)
    
    # Ensure reported_at is datetime
    df['reported_at'] = pd.to_datetime(df['reported_at'])
    df['date'] = df['reported_at'].dt.date
    
    # Aggregate counts by district and date
    timeseries = df.groupby(['district', 'date']).size().reset_index(name='daily_cases')
    return timeseries

async def compute_dashboard_statistics(case_reports: list):
    """
    Computes dashboard summary stats like case counts by disease category,
    age group, top symptoms, etc.
    """
    if not case_reports:
        return {}
        
    df = pd.DataFrame(case_reports)
    
    total_cases = len(df)
    disease_counts = df['suspected_disease'].value_counts().to_dict() if 'suspected_disease' in df else {}
    severity_counts = df['severity'].value_counts().to_dict() if 'severity' in df else {}
    
    # Age groups
    age_groups = {"0-10": 0, "11-30": 0, "31-60": 0, "60+": 0}
    if 'patient_age_years' in df:
        for age in df['patient_age_years'].dropna():
            if age <= 10:
                age_groups["0-10"] += 1
            elif age <= 30:
                age_groups["11-30"] += 1
            elif age <= 60:
                age_groups["31-60"] += 1
            else:
                age_groups["60+"] += 1
                
    return {
        "total_cases": total_cases,
        "disease_counts": disease_counts,
        "severity_counts": severity_counts,
        "age_groups": age_groups,
        "timestamp": str(datetime.datetime.now())
    }
