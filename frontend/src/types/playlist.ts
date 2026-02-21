import type { Video, UserBrief } from "./video";

export interface Playlist {
  id: string;
  name: string;
  is_public: boolean;
  video_count: number;
  created_at: string;
}

export interface PlaylistDetail extends Playlist {
  owner: UserBrief;
  videos: Video[];
}

export interface PlaylistListResponse {
  items: Playlist[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
}
