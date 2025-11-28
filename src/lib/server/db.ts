// This file should not have "use client"
import { Timestamp } from 'firebase/firestore';

export const convertTimestamp = (data: any) => {
  const convertValue = (value: any): any => {
    if (value instanceof Timestamp) {
      return value.toDate().toISOString();
    }
    if (Array.isArray(value)) {
      return value.map(convertValue);
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const newObj: { [key: string]: any } = {};
        for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                newObj[key] = convertValue(value[key]);
            }
        }
        return newObj;
    }
    return value;
  };
  return convertValue(data);
};
