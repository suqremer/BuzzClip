import type { UserBrief } from "./video";

export interface Badge {
  key: string;
  label: string;
  description: string;
  icon: string;
  earned: boolean;
}

export interface Contributor {
  rank: number;
  user: UserBrief;
  vote_count: number;
}
