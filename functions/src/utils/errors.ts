export class MetaApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly metaErrorCode?: number
  ) {
    super(message);
    this.name = "MetaApiError";
  }
}

export class TokenExpiredError extends Error {
  constructor(public readonly accountId: string) {
    super(`Token expired for account ${accountId}`);
    this.name = "TokenExpiredError";
  }
}
