import { buildPagination, paginateItems } from './pagination';

describe('pagination helpers', () => {
  it('calculates a paginated slice and clamps the current page', () => {
    const items = Array.from({ length: 25 }, (_, index) => index + 1);

    expect(paginateItems(items, 2, 10)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(buildPagination(25, 4, 10)).toEqual({
      currentPage: 3,
      pageSize: 10,
      totalItems: 25,
      totalPages: 3,
      startItem: 21,
      endItem: 25,
    });
  });

  it('keeps empty collections on the first page with zero bounds', () => {
    expect(paginateItems([], 3, 10)).toEqual([]);
    expect(buildPagination(0, 3, 10)).toEqual({
      currentPage: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 1,
      startItem: 0,
      endItem: 0,
    });
  });
});
