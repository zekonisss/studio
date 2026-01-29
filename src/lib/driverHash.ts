export function normalizeName(value: string): string {
    return value
      ?.trim()
      .toLowerCase()
      .replace(/\s+/g, " ") || "";
  }
  
  export function buildDriverHash(firstName: string, lastName: string): string {
    // TEMPORARY DIAGNOSTIC: Only use the first name to create the hash
    // to isolate if the issue is with the lastName or the join operation.
    const hashParts = [normalizeName(firstName)].filter(Boolean);
    return hashParts.join(" ");
  }
  