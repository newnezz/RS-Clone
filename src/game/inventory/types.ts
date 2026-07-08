export const ItemId = {
  Logs: 'logs',
  CopperOre: 'copper_ore',
} as const;

export type ItemId = (typeof ItemId)[keyof typeof ItemId];

export interface ItemDefinition {
  name: string;
  stackable: boolean;
}

export const ITEM_DEFINITIONS: Record<ItemId, ItemDefinition> = {
  [ItemId.Logs]: { name: 'Logs', stackable: true },
  [ItemId.CopperOre]: { name: 'Copper ore', stackable: true },
};

export interface InventorySlot {
  itemId: ItemId;
  quantity: number;
}

export type Inventory = (InventorySlot | null)[];

export const INVENTORY_SIZE = 28;

export function createInventory(): Inventory {
  return Array.from({ length: INVENTORY_SIZE }, () => null);
}

export function countItem(inventory: Inventory, itemId: ItemId): number {
  return inventory.reduce((total, slot) => {
    if (slot?.itemId === itemId) {
      return total + slot.quantity;
    }
    return total;
  }, 0);
}

export function countUsedSlots(inventory: Inventory): number {
  return inventory.filter((slot) => slot !== null).length;
}

export function addItem(
  inventory: Inventory,
  itemId: ItemId,
  quantity: number,
): { success: boolean; added: number } {
  if (quantity <= 0) {
    return { success: false, added: 0 };
  }

  const definition = ITEM_DEFINITIONS[itemId];
  let remaining = quantity;

  if (definition.stackable) {
    for (const slot of inventory) {
      if (remaining <= 0) {
        break;
      }
      if (slot?.itemId === itemId) {
        slot.quantity += remaining;
        return { success: true, added: quantity };
      }
    }
  }

  while (remaining > 0) {
    const emptyIndex = inventory.findIndex((slot) => slot === null);
    if (emptyIndex === -1) {
      return { success: remaining < quantity, added: quantity - remaining };
    }

    inventory[emptyIndex] = { itemId, quantity: 1 };
    remaining--;
  }

  return { success: true, added: quantity };
}

export function removeItem(inventory: Inventory, itemId: ItemId, quantity: number): boolean {
  if (quantity <= 0) {
    return false;
  }

  let remaining = quantity;

  for (let i = inventory.length - 1; i >= 0; i--) {
    const slot = inventory[i];
    if (!slot || slot.itemId !== itemId) {
      continue;
    }

    if (slot.quantity <= remaining) {
      remaining -= slot.quantity;
      inventory[i] = null;
    } else {
      slot.quantity -= remaining;
      remaining = 0;
    }

    if (remaining === 0) {
      return true;
    }
  }

  return false;
}

export function formatInventorySummary(inventory: Inventory): string {
  const counts = new Map<ItemId, number>();

  for (const slot of inventory) {
    if (!slot) {
      continue;
    }
    counts.set(slot.itemId, (counts.get(slot.itemId) ?? 0) + slot.quantity);
  }

  if (counts.size === 0) {
    return 'Inventory empty';
  }

  return [...counts.entries()]
    .map(([itemId, quantity]) => `${ITEM_DEFINITIONS[itemId].name} x${quantity}`)
    .join(' · ');
}
