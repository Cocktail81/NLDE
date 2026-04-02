// ============================================
// SHARED TYPE DEFINITIONS
// ============================================

export interface Entry {
  id: string
  entry_date: string
  customer_id: string
  customer_name?: string
  ironing: number
  saree_ironing: number
  dry_cleaning: number
  total: number
  is_correction: boolean
  correction_reason: string | null
}

export interface DailySummary {
  date: string
  total_entries: number
  total_ironing: number
  total_saree_ironing: number
  total_dry_cleaning: number
  grand_total: number
}

export interface Customer {
  id: string
  name: string
}

export interface CorrectionEntry {
  id: string
  entry_date: string
  // Original values
  original_ironing: number
  original_saree_ironing: number
  original_dry_cleaning: number
  // Corrected values
  ironing: number
  saree_ironing: number
  dry_cleaning: number
  correction_reason: string | null
  created_at: string
  corrected_by: string
  customers: { name: string }
  previous_version_id?: string
  user_profiles?: { full_name: string } | null
}