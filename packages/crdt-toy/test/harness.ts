import fc from "fast-check";
import type { Replica } from "../src/types";

export const NUM_REPLICAS = 3;

/**
 * A run is just data: a list of actions. fast-check generates random lists
 * and, when a run fails, shrinks it to a minimal failing list.
 */
export type Action =
  | { kind: "insert"; replica: number; index: number; char: string }
  | { kind: "delete"; replica: number; index: number }
  // Deliver one message from replica's inbox. If `duplicate`, the message stays in the
  // inbox so it can be delivered again later (duplicate delivery).
  | { kind: "deliver"; replica: number; pick: number; duplicate: boolean };

export const actionArb: fc.Arbitrary<Action> = fc.oneof(
  fc.record({
    kind: fc.constant("insert" as const),
    replica: fc.nat(NUM_REPLICAS - 1),
    index: fc.nat(1000),
    char: fc.constantFrom("a", "b", "c", "x", "y", "z"),
  }),
  fc.record({
    kind: fc.constant("delete" as const),
    replica: fc.nat(NUM_REPLICAS - 1),
    index: fc.nat(1000),
  }),
  fc.record({
    kind: fc.constant("deliver" as const),
    replica: fc.nat(NUM_REPLICAS - 1),
    pick: fc.nat(1000),
    duplicate: fc.boolean(),
  }),
);

/**
 * Simulated network: every local op is queued in every OTHER replica's inbox.
 * "deliver" actions pick a random queued op (so delivery is reordered, delayed, duplicated).
 * At the end everything still queued is delivered, so any replica that is correct must converge.
 */
export function simulate<O>(
  makeReplica: (clientId: string) => Replica<O>,
  actions: Action[],
): Replica<O>[] {
  const replicas = Array.from({ length: NUM_REPLICAS }, (_, i) =>
    makeReplica(`r${i}`),
  );
  const inboxes: O[][] = replicas.map(() => []);

  const broadcast = (from: number, op: O) => {
    inboxes.forEach((inbox, i) => {
      if (i !== from) inbox.push(op);
    });
  };

  for (const a of actions) {
    const r = replicas[a.replica]!;
    if (a.kind === "insert") {
      const index = a.index % (r.text().length + 1);
      broadcast(a.replica, r.insert(index, a.char));
    } else if (a.kind === "delete") {
      const len = r.text().length;
      if (len === 0) continue;
      broadcast(a.replica, r.delete(a.index % len));
    } else {
      const inbox = inboxes[a.replica]!;
      if (inbox.length === 0) continue;
      const i = a.pick % inbox.length;
      const op = inbox[i]!;
      if (!a.duplicate) inbox.splice(i, 1);
      r.receive(op);
    }
  }

  // Final drain: deliver whatever is still queued.
  replicas.forEach((r, i) => {
    for (const op of inboxes[i]!) r.receive(op);
  });
  return replicas;
}

/** True when all replicas show the same text and none has ops stuck waiting. */
export function converged<O>(replicas: Replica<O>[]): boolean {
  const first = replicas[0]!.text();
  return replicas.every((r) => r.text() === first && r.pendingCount() === 0);
}
