export interface Video {
  id: string;
  tweet_url: string;
  tweet_id: string;
  author_name: string | null;
  author_url: string | null;
  oembed_html: string | null;
  title: string | null;
  categories: Category[];
  vote_count: number;
  user_voted: boolean;
  is_trending: boolean;
  submitted_by: UserBrief | null;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name_ja: string;
  icon: string | null;
  video_count: number;
}

export interface UserBrief {
  id: string;
  display_name: string;
  avatar_url: string | null;
}
