import { Injectable, signal, computed } from '@angular/core';
import { ItemMaster, ItemStatus, ItemType } from './item.models';
import { INITIAL_ITEMS } from './item.mock';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  private initialItems: ItemMaster[] = INITIAL_ITEMS;

  items = signal<ItemMaster[]>(this.initialItems);
  deletedItems = signal<ItemMaster[]>([]);
  currentIndex = signal<number>(4); // default points to item 5 (index 4) matching the < 5 > sketch!

  totalCount = computed(() => this.items().length);

  currentItem = computed(() => {
    const list = this.items();
    const idx = this.currentIndex();
    if (idx >= 0 && idx < list.length) {
      return list[idx];
    }
    return list[0] || null;
  });

  // SKU generator
  generateSku(category: string = 'Item'): string {
    const prefix = category ? category.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'ITM') : 'ITM';
    const num = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${num}`;
  }

  // Generate Barcode
  generateBarcode(): string {
    const rnd = Math.floor(100000000000 + Math.random() * 900000000000);
    return `629${rnd.toString().substring(0, 10)}`;
  }

  goToNext(): void {
    if (this.currentIndex() < this.totalCount() - 1) {
      this.currentIndex.update((i) => i + 1);
    }
  }

  goToPrev(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.update((i) => i - 1);
    }
  }

  goToIndex(idx: number): void {
    if (idx >= 0 && idx < this.totalCount()) {
      this.currentIndex.set(idx);
    }
  }

  addItem(item: ItemMaster): void {
    this.items.update((list) => [item, ...list]);
    this.currentIndex.set(0);
  }

  updateItem(index: number, updated: ItemMaster): void {
    this.items.update((list) => {
      const copy = [...list];
      if (index >= 0 && index < copy.length) {
        copy[index] = { ...updated, updatedAt: new Date().toISOString() };
      }
      return copy;
    });
  }

  deleteCurrentItem(): void {
    const idx = this.currentIndex();
    const cur = this.items()[idx];
    if (cur) {
      this.deletedItems.update((d) => [{ ...cur, updatedAt: new Date().toISOString() }, ...d]);
    }
    this.items.update((list) => list.filter((_, i) => i !== idx));
    if (this.currentIndex() >= this.items().length) {
      this.currentIndex.set(Math.max(0, this.items().length - 1));
    }
  }

  deleteItemById(itemId: string): void {
    const target = this.items().find((it) => it.itemId === itemId);
    if (target) {
      this.deletedItems.update((d) => [{ ...target, updatedAt: new Date().toISOString() }, ...d]);
    }
    this.items.update((list) => list.filter((item) => item.itemId !== itemId));
    if (this.currentIndex() >= this.items().length) {
      this.currentIndex.set(Math.max(0, this.items().length - 1));
    }
  }

  bulkDeleteItems(itemIds: string[]): void {
    const targets = this.items().filter((it) => itemIds.includes(it.itemId));
    if (targets.length) {
      this.deletedItems.update((d) => [...targets.map((t) => ({ ...t, updatedAt: new Date().toISOString() })), ...d]);
    }
    this.items.update((list) => list.filter((item) => !itemIds.includes(item.itemId)));
    if (this.currentIndex() >= this.items().length) {
      this.currentIndex.set(Math.max(0, this.items().length - 1));
    }
  }

  restoreItem(itemId: string): void {
    const target = this.deletedItems().find((it) => it.itemId === itemId);
    if (target) {
      this.deletedItems.update((d) => d.filter((it) => it.itemId !== itemId));
      this.items.update((list) => [target, ...list]);
    }
  }

  restoreAllItems(): void {
    const toRestore = this.deletedItems();
    if (toRestore.length > 0) {
      this.items.update((list) => [...toRestore, ...list]);
      this.deletedItems.set([]);
    }
    if (this.items().length === 0) {
      this.items.set([...this.initialItems]);
    }
  }

  deletePermanently(itemId: string): void {
    this.deletedItems.update((d) => d.filter((it) => it.itemId !== itemId));
  }

  emptyRecycleBin(): void {
    this.deletedItems.set([]);
  }

  resetToInitialItems(): void {
    this.items.set([...this.initialItems]);
    this.deletedItems.set([]);
  }

  toggleItemStatus(itemId: string): void {
    this.items.update((list) =>
      list.map((item) => {
        if (item.itemId === itemId) {
          const newStatus = item.status === 'Active' ? 'Inactive' : 'Active';
          return { ...item, status: newStatus, updatedAt: new Date().toISOString() };
        }
        return item;
      })
    );
  }

  updateItemById(itemId: string, patch: Partial<ItemMaster>): void {
    this.items.update((list) =>
      list.map((item) => {
        if (item.itemId === itemId) {
          const updated: ItemMaster = { ...item, ...patch, updatedAt: new Date().toISOString() };
          if (patch.salesPrice !== undefined || patch.costPrice !== undefined) {
            const sp = Number(updated.salesPrice) || 0;
            const cp = Number(updated.costPrice) || 0;
            updated.marginPct = sp > 0 ? Math.round(((sp - cp) / sp) * 100 * 100) / 100 : 0;
          }
          return updated;
        }
        return item;
      })
    );
  }
}
