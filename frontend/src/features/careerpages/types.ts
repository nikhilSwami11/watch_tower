export interface CareerPage {
  id: string;
  group_id: string;
  url: string;
  label: string;
  company: string;
  added_by: string;
  created_at: string;
}

export interface PageInteractions {
  pageId: string;
  seenBy: string[];   // user IDs
  appliedBy: string[]; // user IDs
}
