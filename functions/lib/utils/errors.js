"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenExpiredError = exports.MetaApiError = void 0;
class MetaApiError extends Error {
    constructor(message, statusCode, metaErrorCode) {
        super(message);
        this.statusCode = statusCode;
        this.metaErrorCode = metaErrorCode;
        this.name = "MetaApiError";
    }
}
exports.MetaApiError = MetaApiError;
class TokenExpiredError extends Error {
    constructor(accountId) {
        super(`Token expired for account ${accountId}`);
        this.accountId = accountId;
        this.name = "TokenExpiredError";
    }
}
exports.TokenExpiredError = TokenExpiredError;
//# sourceMappingURL=errors.js.map