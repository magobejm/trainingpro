export function toOutput(item: Record<string, unknown>) {
  const createdAt = item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt;
  const updatedAt = item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt;
  return {
    ...item,
    createdAt,
    updatedAt,
  };
}
