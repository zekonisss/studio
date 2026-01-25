'use server';

import { categorizeReport } from '@/ai/flows/categorize-report-flow';

export async function categorizeReportAction(comment: string) {
  // Server-side, kviečia server-only AI funkciją
  return categorizeReport({ comment });
}
