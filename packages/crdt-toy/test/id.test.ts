import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { compareId } from "../src/id";
import type { ID } from "../src/types";

describe("compareId (examples)", () => {
  it("orders by clock first", () => {
    expect(
      compareId({ client: "z", clock: 1 }, { client: "a", clock: 2 }),
    ).toBeLessThan(0);
  });

  it("breaks clock ties by client id", () => {
    expect(
      compareId({ client: "a", clock: 5 }, { client: "b", clock: 5 }),
    ).toBeLessThan(0);
    expect(
      compareId({ client: "b", clock: 5 }, { client: "a", clock: 5 }),
    ).toBeGreaterThan(0);
  });

  it("returns 0 only for identical IDs", () => {
    expect(
      compareId({ client: "a", clock: 5 }, { client: "a", clock: 5 }),
    ).toBe(0);
  });
});

// Small value ranges on purpose, so the random IDs collide often and exercise the tiebreak.
const idArb: fc.Arbitrary<ID> = fc.record({
  client: fc.string({ minLength: 1, maxLength: 2 }),
  clock: fc.nat(5),
});

describe("compareId (properties)", () => {
  it("is antisymmetric", () => {
    fc.assert(
      fc.property(idArb, idArb, (a, b) => {
        expect(Math.sign(compareId(a, b)) + Math.sign(compareId(b, a))).toBe(0);
      }),
    );
  });

  it("is zero exactly when both fields are equal", () => {
    fc.assert(
      fc.property(idArb, idArb, (a, b) => {
        const same = a.client === b.client && a.clock === b.clock;
        expect(compareId(a, b) === 0).toBe(same);
      }),
    );
  });

  it("is transitive", () => {
    fc.assert(
      fc.property(idArb, idArb, idArb, (a, b, c) => {
        if (compareId(a, b) <= 0 && compareId(b, c) <= 0) {
          expect(compareId(a, c)).toBeLessThanOrEqual(0);
        }
      }),
    );
  });
});
