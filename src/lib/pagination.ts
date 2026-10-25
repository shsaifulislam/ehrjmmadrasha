/**
 * EHRJ Madrasha ERP - Query Pagination & Bound Enforcement Utility
 * SEC-01 Security Remediation: Prevents unbounded administrative query payloads.
 */

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export interface PaginationParams {
  page: number;
  take: number;
  skip: number;
  limit: number; // alias for take
}

/**
 * Safely parses and bounds query pagination parameters.
 * 
 * Rules enforced:
 * - If client sends no take/limit: defaults to 50
 * - If client sends 1 <= take <= 200: accepted as-is
 * - If client sends take > 200: capped at MAX_PAGE_SIZE (200)
 * - If client sends invalid, non-numeric, 0, or negative: safely falls back to default 50
 * - page is bounded to minimum 1
 */
export function parsePaginationParams(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
  defaultTake: number = DEFAULT_PAGE_SIZE,
  maxTake: number = MAX_PAGE_SIZE
): PaginationParams {
  const rawPage = searchParams.get("page");
  const rawTake = searchParams.get("take") ?? searchParams.get("limit");

  // Parse page
  let page = 1;
  if (rawPage !== null && rawPage !== undefined) {
    const parsedPage = parseInt(rawPage.trim(), 10);
    if (!isNaN(parsedPage) && parsedPage >= 1) {
      page = parsedPage;
    }
  }

  // Parse take/limit
  let take = defaultTake;
  if (rawTake !== null && rawTake !== undefined && rawTake.trim() !== "") {
    const parsedTake = parseInt(rawTake.trim(), 10);
    if (!isNaN(parsedTake)) {
      if (parsedTake <= 0) {
        take = defaultTake;
      } else if (parsedTake > maxTake) {
        take = maxTake;
      } else {
        take = parsedTake;
      }
    }
  }

  const skip = (page - 1) * take;

  return {
    page,
    take,
    skip,
    limit: take,
  };
}
