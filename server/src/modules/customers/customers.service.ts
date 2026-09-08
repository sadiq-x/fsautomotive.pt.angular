/**
 * Customer use cases.
 *
 * WHY THIS LAYER EXISTS WHEN IT LOOKS LIKE A PASS-THROUGH
 * -------------------------------------------------------
 * It is the only layer that knows both halves of the problem: what the
 * application means by "a customer" and what OfficeGest returns. Concretely it
 * owns the translation (upstream record → `Customer`), the pagination contract
 * (our 1-based `page`/`perPage` vs whatever `meta` reports), and the rules that
 * are ours rather than HTTP's.
 *
 * It takes no `Request` and returns no `Response`, which is what makes it
 * testable without a server and reusable from somewhere that is not a
 * controller — a scheduled sync, a CLI, a queue worker.
 */
import {
  COUNT_TTL_MS,
  countAll,
  type CountResult,
} from '../../integrations/officegest/officegest.counter.js';
import { logger as sharedLogger } from '../../shared/logger.js';
import { memoizeWithTtl } from '../../shared/ttl-memo.js';
import { readHasMore } from '../../shared/http/pagination.js';
import type { CustomersResource } from '../../integrations/officegest/index.js';
import { AppError, ERROR_CODES } from '../../shared/errors/index.js';
import type { PaginationMeta } from '../../shared/http/api-response.js';
import { toPaginationMeta } from '../../shared/http/pagination.js';
import type { UseCaseContext } from '../../shared/use-case-context.js';
import type { Customer } from './customer.model.js';
import { toCustomer, toCustomers } from './customer.mapper.js';
import type { ListCustomersQuery } from './customer.dto.js';

/** A Portuguese tax number: nine digits, nothing else. */
const TAX_ID_PATTERN = /^\d{9}$/;

/**
 * Resolves one search box onto the filter its content implies.
 *
 * Upstream has no free-text search — it has `name` (partial), `tax_id` (exact)
 * and `email` (exact). Sending a NIF as `name` matches nothing, which is what
 * made the box look broken for anything but a name. Choosing by shape is what
 * lets one input honour the "Nome, NIF ou e-mail" it promises.
 *
 * Exported for the tests: the rule is the contract, not an implementation
 * detail.
 */
export function toCustomerFilter(search: string | undefined): {
  name?: string;
  taxId?: string;
  email?: string;
} {
  const term = search?.trim();

  if (!term) {
    return {};
  }

  // An `@` is unambiguous, and a NIF cannot contain one.
  if (term.includes('@')) {
    return { email: term };
  }

  if (TAX_ID_PATTERN.test(term)) {
    return { taxId: term };
  }

  return { name: term };
}

export interface CustomerList {
  readonly customers: readonly Customer[];
  readonly meta: PaginationMeta;
}

export class CustomersService {
  constructor(private readonly customers: CustomersResource) {}

  /**
   * The size of the whole collection, held for `COUNT_TTL_MS`.
   *
   * Shared by every caller, so it takes no request signal: one browser
   * navigating away must not cancel the sweep three other requests are waiting
   * on. It logs against the shared logger for the same reason — the sweep
   * belongs to no single request.
   */
  private readonly total = memoizeWithTtl(
    () =>
      countAll((page, perPage) => this.customers.list({ page, perPage }, { logger: sharedLogger })),
    COUNT_TTL_MS,
  );

  async list(query: ListCustomersQuery, context: UseCaseContext): Promise<CustomerList> {
    const result = await this.customers.list(
      { page: query.page, perPage: query.perPage, ...toCustomerFilter(query.search) },
      { logger: context.logger, signal: context.signal },
    );

    const mapped = toCustomers(result.items);

    // A record dropped by the mapper is a contract problem worth seeing, but
    // not worth failing the request over — the rest of the page is still good.
    if (mapped.length !== result.items.length) {
      context.logger.warn('discarded OfficeGest customer records without an identifier', {
        received: result.items.length,
        mapped: mapped.length,
      });
    }

    return {
      customers: mapped,
      // Upstream sends no total, so `hasMore` is what the pager actually uses.
      meta: toPaginationMeta(query, result.meta?.['total'], readHasMore(result.meta)),
    };
  }

  /**
   * How many records the collection holds.
   *
   * Deliberately a separate call, not part of `list`: OfficeGest reports no
   * total, so this walks the collection, and no page load should pay for that.
   * The search filter is applied, so counting a filtered list counts the filter.
   */
  async count(query: ListCustomersQuery, context: UseCaseContext): Promise<CountResult> {
    const filter = toCustomerFilter(query.search);

    // Only the unfiltered total is cached — it is the one the dashboard asks
    // for on every visit, and the only one whose answer is the same for every
    // caller. A filtered count is a question one person asked about one term,
    // so it is swept fresh and never stored.
    const result =
      Object.keys(filter).length > 0
        ? await countAll((page, perPage) =>
            this.customers.list(
              { page, perPage, ...filter },
              { logger: context.logger, signal: context.signal },
            ),
          )
        : await this.total.get();

    context.logger.info('counted OfficeGest customers', {
      total: result.total,
      exact: result.exact,
      upstreamRequests: result.requests,
    });

    return result;
  }

  async getById(customerId: string, context: UseCaseContext): Promise<Customer> {
    const record = await this.customers.getById(customerId, {
      logger: context.logger,
      signal: context.signal,
    });

    const customer = toCustomer(record);

    if (!customer) {
      // OfficeGest answered 200 with something we cannot address. That is a
      // contract failure, not an empty result, and publishing a customer with a
      // blank id would push the problem downstream.
      context.logger.error('OfficeGest customer record has no usable identifier', { customerId });
      throw new AppError(
        502,
        ERROR_CODES.OFFICEGEST_MALFORMED_RESPONSE,
        'OfficeGest returned an unexpected response.',
      );
    }

    return customer;
  }
}
