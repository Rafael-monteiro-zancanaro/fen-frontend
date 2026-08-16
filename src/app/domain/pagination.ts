export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export interface PaginationState {
  currentPage: number;
  pageSize: PageSize;
  totalItems: number;
  totalPages: number;
  startItem: number;
  endItem: number;
}

export function buildPagination(
  totalItems: number,
  currentPage: number,
  pageSize: PageSize,
): PaginationState {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const clampedPage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = totalItems === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const endItem = Math.min(clampedPage * pageSize, totalItems);

  return {
    currentPage: clampedPage,
    pageSize,
    totalItems,
    totalPages,
    startItem,
    endItem,
  };
}

export function paginateItems<T>(items: T[], currentPage: number, pageSize: PageSize): T[] {
  const pagination = buildPagination(items.length, currentPage, pageSize);
  const startIndex = (pagination.currentPage - 1) * pageSize;

  return items.slice(startIndex, startIndex + pageSize);
}

export function normalizePageSize(value: number): PageSize {
  return PAGE_SIZE_OPTIONS.includes(value as PageSize) ? (value as PageSize) : 10;
}
