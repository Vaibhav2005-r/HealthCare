from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Enum
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import enum
from geoalchemy2 import Geometry

Base = declarative_base()

class RiskLevel(enum.Enum):
    GREEN = "GREEN"
    AMBER = "AMBER"
    RED = "RED"

class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    health_center_id = Column(Integer, ForeignKey("health_centers.id"))
    district = Column(String, nullable=False)
    
    health_center = relationship("HealthCenter", back_populates="workers")
    reports = relationship("SymptomReport", back_populates="worker")

class HealthCenter(Base):
    __tablename__ = "health_centers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    district = Column(String, nullable=False)
    
    # Inventory for Resource Management Dashboard
    bed_capacity = Column(Integer, default=0)
    ors_stock = Column(Integer, default=0)
    iv_lactate_stock = Column(Integer, default=0)
    paracetamol_stock = Column(Integer, default=0)
    on_duty_doctors = Column(Integer, default=0)
    
    # Geospatial data for Heatmap (Module 1)
    location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)
    
    workers = relationship("Worker", back_populates="health_center")

class SymptomReport(Base):
    __tablename__ = "symptom_reports"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    patient_age = Column(Integer, nullable=True)
    
    # Comma-separated or JSON list of symptoms
    symptoms = Column(String, nullable=False)
    duration_days = Column(Integer, nullable=False)
    
    # Geo-tagging for the GIS Heatmap
    location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)
    
    # Sync status for Module 3 Audit
    sync_status = Column(String, default="ONLINE")
    
    reported_at = Column(DateTime, default=datetime.utcnow)
    
    triage_result = relationship("TriageResult", back_populates="report", uselist=False)
    worker = relationship("Worker", back_populates="reports")

class TriageResult(Base):
    __tablename__ = "triage_results"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("symptom_reports.id"), unique=True)
    risk_level = Column(Enum(RiskLevel), nullable=False)
    guidance_provided = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    report = relationship("SymptomReport", back_populates="triage_result")

class MedicalDocument(Base):
    __tablename__ = "medical_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    source_url = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
