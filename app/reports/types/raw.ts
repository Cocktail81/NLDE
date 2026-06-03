import type { LaundryItemQuantities } from '@/lib/laundry-items'

export type RelationOneOrMany<T> = T | T[] | null | undefined

export interface RawEntry extends Partial<LaundryItemQuantities> {
  id: string
  entry_date: string
  customer_id: string
  is_correction: boolean | null
  correction_reason: string | null
  customers?: RelationOneOrMany<{ name: string }>
}

export interface CorrectionRawData extends Partial<LaundryItemQuantities> {
  id: string
  entry_date: string
  correction_reason: string | null
  created_at: string
  previous_version_id: string
  created_by: string
  customers: RelationOneOrMany<{ name: string }>
  user_profiles: RelationOneOrMany<{ full_name: string }>
}

export interface DateRangeRawEntry extends Partial<LaundryItemQuantities> {
  id: string
  entry_date: string
  customer_id: string
  customers: RelationOneOrMany<{ name: string }>
}

export interface CustomerReportRawEntry extends Partial<LaundryItemQuantities> {
  id: string
  entry_date: string
  is_correction: boolean | null
  customers: RelationOneOrMany<{ name: string }>
}