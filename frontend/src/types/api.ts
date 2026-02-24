import type { User } from "./user";

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
}

export interface AuthResponse {
  user: User;
}
