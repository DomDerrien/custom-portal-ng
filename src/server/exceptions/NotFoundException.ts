import { BaseException } from './BaseException';

export class NotFoundException extends BaseException {
    public constructor(message: string) {
        super(message);
        this.errorCode = 404;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NotFoundException);
        }
    }
};