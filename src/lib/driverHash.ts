export function normalizeName(value: string): string {
    return value
      ?.trim()
      .toLowerCase()
      .replace(/\s+/g, " ") || "";
  }
  
  export function buildDriverHash(firstName: string, lastName: string): string {
    const hashParts = [normalizeName(firstName), normalizeName(lastName)].filter(Boolean);
    return hashParts.join(" ");
  }
  