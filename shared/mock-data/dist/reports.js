const generateTimestamp = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
};
export const mockReports = [
    { id: 'rep-01', villageId: 'v1-kipeto', diseaseType: 'MALARIA', outcome: 'AMBER', symptoms: ['Fever', 'Chills'], patientAge: 34, patientGender: 'M', timestamp: generateTimestamp(0) },
    { id: 'rep-02', villageId: 'v1-kipeto', diseaseType: 'DENGUE', outcome: 'RED', symptoms: ['High Fever', 'Joint Pain', 'Rash'], patientAge: 28, patientGender: 'F', timestamp: generateTimestamp(1) },
    { id: 'rep-03', villageId: 'v1-kipeto', diseaseType: 'MALARIA', outcome: 'GREEN', symptoms: ['Mild Fever'], patientAge: 12, patientGender: 'M', timestamp: generateTimestamp(2) },
    { id: 'rep-04', villageId: 'v2-shika', diseaseType: 'CHOLERA', outcome: 'RED', symptoms: ['Severe Diarrhea', 'Dehydration'], patientAge: 45, patientGender: 'M', timestamp: generateTimestamp(0) },
    { id: 'rep-05', villageId: 'v2-shika', diseaseType: 'CHOLERA', outcome: 'AMBER', symptoms: ['Diarrhea', 'Nausea'], patientAge: 22, patientGender: 'F', timestamp: generateTimestamp(1) },
    { id: 'rep-06', villageId: 'v2-shika', diseaseType: 'MALARIA', outcome: 'GREEN', symptoms: ['Fatigue'], patientAge: 55, patientGender: 'O', timestamp: generateTimestamp(3) },
    { id: 'rep-07', villageId: 'v3-mlima', diseaseType: 'DENGUE', outcome: 'AMBER', symptoms: ['Fever', 'Headache'], patientAge: 19, patientGender: 'F', timestamp: generateTimestamp(0) },
    { id: 'rep-08', villageId: 'v3-mlima', diseaseType: 'MALARIA', outcome: 'GREEN', symptoms: ['Low Fever'], patientAge: 8, patientGender: 'M', timestamp: generateTimestamp(1) },
    { id: 'rep-09', villageId: 'v3-mlima', diseaseType: 'CHOLERA', outcome: 'RED', symptoms: ['Vomiting', 'Muscle Cramps'], patientAge: 31, patientGender: 'M', timestamp: generateTimestamp(2) },
    { id: 'rep-10', villageId: 'v4-ziwa', diseaseType: 'MALARIA', outcome: 'RED', symptoms: ['High Fever', 'Convulsions'], patientAge: 4, patientGender: 'F', timestamp: generateTimestamp(0) },
    { id: 'rep-11', villageId: 'v4-ziwa', diseaseType: 'MALARIA', outcome: 'AMBER', symptoms: ['Fever', 'Sweating'], patientAge: 27, patientGender: 'M', timestamp: generateTimestamp(1) },
    { id: 'rep-12', villageId: 'v4-ziwa', diseaseType: 'DENGUE', outcome: 'GREEN', symptoms: ['Mild Headache'], patientAge: 38, patientGender: 'F', timestamp: generateTimestamp(2) },
    { id: 'rep-13', villageId: 'v4-ziwa', diseaseType: 'DENGUE', outcome: 'AMBER', symptoms: ['Fever', 'Eye Pain'], patientAge: 42, patientGender: 'M', timestamp: generateTimestamp(4) },
    { id: 'rep-14', villageId: 'v5-bonde', diseaseType: 'CHOLERA', outcome: 'GREEN', symptoms: ['Mild Nausea'], patientAge: 61, patientGender: 'F', timestamp: generateTimestamp(0) },
    { id: 'rep-15', villageId: 'v5-bonde', diseaseType: 'MALARIA', outcome: 'AMBER', symptoms: ['Chills', 'Fever'], patientAge: 16, patientGender: 'M', timestamp: generateTimestamp(1) },
    { id: 'rep-16', villageId: 'v5-bonde', diseaseType: 'DENGUE', outcome: 'RED', symptoms: ['Severe Bleeding', 'Shock'], patientAge: 50, patientGender: 'M', timestamp: generateTimestamp(1) },
    { id: 'rep-17', villageId: 'v5-bonde', diseaseType: 'MALARIA', outcome: 'GREEN', symptoms: ['Fatigue'], patientAge: 24, patientGender: 'F', timestamp: generateTimestamp(2) },
    { id: 'rep-18', villageId: 'v1-kipeto', diseaseType: 'CHOLERA', outcome: 'AMBER', symptoms: ['Stomach Ache'], patientAge: 33, patientGender: 'M', timestamp: generateTimestamp(5) },
    { id: 'rep-19', villageId: 'v2-shika', diseaseType: 'DENGUE', outcome: 'GREEN', symptoms: ['Rash'], patientAge: 7, patientGender: 'F', timestamp: generateTimestamp(6) },
    { id: 'rep-20', villageId: 'v3-mlima', diseaseType: 'MALARIA', outcome: 'RED', symptoms: ['Fever', 'Confusion'], patientAge: 68, patientGender: 'M', timestamp: generateTimestamp(2) },
];
