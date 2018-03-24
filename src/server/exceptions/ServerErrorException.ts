import { BaseException } from './BaseException';

export class ServerErrorException extends BaseException {
    public constructor(message: string) {
        super(message);
        this.errorCode = 500;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ServerErrorException);
        }
    }
};