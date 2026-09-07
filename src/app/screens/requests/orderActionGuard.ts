export function createOrderOperationGuard() {
  const activeIds = new Set<number>();
  return {
    begin(id: number) {
      if (activeIds.has(id)) return false;
      activeIds.add(id);
      return true;
    },
    end(id: number) {
      activeIds.delete(id);
    },
    has(id: number) {
      return activeIds.has(id);
    }
  };
}

export type OrderOperationGuard = ReturnType<typeof createOrderOperationGuard>;
