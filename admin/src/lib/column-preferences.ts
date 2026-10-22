export type ColumnPreferences = { order: string[]; hidden: string[] };

export function normalizeColumns(
  value: unknown,
  ids: string[],
  defaultHidden: string[] = [],
): ColumnPreferences {
  const saved =
    value && typeof value === "object"
      ? (value as Partial<ColumnPreferences>)
      : {};
  const order = Array.isArray(saved.order)
    ? saved.order.filter(
        (id): id is string => typeof id === "string" && ids.includes(id),
      )
    : [];
  const hidden = Array.isArray(saved.hidden)
    ? saved.hidden.filter(
        (id): id is string => typeof id === "string" && ids.includes(id),
      )
    : defaultHidden;
  const uniqueOrder = [...new Set([...order, ...ids])];
  const uniqueHidden = [...new Set(hidden)];
  return {
    order: uniqueOrder,
    hidden:
      uniqueHidden.length < ids.length
        ? uniqueHidden
        : uniqueHidden.filter((id) => id !== uniqueOrder[0]),
  };
}

export function moveColumn(
  preferences: ColumnPreferences,
  source: string,
  target: string,
): ColumnPreferences {
  if (
    source === target ||
    !preferences.order.includes(source) ||
    !preferences.order.includes(target)
  )
    return preferences;
  const order = preferences.order.filter((id) => id !== source);
  order.splice(preferences.order.indexOf(target), 0, source);
  return { ...preferences, order };
}

/** Restore the primary column to the front; fixed tables ignore saved order. */
export function constrainColumnOrder(
  preferences: ColumnPreferences,
  ids: string[],
  reorderable = true,
): ColumnPreferences {
  return {
    ...preferences,
    order: reorderable
      ? [ids[0], ...preferences.order.filter((id) => id !== ids[0])].filter(
          (id): id is string => id !== undefined,
        )
      : [...ids],
  };
}
