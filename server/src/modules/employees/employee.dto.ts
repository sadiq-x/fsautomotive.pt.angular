/**
 * `GET /api/officegest/employees`
 *
 * Paginated like every other list even though the roster fits in one page
 * today: the shape is the contract, and a company that grows past a page should
 * not need a new endpoint. The client is free to ignore it — see the note in
 * `employees.service.ts`.
 */
import { z } from 'zod';

import { paginationQuerySchema } from '../../shared/http/pagination.js';

export const listEmployeesQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(2).max(120).optional(),
});

export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
