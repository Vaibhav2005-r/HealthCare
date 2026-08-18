from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Date
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import declarative_base
from datetime import datetime, timezone
import uuid

Base = declarative_base()

class District(Base):
    __tablename__ = "districts"

    district_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    state = Column(String, nullable=False)
    centroid_lat = Column(Float, nullable=True)
    centroid_lng = Column(Float, nullable=True)
    neighbor_district_ids = Column(ARRAY(String), nullable=True)
    risk_level = Column(String, nullable=True) # LOW, MODERATE, HIGH, CRITICAL
    risk_score = Column(Float, nullable=True)
    active_cases = Column(Integer, nullable=True, default=0)
    trend_7d = Column(String, nullable=True) # UP, DOWN, FLAT
    trend_pct = Column(Float, nullable=True)
    primary_suspected = Column(String, nullable=True)
    population = Column(String, nullable=True)
    asha_active_count = Column(Integer, nullable=True, default=0)
    rainfall_mm = Column(Float, nullable=True, default=0.0)
    humidity_pct = Column(Float, nullable=True, default=0.0)
    last_reported = Column(String, nullable=True)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False, default="Maharashtra")
    type = Column(String, nullable=False) # SOS_TRIGGER, ML_SPIKE_PREDICTION
    severity = Column(String, nullable=False) # LOW, MODERATE, HIGH, CRITICAL
    risk_score = Column(Float, nullable=False)
    cases_count = Column(Integer, nullable=False, default=1)
    worker_role = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    summary = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="UNACKNOWLEDGED") # UNACKNOWLEDGED, INVESTIGATING, ACKNOWLEDGED, RESOLVED
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

class CaseReport(Base):
    __tablename__ = "case_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asha_worker_id = Column(UUID(as_uuid=True), nullable=True)
    worker_identifier = Column(String, nullable=True)
    patient_name = Column(String, nullable=True)
    patient_age_years = Column(Integer, nullable=True)
    patient_gender = Column(String, nullable=True) # M, F, O
    village = Column(String, nullable=True)
    block = Column(String, nullable=True)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False, default="Maharashtra")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    altitude = Column(Float, nullable=True)
    accuracy_meters = Column(Float, nullable=True)
    location_source = Column(String, nullable=False, default="gps_auto")
    manual_reason_code = Column(String, nullable=True)
    symptoms = Column(ARRAY(String), nullable=True)
    suspected_disease = Column(String, nullable=True)
    severity = Column(String, nullable=True) # GREEN, AMBER, RED / MILD, MODERATE, HIGH, CRITICAL
    onset_date = Column(Date, nullable=True)
    reported_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    notes = Column(Text, nullable=True)
    notes_language = Column(String, nullable=True)
    image_urls = Column(ARRAY(String), nullable=True)
    status = Column(String, nullable=True)
    verified_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    duration_days = Column(Integer, nullable=True)
    temperature = Column(Float, nullable=True)
    temperature_unit = Column(String, nullable=True, default="C")
    comorbidities = Column(ARRAY(String), nullable=True)
    medication_taken = Column(String, nullable=True)
    sync_status = Column(String, nullable=True, default="ONLINE")

class HealthCenterInventory(Base):
    __tablename__ = "health_center_inventory"

    id = Column(Integer, primary_key=True, autoincrement=True)
    center_name = Column(String, nullable=False)
    district = Column(String, nullable=False)
    item = Column(String, nullable=False) # ORS, IV Ringer's Lactate, Paracetamol, etc.
    stock = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False) # HEALTHY, LOW_STOCK, CRITICAL
    bed_capacity = Column(Integer, nullable=True, default=0)
    on_duty_doctors = Column(Integer, nullable=True, default=0)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

class AshaWorker(Base):
    __tablename__ = "asha_workers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_number = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, nullable=False, default="ASHA Worker")
    block = Column(String, nullable=True)
    district = Column(String, nullable=True)
    state = Column(String, nullable=True, default="Maharashtra")
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

class PhcWorker(Base):
    __tablename__ = "phc_workers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_code = Column(String, nullable=False, unique=True, index=True)
    phone_number = Column(String, nullable=False, unique=True)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    phc_name = Column(String, nullable=False, index=True)
    block = Column(String, nullable=True)
    district = Column(String, nullable=False, index=True)
    state = Column(String, nullable=False, default="Maharashtra")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
