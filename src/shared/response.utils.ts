// src/common/response.util.ts

export function createResponse(
  success: boolean,
  message: string,
  data: unknown = null,
) {
  return {
    success,
    message,
    data,
  };
}
