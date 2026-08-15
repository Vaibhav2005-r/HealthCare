from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Enum
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import enum

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
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    workers = relationship("Worker", back_populates="health_center")

class SymptomReport(Base):
    __tablename__ = "symptom_reports"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    patient_age = Column(Integer, nullable=True)
    symptoms = Column(String, nullable=False) # JSON or comma-separated
    duration_days = Column(Integer, nullable=False)
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
