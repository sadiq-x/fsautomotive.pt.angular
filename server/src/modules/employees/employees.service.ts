/**
 * Staff use cases.
 *
 * WHY THE ROSTER IS NOT PAGED IN PRACTICE
 * ---------------------------------------
 * `/entities/employees` answered with the entire roster and `has_more: false`
 * in one request. A workshop's staff list is bounded by the building, so the
 * page defaults to the upstream maximum and renders everything — no pager, as
 * specified. The endpoint still accepts `page`/`perPage`, so a company that
 * outgrows one page degrades to paging rather than silently truncating: `meta`
 * carries `hasMore`, and a `true` there is the signal to turn the pager on.
 */
import type { EmployeesResource } from '../../integrations/officegest/resources/employees.resource.js';
import type { PaginationMeta } from '../../shared/http/api-response.js';
import { MAX_PER_PAGE, readHasMore, toPaginationMeta } from '../../shared/http/pagination.js';
import type { UseCaseContext } from '../../shared/use-case-context.js';
import type { ListEmployeesQuery } from './employee.dto.js';
import { toEmployees } from './employee.mapper.js';
import type { Employee } from './employee.model.js';

export interface EmployeeList {
  readonly employees: readonly Employee[];
  readonly meta: PaginationMeta;
}

export class EmployeesService {
  constructor(private readonly employees: EmployeesResource) {}

  async list(query: ListEmployeesQuery, context: UseCaseContext): Promise<EmployeeList> {
    const result = await this.employees.list(
      // `name` is a partial match upstream, which is what a roster box needs.
      { page: query.page, perPage: query.perPage, name: query.search?.trim() || undefined },
      { logger: context.logger, signal: context.signal },
    );

    const mapped = toEmployees(result.items);

    if (mapped.length !== result.items.length) {
      context.logger.warn('discarded OfficeGest employee records without an identifier', {
        received: result.items.length,
        mapped: mapped.length,
      });
    }

    const hasMore = readHasMore(result.meta);

    // Worth a line: it is the trigger for adding a pager to this page.
    if (hasMore) {
      context.logger.warn('the employee roster no longer fits in one page', {
        perPage: query.perPage,
      });
    }

    return {
      employees: mapped,
      meta: toPaginationMeta(query, result.meta?.['total'], hasMore),
    };
  }
}

/**
 * The page size the roster is fetched with — one request for the whole team.
 *
 * `MAX_PER_PAGE`, not the upstream 250 cap: the DTO rejects anything larger, and
 * a roster that outgrows a hundred people has bigger problems than a pager.
 */
export const ROSTER_PAGE_SIZE = MAX_PER_PAGE;
