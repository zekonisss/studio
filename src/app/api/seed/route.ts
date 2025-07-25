
import { NextResponse } from "next/server";
import { getFirestore, collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import type { UserProfile, Report } from "@/types";

// This is a temporary endpoint to seed the database with initial data.
// It should be removed after the first successful run.

export async function GET() {
  try {
    console.log("Seeding database...");

    // 1. Seed Users
    const adminUser: Omit<UserProfile, 'id'> = {
        email: "admin@drivercheck.lt",
        companyName: "DriverCheck Admin",
        companyCode: "000000000",
        address: "Admin City",
        contactPerson: "Admin User",
        phone: "+37000000000",
        paymentStatus: 'active',
        isAdmin: true,
        agreeToTerms: true,
        registeredAt: serverTimestamp(),
        accountActivatedAt: serverTimestamp(),
        subUsers: [],
    };
    await setDoc(doc(db, "users", "admin-user-001"), adminUser);
    console.log("Seeded admin user.");

    const testClient: Omit<UserProfile, 'id'> = {
        email: "test@drivercheck.lt",
        companyName: 'UAB "Test Client"',
        companyCode: '900123456',
        vatCode: 'LT90012345611',
        address: 'Testo g. 1, Kaunas',
        contactPerson: 'Klientas Testuotojas',
        phone: '+37060000000',
        paymentStatus: 'active',
        isAdmin: false,
        registeredAt: serverTimestamp(),
        accountActivatedAt: serverTimestamp(),
        agreeToTerms: true,
        subUsers: [],
    };
    await setDoc(doc(db, "users", "test-client-001"), testClient);
    console.log("Seeded test client user.");


    // 2. Seed Reports
    const reportsCollection = collection(db, "reports");

    const report1: Omit<Report, 'id' | 'createdAt'> = {
        reporterId: "test-client-001",
        reporterCompanyName: 'UAB "Test Client"',
        fullName: "Jonas Jonaitis",
        nationality: "PL",
        birthYear: 1985,
        category: "fuel_theft",
        tags: ["kuro_vagyste"],
        comment: "Vairuotojas buvo pastebėtas neteisėtai nupylinėjantis kurą.",
        imageUrl: "https://placehold.co/600x400.png",
        dataAiHint: "truck fuel",
        deletedAt: null
    };
    await addDoc(reportsCollection, { ...report1, createdAt: serverTimestamp() });
    
    const report2: Omit<Report, 'id' | 'createdAt'> = {
        reporterId: "admin-user-001",
        reporterCompanyName: 'DriverCheck Admin',
        fullName: "Petras Petraitis",
        nationality: "UA",
        category: "technical_damage",
        tags: ["techninis_neatsakingumas"],
        comment: "Grįžus iš reiso, pastebėta didelė žala priekabos šonui.",
        deletedAt: null
    };
    await addDoc(reportsCollection, { ...report2, createdAt: serverTimestamp() });
    console.log("Seeded 2 reports.");

    // 3. Ensure other collections exist by adding a placeholder document
    await setDoc(doc(collection(db, "auditLogs")), {
        actionKey: "seed",
        adminId: "system",
        adminName: "system",
        details: { note: "Database seeded" },
        timestamp: serverTimestamp(),
    });

     await setDoc(doc(collection(db, "searchLogs")), {
        userId: "system",
        searchText: "seed",
        resultsCount: 0,
        timestamp: serverTimestamp(),
    });

    await setDoc(doc(collection(db, "notifications")), {
        userId: "system",
        type: "generic_message",
        titleKey: "Seeded",
        messageKey: "Database has been seeded.",
        createdAt: serverTimestamp(),
        read: true,
    });
    console.log("Seeded placeholder documents for other collections.");

    return NextResponse.json({ 
        ok: true,
        message: "Database seeded successfully. Please remove the /api/seed route." 
    });

  } catch (error: any) {
    console.error("Error seeding database:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
