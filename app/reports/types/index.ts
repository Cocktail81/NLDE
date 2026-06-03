// ============================================
// SHARED TYPE DEFINITIONS
// ============================================

import type {
  LaundryItemKey,
  LaundryItemQuantities,
} from '@/lib/laundry-items'

export interface Entry extends LaundryItemQuantities {
  id: string
  entry_date: string
  customer_id: string
  customer_name?: string
  total: number
  is_correction: boolean
  correction_reason: string | null
}

export interface DailySummary {
  date: string
  total_entries: number
  item_totals: LaundryItemQuantities
  grand_total: number
}

export interface Customer {
  id: string
  name: string
}

export type OriginalLaundryItemQuantities = {
  [K in LaundryItemKey as `original_${K}`]: number
}

export interface CorrectionEntry
  extends LaundryItemQuantities,
    OriginalLaundryItemQuantities {
  id: string
  entry_date: string
  correction_reason: string | null
  created_at: string
  corrected_by: string
  customers: { name: string }
  previous_version_id?: string
  user_profiles?: { full_name: string } | null
}