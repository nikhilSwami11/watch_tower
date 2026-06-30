export interface CareerPage {
  id: string;
  group_id: string;
  url: string;
  label: string;
  company: string;
  added_by: string;
  created_at: string;
  viewed_by?: string[];
  clicked_by?: string[];
  applied_by?: string[];
  last_checked_by?: string;
  last_checked_at?: string;
}
