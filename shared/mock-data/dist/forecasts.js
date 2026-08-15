const getFutureDate = (daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
};
const generateVillageForecast = (villageId, baseCases, riskPattern) => {
    return riskPattern.map((risk, index) => {
        let predicted = baseCases;
        if (risk === 'AMBER')
            predicted += Math.floor(Math.random() * 10) + 5;
        if (risk === 'RED')
            predicted += Math.floor(Math.random() * 20) + 15;
        if (risk === 'GREEN')
            predicted = Math.max(0, predicted - Math.floor(Math.random() * 5));
        return {
            date: getFutureDate(index),
            villageId,
            predictedCases: predicted,
            riskLevel: risk,
        };
    });
};
export const mockForecasts = [
    ...generateVillageForecast('v1-kipeto', 12, ['GREEN', 'GREEN', 'AMBER', 'AMBER', 'RED', 'RED', 'AMBER']),
    ...generateVillageForecast('v2-shika', 25, ['RED', 'RED', 'AMBER', 'AMBER', 'GREEN', 'GREEN', 'GREEN']),
    ...generateVillageForecast('v3-mlima', 5, ['GREEN', 'GREEN', 'GREEN', 'GREEN', 'GREEN', 'AMBER', 'GREEN']),
    ...generateVillageForecast('v4-ziwa', 18, ['AMBER', 'AMBER', 'AMBER', 'RED', 'RED', 'AMBER', 'GREEN']),
    ...generateVillageForecast('v5-bonde', 8, ['GREEN', 'AMBER', 'AMBER', 'AMBER', 'AMBER', 'RED', 'RED']),
];
