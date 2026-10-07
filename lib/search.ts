export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_MAX_LENGTH = 80;
export const SEARCH_SUGGESTION_LIMIT = 8;
export const SEARCH_PAGE_SIZE = 24;
export const SEARCH_MAX_PAGE = 100;

export type SearchProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  featured: boolean;
  categoryName: string;
  imageUrl: string | null;
};

export type SearchResponse = {
  query: string;
  results: SearchProduct[];
  total: number;
  page: number;
  pageSize: number;
};

export function normalizeSearchQuery(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function validSearchQuery(value: string) {
  return (
    value.length >= SEARCH_MIN_LENGTH &&
    value.length <= SEARCH_MAX_LENGTH &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}
