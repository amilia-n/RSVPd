export const API_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  UNIQUENESS_VIOLATION: 'UNIQUENESS_VIOLATION',
  CHECK_VIOLATION: 'CHECK_VIOLATION',
  INTERNAL: 'INTERNAL',
};

const ERROR_MESSAGES = {
  [API_ERROR_CODES.UNAUTHORIZED]: 'Please log in to continue',
  [API_ERROR_CODES.FORBIDDEN]: 'You do not have permission to perform this action',
  [API_ERROR_CODES.NOT_FOUND]: 'Resource not found',
  [API_ERROR_CODES.UNIQUENESS_VIOLATION]: 'This email or student number is already in use',
  [API_ERROR_CODES.CHECK_VIOLATION]: 'Invalid data provided',
  [API_ERROR_CODES.INTERNAL]: 'Server error. Please try again later',
};

export function toErrorMessage(err, fallback = "Something went wrong") {
  if (!err) return fallback;

  if (!err.response) {
    return err.message?.includes("timeout")
      ? "Request timed out. Please try again."
      : "Network error. Please check your connection.";
  }

  const { status, data } = err.response;

  if (data?.error) {
    const { code, message } = data.error;
    return ERROR_MESSAGES[code] || message || fallback;
  }

  if (data?.message) return data.message;

  if (status === 401) return ERROR_MESSAGES.UNAUTHORIZED;
  if (status === 403) return ERROR_MESSAGES.FORBIDDEN;
  if (status === 404) return ERROR_MESSAGES.NOT_FOUND;
  if (status >= 500) return ERROR_MESSAGES.INTERNAL;

  return fallback;
}