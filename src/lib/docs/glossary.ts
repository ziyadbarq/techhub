/**
 * Documentation Glossary
 * Internal terminology mapping for search enhancement
 *
 * Maps canonical terms to their aliases/synonyms
 * When searching, queries are expanded to include related terms
 */

/**
 * Glossary mapping: canonical term -> array of aliases
 */
export const DOCS_GLOSSARY: Record<string, string[]> = {
  // Core Entities
  asset: ["device", "equipment", "hardware", "machine", "item"],
  person: ["employee", "staff", "user", "team member", "worker"],
  vendor: ["supplier", "provider", "partner", "contractor"],
  location: ["site", "building", "office", "branch", "facility"],

  // ITAM/CMDB Terms
  CI: ["configuration item", "CMDB item", "component", "config item"],
  CMDB: [
    "configuration management database",
    "config database",
    "inventory system",
  ],
  ITAM: ["IT asset management", "asset management", "inventory management"],
  lifecycle: ["status", "state", "workflow stage", "phase"],

  // License Management
  license: ["software license", "subscription", "seat", "entitlement"],
  entitlement: ["license entitlement", "allocation", "seat"],
  allocation: ["license allocation", "assignment", "distribution"],

  // Organizational Terms
  department: ["org unit", "organization unit", "team", "division"],
  role: ["job role", "position", "title", "function"],
  permission: ["access", "privilege", "right", "authorization"],
  RBAC: [
    "role-based access control",
    "access control",
    "permissions",
    "authorization",
  ],

  // Financial/Compliance
  warranty: ["guarantee", "support contract", "coverage"],
  contract: ["agreement", "SLA", "service agreement", "deal"],
  cost: ["price", "expense", "value", "amount"],
  SAR: ["Saudi Riyal", "riyal", "currency"],

  // Barq-Specific
  SAMA: [
    "Saudi Central Bank",
    "regulator",
    "compliance",
    "Saudi Arabia Monetary Agency",
  ],
  Barq: ["company", "organization", "our"],

  // Technical Terms
  API: ["endpoint", "interface", "integration", "service"],
  import: ["upload", "bulk import", "data import", "migration"],
  export: ["download", "extract", "report"],

  // Actions
  create: ["add", "new", "register", "onboard"],
  update: ["edit", "modify", "change"],
  delete: ["remove", "deactivate", "retire"],
  assign: ["allocate", "give", "transfer", "link"],
  search: ["find", "lookup", "query", "filter"],
};

/**
 * Expand a search query using the glossary
 * Returns an array of search terms including the original and any aliases
 *
 * @param query - The original search query
 * @returns Array of expanded search terms
 */
export function expandSearchQuery(query: string): string[] {
  const terms = new Set<string>();
  const lowerQuery = query.toLowerCase();

  // Add original query
  terms.add(lowerQuery);

  // Split into words for individual term matching
  const words = lowerQuery.split(/\s+/);

  for (const word of words) {
    // Check if word is a canonical term
    if (word in DOCS_GLOSSARY) {
      DOCS_GLOSSARY[word].forEach((alias) => terms.add(alias.toLowerCase()));
    }

    // Check if word is an alias
    for (const [canonical, aliases] of Object.entries(DOCS_GLOSSARY)) {
      if (aliases.some((alias) => alias.toLowerCase().includes(word))) {
        terms.add(canonical.toLowerCase());
        aliases.forEach((alias) => terms.add(alias.toLowerCase()));
      }
    }
  }

  return Array.from(terms);
}

/**
 * Get the canonical term for an alias
 * @param term - The term to look up
 * @returns The canonical term, or the original term if not found
 */
export function getCanonicalTerm(term: string): string {
  const lowerTerm = term.toLowerCase();

  // Check if it's already canonical
  if (lowerTerm in DOCS_GLOSSARY) {
    return lowerTerm;
  }

  // Search for it in aliases
  for (const [canonical, aliases] of Object.entries(DOCS_GLOSSARY)) {
    if (aliases.some((alias) => alias.toLowerCase() === lowerTerm)) {
      return canonical;
    }
  }

  return term;
}

/**
 * Check if a text matches any glossary terms
 * @param text - Text to check
 * @param searchTerms - Expanded search terms
 * @returns True if any term is found in text
 */
export function matchesGlossaryTerms(
  text: string,
  searchTerms: string[],
): boolean {
  const lowerText = text.toLowerCase();
  return searchTerms.some((term) => lowerText.includes(term));
}
