'use server';

import * as ExcelJS from "exceljs";

export interface ParsedRecord {
  id: number;
  fullName: string;
  company?: string;
  comment: string;
  createdAt: string; 
}

const findHeader = (headers: Record<string, number>, possibleNames: string[]): number | undefined => {
    for (const name of possibleNames) {
      const lowerCaseName = name.trim().toLowerCase();
      const colIndex = headers[lowerCaseName];
      if (colIndex !== undefined) {
        return colIndex;
      }
    }
    return undefined;
};

export async function parseExcelFile(fileBuffer: ArrayBuffer): Promise<{ data?: ParsedRecord[], error?: { title: string, description: string } }> {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return { error: { title: 'Tuščias failas', description: 'Failas nerastas darbaknygėje.' } };
    }

    const headerRow = worksheet.getRow(1);
    const headers: Record<string, number> = {};
    headerRow.eachCell((cell, colNumber) => {
        if (cell.value) {
            headers[String(cell.value).trim().toLowerCase()] = colNumber;
        }
    });
    
    const fullNameCol = findHeader(headers, ['title', 'vardas pavardė', 'full name', 'name']);
    const commentCol = findHeader(headers, ['comment', 'comments', 'komentaras']);
    
    const missingHeaders: string[] = [];
    if (fullNameCol === undefined) missingHeaders.push('Title');
    if (commentCol === undefined) missingHeaders.push('Comment');

    if (missingHeaders.length > 0) {
        return { error: { title: 'Trūksta antraščių', description: `Trūkstamų stulpelių: ${missingHeaders.join(', ')}` } };
    }

    const dateCol = findHeader(headers, ['date', 'data']);
    const companyCol = findHeader(headers, ['company', 'įmonė']);
    
    const parsedRecords: ParsedRecord[] = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const fullName = fullNameCol ? (row.getCell(fullNameCol).value as string || 'Nežinomas vairuotojas') : 'Nežinomas vairuotojas';
        const comment = commentCol ? (row.getCell(commentCol).value as string || '') : '';
        const company = companyCol ? row.getCell(companyCol)?.value as string | undefined : undefined;
        
        const dateValue = dateCol ? row.getCell(dateCol)?.value : undefined;
        const createdAt = dateValue instanceof Date ? dateValue.toISOString() : new Date().toISOString();


        if (fullName && comment) {
            parsedRecords.push({
                id: rowNumber,
                fullName,
                company,
                comment,
                createdAt,
            });
        }
    });

    return { data: parsedRecords };

  } catch (error: any) {
    console.error("Excel parsing server action error:", error);
    return { error: { title: "Serverio klaida", description: "Nepavyko apdoroti failo serveryje." } };
  }
}
