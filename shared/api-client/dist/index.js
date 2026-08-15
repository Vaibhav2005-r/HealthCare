import { mockReports, mockForecasts } from '@smarthealth/mock-data';
// Helper to simulate network delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let reportsState = [...mockReports];
let syncQueueState = [];
export const getReports = async () => {
    await delay(800);
    return [...reportsState].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};
export const getForecast = async (villageId) => {
    await delay(600);
    return mockForecasts.filter((f) => f.villageId === villageId);
};
export const submitReport = async (reportData) => {
    await delay(1200);
    const newReport = {
        id: `rep-new-${Date.now()}`,
        villageId: reportData.villageId || 'unknown',
        diseaseType: reportData.diseaseType || 'UNKNOWN',
        outcome: reportData.outcome || 'GREEN',
        symptoms: reportData.symptoms || [],
        patientAge: reportData.patientAge,
        patientGender: reportData.patientGender,
        timestamp: new Date().toISOString(),
        notes: reportData.notes,
    };
    reportsState = [newReport, ...reportsState];
    return newReport;
};
export const getSyncQueue = async () => {
    await delay(300);
    return [...syncQueueState];
};
export const askAssistant = async (query) => {
    await delay(1500);
    if (query.toLowerCase().includes('cholera')) {
        return "Based on the recent data, there's a localized spike of Cholera in Shika. I recommend dispatching hydration kits.";
    }
    return "I've analyzed the recent reports. Overall risk is stable, though Bonde has seen a slight increase in Dengue cases.";
};
