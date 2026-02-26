
/**
 * City-level network mapping based on zip code ranges.
 * Each network corresponds to a specific city/metro area and its zip codes.
 * Partners are auto-assigned a network based on their organization zip.
 * Providers inherit their network from their assigned partner.
 */

export interface NetworkInfo {
  name: string;
  code: string;
  city: string;
  state: string;
}

// Zip prefix ranges mapped to city-level networks
const NETWORK_MAP: { minZip: number; maxZip: number; network: NetworkInfo }[] = [
  // Louisiana
  { minZip: 70801, maxZip: 70836, network: { name: "Baton Rouge Network", code: "BR-001", city: "Baton Rouge", state: "LA" } },
  { minZip: 70501, maxZip: 70599, network: { name: "Lafayette Network", code: "LAF-002", city: "Lafayette", state: "LA" } },
  { minZip: 70112, maxZip: 70195, network: { name: "New Orleans Network", code: "NOLA-003", city: "New Orleans", state: "LA" } },
  { minZip: 71101, maxZip: 71137, network: { name: "Shreveport Network", code: "SHV-004", city: "Shreveport", state: "LA" } },
  { minZip: 70601, maxZip: 70669, network: { name: "Lake Charles Network", code: "LC-005", city: "Lake Charles", state: "LA" } },
  { minZip: 71201, maxZip: 71292, network: { name: "Monroe Network", code: "MON-006", city: "Monroe", state: "LA" } },
  { minZip: 70301, maxZip: 70399, network: { name: "Houma-Thibodaux Network", code: "HT-007", city: "Houma", state: "LA" } },
  { minZip: 71301, maxZip: 71399, network: { name: "Alexandria Network", code: "ALX-008", city: "Alexandria", state: "LA" } },

  // Texas
  { minZip: 77001, maxZip: 77299, network: { name: "Houston Network", code: "HOU-009", city: "Houston", state: "TX" } },
  { minZip: 75201, maxZip: 75398, network: { name: "Dallas Network", code: "DAL-010", city: "Dallas", state: "TX" } },
  { minZip: 78201, maxZip: 78299, network: { name: "San Antonio Network", code: "SA-011", city: "San Antonio", state: "TX" } },
  { minZip: 73301, maxZip: 73399, network: { name: "Austin Network", code: "AUS-012", city: "Austin", state: "TX" } },

  // Mississippi
  { minZip: 39201, maxZip: 39296, network: { name: "Jackson MS Network", code: "JXN-013", city: "Jackson", state: "MS" } },

  // Alabama
  { minZip: 35201, maxZip: 35298, network: { name: "Birmingham Network", code: "BHM-014", city: "Birmingham", state: "AL" } },
  { minZip: 36601, maxZip: 36695, network: { name: "Mobile Network", code: "MOB-015", city: "Mobile", state: "AL" } },

  // Georgia
  { minZip: 30301, maxZip: 30399, network: { name: "Atlanta Network", code: "ATL-016", city: "Atlanta", state: "GA" } },

  // New York
  { minZip: 10001, maxZip: 10299, network: { name: "New York City Network", code: "NYC-017", city: "New York", state: "NY" } },

  // Illinois
  { minZip: 60601, maxZip: 60699, network: { name: "Chicago Network", code: "CHI-018", city: "Chicago", state: "IL" } },

  // California
  { minZip: 90001, maxZip: 90099, network: { name: "Los Angeles Network", code: "LA-019", city: "Los Angeles", state: "CA" } },
  { minZip: 94101, maxZip: 94199, network: { name: "San Francisco Network", code: "SF-020", city: "San Francisco", state: "CA" } },
];

/**
 * Look up a city-level network based on a 5-digit zip code.
 * Returns null if no matching network is found.
 */
export const getNetworkFromZip = (zip: string): NetworkInfo | null => {
  if (!zip || zip.length < 5) return null;
  const zipNum = parseInt(zip.substring(0, 5), 10);
  if (isNaN(zipNum)) return null;

  for (const entry of NETWORK_MAP) {
    if (zipNum >= entry.minZip && zipNum <= entry.maxZip) {
      return entry.network;
    }
  }
  return null;
};

/**
 * Fallback: returns a generic network when zip doesn't match any known city.
 */
export const getNetworkFromZipWithFallback = (zip: string): NetworkInfo => {
  const result = getNetworkFromZip(zip);
  if (result) return result;
  return { name: "Unassigned Network", code: "UN-000", city: "Unknown", state: "" };
};
