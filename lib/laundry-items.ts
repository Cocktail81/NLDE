interface LaundryItem {
    key:
      | 'ironing'
      | 'saree_ironing'
      | 'gown'
      | 'dhoti'
      | 'coat_blazer'
      | 'dry_cleaning'
      | 'dress_dc'
      | 'gown_dc'
      | 'coat_blazer_dc'
    label: string
    shortLabel: string
    description: string
  }
  
  export const LAUNDRY_ITEMS = [
    {
      key: 'ironing',
      label: 'Iron',
      shortLabel: 'Iron',
      description: 'Regular clothes ironing',
    },
    {
      key: 'saree_ironing',
      label: 'Saree Iron',
      shortLabel: 'Saree Iron',
      description: 'Saree-specific ironing',
    },
    {
      key: 'gown',
      label: 'Gown',
      shortLabel: 'Gown',
      description: 'Gown ironing / finishing',
    },
    {
      key: 'dhoti',
      label: 'Dhoti',
      shortLabel: 'Dhoti',
      description: 'Dhoti ironing / finishing',
    },
    {
      key: 'coat_blazer',
      label: 'Coat / Blazer',
      shortLabel: 'Coat / Blazer',
      description: 'Coat or blazer ironing / finishing',
    },
    {
      key: 'dry_cleaning',
      label: 'Dry Cleaning',
      shortLabel: 'Dry Cleaning',
      description: 'General dry cleaning service',
    },
    {
      key: 'dress_dc',
      label: 'Dress - Dry Cleaning',
      shortLabel: 'Dress - DC',
      description: 'Dress dry cleaning',
    },
    {
      key: 'gown_dc',
      label: 'Gown - Dry Cleaning',
      shortLabel: 'Gown - DC',
      description: 'Gown dry cleaning',
    },
    {
      key: 'coat_blazer_dc',
      label: 'Coat / Blazer - Dry Cleaning',
      shortLabel: 'Coat / Blazer - DC',
      description: 'Coat or blazer dry cleaning',
    },
  ] as const satisfies readonly LaundryItem[]
  
  export type LaundryItemKey = (typeof LAUNDRY_ITEMS)[number]['key']
  
  export type LaundryItemQuantities = Record<LaundryItemKey, number>
  
  export const EMPTY_LAUNDRY_ITEM_QUANTITIES: LaundryItemQuantities =
    LAUNDRY_ITEMS.reduce((acc, item) => {
      acc[item.key] = 0
      return acc
    }, {} as LaundryItemQuantities)
  
  export function createEmptyLaundryItemQuantities(): LaundryItemQuantities {
    return { ...EMPTY_LAUNDRY_ITEM_QUANTITIES }
  }
  
  export function calculateLaundryTotal(items: Partial<LaundryItemQuantities>) {
    return LAUNDRY_ITEMS.reduce((total, item) => {
      return total + (items[item.key] || 0)
    }, 0)
  }
  
  export function parseLaundryItemQuantities(
    values: Record<LaundryItemKey, string>
  ): LaundryItemQuantities {
    return LAUNDRY_ITEMS.reduce((acc, item) => {
      acc[item.key] = Number.parseInt(values[item.key], 10) || 0
      return acc
    }, {} as LaundryItemQuantities)
  }