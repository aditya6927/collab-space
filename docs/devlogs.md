# Development Log

## 2026-10-04

### Built

- Defined the core types for the toy CRDT:
  - `ID` identifies an operation using a replica ID and Lamport clock.
  - `Op` represents insert and delete operations.
  - `Replica` defines the interface that different replica implementations must satisfy.
- Implemented deterministic ID ordering using Lamport clock followed by client ID.
- Added property-based tests with `fast-check` for ID ordering.
- Built a simulation harness with three replicas.
- The harness simulates delayed, reordered, and duplicated message delivery.
- Implemented a deliberately incorrect index-based replica to validate that the test harness can detect convergence failures.

### What I learned

A character position is not a stable identity in a distributed system.

An index such as `0` only has meaning relative to the current state of a particular replica. If two replicas independently insert characters at index `0`, they can receive those operations in different orders and end up with different documents.

This is why the real CRDT operations cannot refer to positions. They need stable identities that remain meaningful across replicas.

I also learned that property-based testing is useful for distributed systems because it can generate many different operation and delivery sequences and automatically shrink a failure to a small counterexample.

### Why indexes don't work

Position-based indexes are **local, temporary state**, not stable identifiers. Once replicas make different edits or messages arrive in a different order, the same index can refer to different characters.

#### Concurrent inserts

Suppose replicas A and B both start with:

```text
cat
```

A inserts `x` at index `0`:

```text
xcat
```

B independently inserts `y` at index `0`:

```text
ycat
```

Both operations are:

```text
insert(index=0, value=...)
```

When delivered to the other replica:

```text
A: xcat → yxcat
B: ycat → xycat
```

The replicas diverge because `index=0` does not identify a stable logical position.

#### Moving indexes

Indexes can also point to the wrong character after other operations arrive.

For example, if a replica creates:

```text
delete(index=0)
```

to delete `h` from:

```text
hello
```

but another replica first receives an insertion at index `0`:

```text
!hello
```

then applying `delete(index=0)` deletes `!` instead of `h`.

### Key takeaway

Indexes are useful for **local user interaction**, but not for identifying distributed operations.

The CRDT therefore uses **stable element IDs** such as:

```text
{ client: "r1", clock: 4 }
```

and insert operations refer to another element's ID rather than an array index. Deterministic ordering then allows replicas to resolve concurrent inserts consistently.

```

```
