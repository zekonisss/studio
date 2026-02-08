'use client';

// Define the types needed for the analysis.
// These should match the structure of your mock and future real data.
export interface FineData {
    date: string;
    time: string; // HH:MM format
    amount: string;
    location: string;
    violation: string;
    status: 'Pending' | 'Paid';
}

export interface Activity {
  type: 'DRIVE' | 'WORK' | 'REST' | 'BREAK' | 'UNKNOWN';
  startTime: string; // HH:MM format
  duration: number; // in minutes
}

export interface AnalysisResult {
    status: 'CONFLICT' | 'MATCH' | 'ERROR' | 'NONE';
    message: string;
}

/**
 * Converts a time string (HH:MM) to the total number of minutes from midnight.
 * @param time The time string to convert.
 * @returns Total minutes from midnight.
 */
const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
        return -1; // Invalid format
    }
    return hours * 60 + minutes;
};

/**
 * Checks if a specific time falls within a given activity slot.
 * @param targetTime The time of the fine (HH:MM).
 * @param startTime The start time of the activity (HH:MM).
 * @param durationMinutes The duration of the activity in minutes.
 * @returns True if the time is within the slot, false otherwise.
 */
const isTimeInSlot = (targetTime: string, startTime: string, durationMinutes: number): boolean => {
    const target = timeToMinutes(targetTime);
    const start = timeToMinutes(startTime);

    if (target < 0 || start < 0) {
        return false; // Handle invalid time formats gracefully
    }

    const end = start + durationMinutes;
    return target >= start && target < end;
};

/**
 * Analyzes a fine against a driver's tacho activities to find discrepancies.
 * @param fine The fine data object.
 * @param activities An array of tacho activity objects for a 24-hour period.
 * @returns An AnalysisResult object with the status and a descriptive message.
 */
export const analyzeDiscrepancy = (fine: FineData, activities: Activity[]): AnalysisResult => {
    for (const activity of activities) {
        if (isTimeInSlot(fine.time, activity.startTime, activity.duration)) {
            switch (activity.type) {
                case 'REST':
                case 'BREAK':
                case 'UNKNOWN':
                    return {
                        status: 'CONFLICT',
                        message: `Užfiksuotas neatitikimas: Baudos laikas (${fine.time}) patenka į '${activity.type}' periodą. Rekomenduojama apeliacija.`,
                    };
                case 'DRIVE':
                case 'WORK':
                    return {
                        status: 'MATCH',
                        message: `Duomenys sutampa: Baudos laikas (${fine.time}) sutampa su aktyvia veikla ('${activity.type}').`,
                    };
                default:
                    // This case should not be reached if types are correct
                    continue;
            }
        }
    }

    return {
        status: 'ERROR',
        message: 'Nepavyko nustatyti veiklos baudos fiksavimo metu. Patikrinkite Tacho failo duomenis.',
    };
};
