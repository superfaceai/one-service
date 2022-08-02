interface WrappedError extends Error {
  originalError?: unknown;
  extensions?: Record<string, unknown>;
}

export interface OneSdkError extends Error {
  properties?: Record<string, unknown>;
  statusCode?: string;
  metadata?: Record<string, unknown>;
  response?: Record<string, unknown>;
  kind?: string;
}

export function remapSdkError(originalError: OneSdkError): WrappedError {
  const message = (originalError as Error)?.message || 'Unknown OneSDK Error';
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
