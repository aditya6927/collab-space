import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { NaiveReplica } from "../src/naive";
import { actionArb, simulate, converged } from "./harness";

describe("test harness", () => {
  it("catches divergence: the naive index-based replica does NOT converge", () => {
    const result = fc.check(
      fc.property(fc.array(actionArb, { maxLength: 100 }), (actions) =>
        converged(simulate((id) => new NaiveReplica(id), actions)),
      ),
      { numRuns: 500 },
    );
    expect(result.failed).toBe(true); // fast-check found a counterexample
  });

  it("a single replica trivially converges with itself", () => {
    const r = new NaiveReplica("solo");
    r.insert(0, "h");
    r.insert(1, "i");
    expect(r.text()).toBe("hi");
  });
});
