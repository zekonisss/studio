'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { buildDriverHash, normalizeName } from '@/lib/driverHash';

interface LogSearchData {
  firstName: string;
  lastName: string;
  userId: string;
}

export async function getDriverSearchStats(
  firstName: string,
  lastName: string
): Promise<{ total: number; recent: number }> {
  
  if (!adminDb) {
    console.error("🔴 ADMIN DB NOT INITIALIZED! Check .env.local and restart the server.");
    return { total: 0, recent: 0 };
  }

  const driverHash = buildDriverHash(firstName, lastName);

  if (!driverHash) {
    console.warn("🟡 driverHash is empty. Returning 0.");
    return { total: 0, recent: 0 };
  }
  
  const logsRef = adminDb.collection('searchLogs');
  const query = logsRef.where('driverHash', '==', driverHash).orderBy('timestamp', 'desc');
  
  try {
    const snapshot = await query.get();

    if (snapshot.empty) {
        return { total: 0, recent: 0 };
    }

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const totalUniqueUserIds = new Set<string>();
    const recentUniqueUserIds = new Set<string>();

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId && data.timestamp) {
            const userId = data.userId;
            const timestamp = data.timestamp.toDate();

            totalUniqueUserIds.add(userId);

            if (timestamp >= sixtyDaysAgo) {
                recentUniqueUserIds.add(userId);
            }
        }
    });
    
    const total = totalUniqueUserIds.size;
    const recent = recentUniqueUserIds.size;

    return { total, recent };
  } catch (error) {
      console.error("Klaida gaunant vairuotojo statistiką:", error);
      return { total: 0, recent: 0 };
  }
}

export async function logSearchActivity(data: LogSearchData) {
  if (!adminDb || !data.userId) return { success: false, error: "System error" };

  const { firstName, lastName, userId } = data;
  const driverHash = buildDriverHash(firstName, lastName);
  
  if (!driverHash || driverHash.trim() === "") return { success: true }; // Don't log empty searches, but don't show error

  const cleanFirst = normalizeName(firstName);
  const cleanLast = normalizeName(lastName);
  const formatName = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  try {
    await adminDb.runTransaction(async (transaction) => {
      const userRef = adminDb.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) throw new Error("Vartotojas nerastas");

      const userData = userDoc.data();
      const isAdmin = userData?.isAdmin === true;
      const isTrial = userData?.paymentStatus === 'trial';
      
      const searchCredits = userData?.searchCredits || 0;

      if (!isAdmin && isTrial && searchCredits <= 0) {
        throw new Error("out_of_credits"); 
      }

      if (!isAdmin && isTrial) {
        transaction.update(userRef, { 
            searchCredits: searchCredits - 1
        });
      }

      const newLogRef = adminDb.collection('searchLogs').doc();
      transaction.set(newLogRef, {
        driverHash,
        firstName: formatName(cleanFirst),
        lastName: formatName(cleanLast),
        searchText: `${formatName(cleanFirst)} ${formatName(cleanLast)}`.trim(),
        userId: userId,
        timestamp: Timestamp.now(),
      });
    });

    return { success: true };

  } catch (error: any) {
    console.error("Klaida:", error);
    const errorMessage = error.message === "out_of_credits" ? "out_of_credits" : "Įvyko klaida";
    return { success: false, error: errorMessage };
  }
}