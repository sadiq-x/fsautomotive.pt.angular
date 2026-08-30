/**
 * Service-order use cases.
 *
 * The filter vocabulary of `/workshop/service-orders` is not published, so this
 * is where the guess is made and contained: our validated `plate` and `status`
 * are translated into upstream parameter names here, in one place, instead of
 * being spread across a controller and a resource. If a tenant's documentation
 * names them differently, `UPSTREAM_FILTERS` is the only edit.
 */
import type { ServiceOrdersResource } from '../../integrations/officegest/index.js';
import { AppError, ERROR_CODES } from '../../shared/errors/index.js';
import type { PaginationMeta } from '../../shared/http/api-response.js';
import { toPaginationMeta } from '../../shared/http/pagination.js';
import type { UseCaseContext } from '../../shared/use-case-context.js';
import type { ListServiceOrdersQuery } from './service-order.dto.js';
import { toServiceOrder, toServiceOrders } from './service-order.mapper.js';
import type { ServiceOrder } from './service-order.model.js';

/** ⚠️ INFERRED upstream filter parameter names. Confirm against your tenant. */
const UPSTREAM_FILTERS = {
  plate: 'plate',
  status: 'status',
} as const;

export interface ServiceOrderList {
  readonly serviceOrders: readonly ServiceOrder[];
  readonly meta: PaginationMeta;
}

export class ServiceOrdersService {
  constructor(private readonly serviceOrders: ServiceOrdersResource) {}

  async list(query: ListServiceOrdersQuery, context: UseCaseContext): Promise<ServiceOrderList> {
    const result = await this.serviceOrders.list(
      {
        page: query.page,
        perPage: query.perPage,
        filters: {
          [UPSTREAM_FILTERS.plate]: query.plate,
          [UPSTREAM_FILTERS.status]: query.status,
        },
      },
      { logger: context.logger, signal: context.signal },
    );

    return {
      serviceOrders: toServiceOrders(result.items),
      meta: toPaginationMeta(query, result.meta?.['total']),
    };
  }

  async getById(serviceOrderId: string, context: UseCaseContext): Promise<ServiceOrder> {
    const record = await this.serviceOrders.getById(serviceOrderId, {
      logger: context.logger,
      signal: context.signal,
    });

    const serviceOrder = toServiceOrder(record);

    if (!serviceOrder) {
      context.logger.error('OfficeGest service order has no usable identifier', { serviceOrderId });
      throw new AppError(
        502,
        ERROR_CODES.OFFICEGEST_MALFORMED_RESPONSE,
        'OfficeGest returned an unexpected response.',
      );
    }

    return serviceOrder;
  }
}
