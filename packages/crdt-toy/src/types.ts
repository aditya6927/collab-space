/** Globally unique ID of one character: which replica made it, and that replica's Lamport clock. */
export type ID = { client: string; clock: number };

/** Operations of the real (RGA) CRDT. No indexes anywhere: only IDs. */
export type Op =
  | { type: "insert"; id: ID; left: ID | null; value: string }
  | { type: "delete"; target: ID };

/** Anything the test harness can drive. `O` is that implementation's operation type. */
export interface Replica<O> {
  readonly clientId: string;
  /** Local insert at a visible index (0..text().length). Returns the op to broadcast. */
  insert(index: number, value: string): O;
  /** Local delete of the visible character at `index`. Returns the op to broadcast. */
  delete(index: number): O;
  /** Apply an op from another replica. */
  receive(op: O): void;
  /** The visible document text. */
  text(): string;
  /** Received ops still waiting on a missing dependency. */
  pendingCount(): number;
}
