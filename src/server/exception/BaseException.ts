export class BaseException extends Error {
    public errorCode: number;
    public constructor(message: string) {
        super(message);
    }
};