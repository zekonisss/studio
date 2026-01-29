export function normalizeName(value: string): string {
    return value
      ?.trim()
      .toLowerCase()
      .replace(/\s+/g, " ") || "";
  }
  
  export function buildDriverHash(firstName: string, lastName: string): string {
    return `${normalizeName(firstName)}_${normalizeName(lastName)}`;
  }
  