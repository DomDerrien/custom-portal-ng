import { BaseException } from './BaseException';

export class NotAuthorizedException extends BaseException {
    public constructor(message: string) {
        super(message);
        this.errorCode = 401;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NotAuthorizedException);
        }
    }
};