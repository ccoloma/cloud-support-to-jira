import { _delete, get, JsonError, parseAndThrowError, patch, post, put } from './FetchAdapter';

global.fetch = jest.fn();

const mockFetch = global.fetch as jest.Mock;

describe('FetchAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('JsonError', () => {
    it('should set status and message', () => {
      const err = new JsonError(404, 'Not found');
      expect(err.status).toBe(404);
      expect(err.message).toBe('Not found');
    });
  });

  describe('parseAndThrowError', () => {
    it('should throw JsonError with JSON error message', async () => {
      const response = {
        status: 401,
        headers: { get: () => 'application/json' },
        json: async () => ({
          message: 'Unauthorized',
          errorMessages: ['Token expired'],
        }),
      } as unknown as Response;

      await expect(parseAndThrowError(response)).rejects.toThrow(JsonError);
      await expect(parseAndThrowError(response)).rejects.toMatchObject({
        status: 401,
        message: 'Token expired',
      });
    });

    it('should throw JsonError with fallback message if no errorMessages', async () => {
      const response = {
        status: 403,
        headers: { get: () => 'application/json' },
        json: async () => ({
          message: 'Forbidden',
        }),
      } as unknown as Response;

      await expect(parseAndThrowError(response)).rejects.toMatchObject({
        status: 403,
        message: 'Forbidden',
      });
    });

    it('should throw JsonError with status error if not JSON', async () => {
      const response = {
        status: 404,
        headers: { get: () => 'text/html' },
      } as unknown as Response;

      await expect(parseAndThrowError(response)).rejects.toMatchObject({
        status: 404,
        message: 'Not found',
      });
    });
  });

  describe('fetchAdapter methods', () => {
    const url = 'https://api.example.com/resource';
    const body = { foo: 'bar' };
    const jsonResponse = { result: 'ok' };

    it('post: should call fetch with POST and return JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => jsonResponse,
      });

      const result = await post<typeof jsonResponse>(url, body);
      expect(mockFetch).toHaveBeenCalledWith(url, expect.objectContaining({ method: 'POST' }));
      expect(result).toEqual(jsonResponse);
    });

    it('put: should call fetch with PUT and return JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => jsonResponse,
      });

      const result = await put<typeof jsonResponse>(url, body);
      expect(mockFetch).toHaveBeenCalledWith(url, expect.objectContaining({ method: 'PUT' }));
      expect(result).toEqual(jsonResponse);
    });

    it('patch: should call fetch with PATCH and return JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => jsonResponse,
      });

      const result = await patch<typeof jsonResponse>(url, body);
      expect(mockFetch).toHaveBeenCalledWith(url, expect.objectContaining({ method: 'PATCH' }));
      expect(result).toEqual(jsonResponse);
    });

    it('_delete: should call fetch with DELETE and return JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => jsonResponse,
      });

      const result = await _delete<typeof jsonResponse>(url);
      expect(mockFetch).toHaveBeenCalledWith(url, expect.objectContaining({ method: 'DELETE' }));
      expect(result).toEqual(jsonResponse);
    });

    it('get: should call fetch with GET and return JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => jsonResponse,
      });

      const result = await get<typeof jsonResponse>(url);
      expect(mockFetch).toHaveBeenCalledWith(url, expect.objectContaining({ method: 'GET' }));
      expect(result).toEqual(jsonResponse);
    });

    it('should return undefined for 204 No Content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => undefined,
      });

      const result = await get(url);
      expect(result).toBeUndefined();
    });

    it('should throw JsonError on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: { get: () => 'text/html' },
      });

      await expect(get(url)).rejects.toThrow(JsonError);
    });
  });
});
