/** HTTP for the workshop-board endpoint. */
import type { Request, RequestHandler, Response } from 'express';

import { validationFor } from '../../middleware/validation.middleware.js';
import { success } from '../../shared/http/api-response.js';
import { monitorBoardQuerySchema } from './workshop-monitor.dto.js';
import type { WorkshopMonitorService } from './workshop-monitor.service.js';

export const monitorBoardValidator = validationFor({ query: monitorBoardQuerySchema });

export class WorkshopMonitorController {
  constructor(private readonly service: WorkshopMonitorService) {}

  /**
   * The whole board in one response.
   *
   * No pagination envelope: the payload is a `MonitorBoard`, which carries its
   * own `observedAt` and `activeMechanicCount`. A `meta` of `page: 1` would
   * describe a page that does not exist — see `workshop-monitor.dto.ts`.
   */
  readonly board: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const { query } = monitorBoardValidator.read(req);

    const board = await this.service.board(query, { logger: req.log, signal: req.abortSignal });

    // The board is a live reading and is cached upstream of here for ten
    // seconds. Letting a browser or a proxy hold its own copy on top of that
    // would show a mechanic a timer that had silently stopped advancing.
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(success(board));
  };
}
