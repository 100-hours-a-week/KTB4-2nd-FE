export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type ApiErrorResponse = {
  code?: string;
  message: string;
  errors?: Record<string, string[]>;
};
