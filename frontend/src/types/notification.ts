import type { UserBrief } from "./video";

export interface Notification {
  id: string;
  type: "vote" | "follow";
  actor: UserBrief;
  video_id: string | null;
  video_title: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
}
