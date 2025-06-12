/*!
 * Copyright (c) 2025 Carlos Coloma Escribano
 *
 * This source code is available under a dual licensing model:
 *
 * 1. LICENSE.txt — Public license: permits inspection and internal evaluation only.
 * 2. LICENSE-CHOICE.md — Commercial license: required for any production or commercial use.
 *
 */

import log from '../logging/log';

export class JsonError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface JsonErrorResponse {
  message: string;
  errorMessages: string[];
}

const res: { [key: string]: string } = {
  server0: 'Unknown error',
  server401: 'Unauthorized',
  server403: 'Forbidden',
  server404: 'Not found',
  server500: 'Internal server error',
  server502: 'Bad gateway',
  serverParseError: 'Error parsing response',
  serverTimeout: 'Request timed out',
};

/*
 Extract the error message from the response, and return as a failing Promise
 */
export async function parseAndThrowError(response: Response): Promise<never> {
  const statusError = res['server' + response.status] || res.serverUnknown;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.indexOf('application/json') !== -1) {
    const jsonResponse: JsonErrorResponse = await response.json();
    const error = jsonResponse.errorMessages?.[0] || jsonResponse.message;
    log.info('Error response:', jsonResponse);
    throw new JsonError(response.status, error || statusError);
  }
  throw new JsonError(response.status, statusError);
}

type MethodType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

interface Headers {
  [key: string]: string;
}

export interface FetchAdapterOptions {
  method: MethodType;
  headers?: Headers;
  credentials?: 'same-origin' | 'include' | 'omit';

  /** timeout in seconds */
  timeout?: number;

  /**
   * The AbortController, to be used if the request must be interrupted externally
   * If specified, calling `controller.abort()` will stop the ongoing fetch request
   */
  controller?: AbortController;
}

type FetchBody = object | string | undefined;

/**
 * Wrapper around Fetch. Applies application/json by default to both input and output.
 * Also: applies a timeout to any request, 15s by default.
 */
async function fetchAdapter<T>(url: string, body: FetchBody, options: FetchAdapterOptions): Promise<T | undefined> {
  const headers = Object.assign(
    {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    options.headers || {},
  );

  body = typeof body !== 'undefined' ? JSON.stringify(body) : undefined;
  // abort when timeout is reached
  // see https://developers.google.com/web/updates/2017/09/abortable-fetch
  const controller = options.controller || new AbortController();
  const signal = controller.signal;
  const timeout = options.timeout || 25; // default timeout is 25 seconds
  const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);
  timeoutId.unref();

  try {
    const response = await fetch(url, {
      method: options.method,
      headers,
      body,
      signal,
    });

    // if the response is not 2xx, reject promise with error message
    if (!response.ok) {
      await parseAndThrowError(response);
    }

    if (response.status == 204) {
      return undefined;
    } else {
      return await response.json();
    }
  } catch (e) {
    if ((e as DOMException).name === 'AbortError') {
      throw new JsonError(408, 'Request timed out');
    }
    throw e;
  }
}

export type OptionsWithoutMethod = Omit<FetchAdapterOptions, 'method'>;

export function post<T>(url: string, body: FetchBody, options: OptionsWithoutMethod = {}) {
  return fetchAdapter<T>(url, body, { method: 'POST', ...options });
}
export function put<T>(url: string, body: FetchBody, options: OptionsWithoutMethod = {}) {
  return fetchAdapter<T>(url, body, { method: 'PUT', ...options });
}
export function patch<T>(url: string, body: FetchBody, options: OptionsWithoutMethod = {}) {
  return fetchAdapter<T>(url, body, { method: 'PATCH', ...options });
}
export function _delete<T>(url: string, options: OptionsWithoutMethod = {}) {
  return fetchAdapter<T>(url, undefined, { method: 'DELETE', ...options });
}

/**
 * GET requests append any arguments as GET parameters to the URL
 */

export function get<T>(url: string, options?: OptionsWithoutMethod) {
  return fetchAdapter<T>(url, undefined, {
    method: 'GET',
    ...options,
  });
}
