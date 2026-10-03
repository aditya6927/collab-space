import type { ID } from "./types";

/**
 * Total order on IDs: by Lamport clock first, then by client id.
 * Every replica must get the same answer for the same two IDs, so we compare
 * client strings with < and > (NOT localeCompare, which depends on the machine's locale).
 */
export function compareId(a: ID, b: ID): number {
  if (a.clock !== b.clock) return a.clock - b.clock;
  if (a.client === b.client) return 0;
  return a.client < b.client ? -1 : 1;
}

export function idEquals(a: ID, b: ID): boolean {
  return a.clock === b.clock && a.client === b.client;
}

/** String key for using an ID in a Map/Set. */
export function idKey(id: ID): string {
  return `${id.client}:${id.clock}`;
}
