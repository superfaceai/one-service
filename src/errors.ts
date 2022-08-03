import { ErrorBase, SDKExecutionError } from '@superfaceai/one-sdk';

interface ErrorExtensions {
  properties?: Record<string, unknown>;
  statusCode?: string;
  response?: Record<string, unknown>;
  kind?: string;
}

export interface OneSdkError extends ErrorExtensions, Error {}

export interface OneSdkResolverError extends Error {
  originalError?: unknown;
  extensions?: ErrorExtensions;
}

export function isOneSdkError(error: unknown): error is OneSdkError {
  return error instanceof ErrorBase || error instanceof SDKExecutionError;
}

export function remapOneSdkError(
  originalError: OneSdkError,
): OneSdkResolverError {
  const message = originalError.message || 'Unknown OneSDK Error';
  const error: OneSdkResolverError = new Error(message);
  error.originalError = originalError;
  error.extensions = {
    kind: originalError.kind,
    properties: originalError.properties,
    statusCode: originalError.statusCode,
    response: originalError.response,
  };

  return error;
}
