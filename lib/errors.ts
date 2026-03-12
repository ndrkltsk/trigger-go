export class MissingSecretKeyError extends Error {
  constructor(public environment: string) {
    super(`No secret API key configured for ${environment} environment`);
    this.name = 'MissingSecretKeyError';
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: {
      error: string;
      details?: Array<{ code: string; message: string; path?: string[] }>;
    },
  ) {
    super(body.error);
    this.name = 'ApiError';
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isValidationError(): boolean {
    return this.status === 422;
  }

  get userMessage(): string {
    if (this.isUnauthorized) return 'Session expired. Please log in again.';
    if (this.isNotFound) return 'The requested resource was not found.';
    if (this.isValidationError && this.body.details) {
      return this.body.details.map((d) => d.message).join('. ');
    }
    return this.body.error || 'Something went wrong. Please try again.';
  }
}
