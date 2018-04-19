import { BaseException } from './BaseException';

export class NotAuthorizedException extends BaseException {
    public constructor(message: string) {
        super(message);
        this.errorCode = 401;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NotAuthorizedException);
        }
    }
};