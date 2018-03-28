import { BaseException } from './BaseException';

export class ClientErrorException extends BaseException {
    public constructor(message: string) {
        super(message);
        this.errorCode = 400;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ClientErrorException);
        }
    }
};