import type { Replica } from "./types";

/** Index-based ops. This is the WRONG design on purpose: an index means different things on different replicas. */
export type NaiveOp =
  | { type: "insert"; index: number; value: string }
  | { type: "delete"; index: number };

export class NaiveReplica implements Replica<NaiveOp> {
  private chars: string[] = [];

  constructor(readonly clientId: string) {}

  insert(index: number, value: string): NaiveOp {
    this.chars.splice(index, 0, value);
    return { type: "insert", index, value };
  }

  delete(index: number): NaiveOp {
    this.chars.splice(index, 1);
    return { type: "delete", index };
  }

  receive(op: NaiveOp): void {
    if (op.type === "insert") {
      this.chars.splice(Math.min(op.index, this.chars.length), 0, op.value);
    } else if (op.index < this.chars.length) {
      this.chars.splice(op.index, 1);
    }
  }

  text(): string {
    return this.chars.join("");
  }

  pendingCount(): number {
    return 0;
  }
}
