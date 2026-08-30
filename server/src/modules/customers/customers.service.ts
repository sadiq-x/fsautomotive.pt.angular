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
import type { CustomersResource } from '../../integrations/officegest/index.js';
import { AppError, ERROR_CODES } from '../../shared/errors/index.js';
import type { PaginationMeta } from '../../shared/http/api-response.js';
import { toPaginationMeta } from '../../shared/http/pagination.js';
import type { UseCaseContext } from '../../shared/use-case-context.js';
import type { Customer } from './customer.model.js';
import { toCustomer, toCustomers } from './customer.mapper.js';
import type { ListCustomersQuery } from './customer.dto.js';

export interface CustomerList {
  readonly customers: readonly Customer[];
  readonly meta: PaginationMeta;
}

export class CustomersService {
  constructor(private readonly customers: CustomersResource) {}

  async list(query: ListCustomersQuery, context: UseCaseContext): Promise<CustomerList> {
    const result = await this.customers.list(
      { page: query.page, perPage: query.perPage, search: query.search },
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
      // `meta.total` is the upstream count when it sends one; the page numbers
      // stay ours, because they are what the caller asked for.
      meta: toPaginationMeta(query, result.meta?.['total']),
    };
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
