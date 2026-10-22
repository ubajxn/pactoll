/** Small-dataset client query: filters are ANDed; all adapters return full lists. */
export function queryList<T>(
  items: readonly T[],
  options: {
    filters?: ((item: T) => boolean)[];
    compare?: (a: T, b: T) => number;
    page?: number;
    pageSize?: number;
  } = {},
) {
  const filtered = items.filter((item) =>
    (options.filters ?? []).every((filter) => filter(item)),
  );
  if (options.compare) filtered.sort(options.compare);
  const pageSize = Math.max(1, Math.floor(options.pageSize || 25));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(pageCount, Math.max(1, Math.floor(options.page || 1)));
  return {
    items: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    pageSize,
    pageCount,
  };
}
