export { searchTrips } from './api/searchTrips';
export type { SearchResponse } from './api/searchTrips';
export {
  SEARCH_QUERY_MAX_LENGTH,
  SEARCH_QUERY_MIN_LENGTH,
  normalizeSearchQuery,
} from './model/types';
export type { SearchFolder, SearchPhoto, SearchResult, SearchViewState } from './model/types';
export { useSearch } from './model/useSearch';
