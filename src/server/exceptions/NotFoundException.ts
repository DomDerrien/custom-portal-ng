import { BaseException } from './BaseException';

export class NotFoundException extends BaseException {
    public constructor(message: string) {
        super(message);
        this.errorCode = 404;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NotFoundException);
        }
    }
};