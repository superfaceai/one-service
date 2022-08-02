interface ErrorExtensions {
  properties?: Record<string, unknown>;
  statusCode?: string;
  metadata?: Record<string, unknown>;
  response?: Record<string, unknown>;
  kind?: string;
}

export interface OneSdkError extends ErrorExtensions, Error {}

interface WrappedError extends Error {
  originalError?: unknown;
  extensions?: ErrorExtensions;
}

export function isOneSdkError(err: unknown): err is OneSdkError {
  return typeof err === 'object' && err != null && 'message' in err;
}

export function remapOneSdkError(originalError: OneSdkError): WrappedError {
  const message = originalError.message || 'Unknown OneSDK Error';
  const error: WrappedError = new Error(message);
  error.originalError = originalError;
  error.extensions = {
    kind: originalError.kind,
    properties: originalError.properties,
    statusCode: originalError.statusCode,
    response: originalError.response,
    metadata: originalError.metadata,
  };

  return error;
}
