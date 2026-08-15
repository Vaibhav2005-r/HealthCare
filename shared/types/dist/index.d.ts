export type UserRole = 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN';
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
}
export interface Patient extends User {
    role: 'PATIENT';
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
    bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    allergies?: string[];
    emergencyContact?: {
        name: string;
        relationship: string;
        phone: string;
    };
}
export interface Doctor extends User {
    role: 'DOCTOR';
    specialization: string;
    licenseNumber: string;
    hospitalAffiliation?: string;
    yearsOfExperience: number;
    consultationFee: number;
    rating?: number;
}
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
export type AppointmentType = 'IN_PERSON' | 'VIDEO' | 'AUDIO' | 'CHAT';
export interface Appointment {
    id: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    specialization: string;
    scheduledAt: string;
    durationMinutes: number;
    type: AppointmentType;
    status: AppointmentStatus;
    notes?: string;
    meetingLink?: string;
}
export interface VitalRecord {
    id: string;
    patientId: string;
    recordedAt: string;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    bloodGlucose?: number;
    bodyTemperature?: number;
    oxygenSaturation?: number;
    respiratoryRate?: number;
    weightKg?: number;
    heightCm?: number;
    bmi?: number;
}
export interface Medication {
    name: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    instructions?: string;
}
export interface Prescription {
    id: string;
    appointmentId?: string;
    patientId: string;
    doctorId: string;
    doctorName: string;
    issuedDate: string;
    medications: Medication[];
    diagnosis: string;
    notes?: string;
}
export interface MedicalRecord {
    id: string;
    patientId: string;
    recordType: 'LAB_REPORT' | 'IMAGING' | 'DISCHARGE_SUMMARY' | 'VACCINATION';
    title: string;
    fileUrl?: string;
    date: string;
    doctorName?: string;
    summary?: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    timestamp: string;
}
export type RiskLevel = 'GREEN' | 'AMBER' | 'RED';
export interface SymptomReport {
    id: string;
    villageId: string;
    diseaseType: 'MALARIA' | 'DENGUE' | 'CHOLERA' | 'UNKNOWN';
    outcome: RiskLevel;
    symptoms: string[];
    patientAge?: number;
    patientGender?: 'M' | 'F' | 'O';
    timestamp: string;
    notes?: string;
}
export interface Forecast {
    date: string;
    villageId: string;
    predictedCases: number;
    riskLevel: RiskLevel;
}
export interface SyncQueueItem {
    id: string;
    operation: 'SUBMIT_REPORT' | 'UPDATE_VITAL' | 'OTHER';
    payload: any;
    status: 'PENDING' | 'SYNCING' | 'FAILED' | 'COMPLETED';
    createdAt: string;
    retryCount: number;
}
//# sourceMappingURL=index.d.ts.map