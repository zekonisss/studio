"use client";

import { storage as fbStorage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- File Management ---
export async function uploadReportImage(file: File): Promise<{ url: string }> {
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const fileExtension = file.name.split('.').pop();
    const storageRef = ref(fbStorage, `reports/${fileId}.${fileExtension}`);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    return {
        url: downloadURL,
    };
}
