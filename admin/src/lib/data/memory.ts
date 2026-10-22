import type { Member } from "./contracts";
import { createDataService } from "./service";
import { emptyState, type Store } from "./store";

// Explicit, isolated fixtures for tests only.
export function createMemoryAdapter({
  members = [],
}: {
  members?: Member[];
} = {}) {
  let state = emptyState();
  state.members = new Map(
    members.map((member) => [member.id, structuredClone(member)]),
  );
  const store: Store = {
    read: (fn) => structuredClone(fn(state)),
    write: (fn) => {
      const next = structuredClone(state);
      const result = fn(next);
      state = next;
      return structuredClone(result);
    },
  };
  return createDataService(store);
}
