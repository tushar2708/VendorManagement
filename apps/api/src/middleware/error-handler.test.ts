import type { Request, Response } from 'express';
import { z } from 'zod';
import { describe, expect, it, vi } from 'vitest';
import { controlDecisionSchema } from '@vendor-management/shared';

import { errorHandler } from './error-handler.js';
import { NotFoundError, ConflictError } from '../lib/errors.js';

function mockResponse() {
  const response = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return response as unknown as (Response & { statusCode: number; body: unknown });
}

function handle(error: unknown) {
  const response = mockResponse();
  errorHandler(error, {} as Request, response, vi.fn());
  return response;
}

describe('errorHandler', () => {
  it('answers 400 for a schema owned by this workspace', () => {
    const error = (() => {
      try {
        z.object({ name: z.string() }).parse({ name: 1 });
      } catch (thrown) {
        return thrown;
      }
    })();

    const response = handle(error);

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({ error: 'Invalid request' });
  });

  it('answers 400 for a shared schema, whose zod is a different copy', () => {
    const error = (() => {
      try {
        controlDecisionSchema.parse({ status: 'PENDING' });
      } catch (thrown) {
        return thrown;
      }
    })();

    expect(error instanceof z.ZodError).toBe(false);

    const response = handle(error);

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({ error: 'Invalid request' });
    expect((response.body as { issues?: unknown[] }).issues?.[0]).toMatchObject({ path: 'status' });
  });

  it('maps NotFoundError to 404', () => {
    const response = handle(new NotFoundError('No vendor found with that id'));

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: 'No vendor found with that id',
    });
  });

  it('maps ConflictError to 409', () => {
    const response = handle(new ConflictError('Vendor already exists'));

    expect(response.statusCode).toBe(409);
    expect(response.body).toEqual({
      success: false,
      error: 'Vendor already exists',
    });
  });

  it('tells the caller nothing about an unexpected failure', () => {
    const response = handle(new Error('connection string leaked in here'));

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ success: false, error: 'Internal server error' });
  });

  it('does not mistake an ordinary error that merely has issues', () => {
    const impostor = Object.assign(new Error('nope'), { issues: ['not a zod error'] });

    expect(handle(impostor).statusCode).toBe(500);
  });
});
