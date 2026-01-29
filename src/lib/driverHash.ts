export function normalizeName(value: string): string {
    return value
      ?.trim()
      .toLowerCase()
      .replace(/\s+/g, " ") || "";
  }
  
  export function buildDriverHash(firstName: string, lastName: string): string {
    // Reverted to the correct logic using both first and last name
    const hashParts = [normalizeName(firstName), normalizeName(lastName)].filter(Boolean);
    return hashParts.join(" ");
  }
  