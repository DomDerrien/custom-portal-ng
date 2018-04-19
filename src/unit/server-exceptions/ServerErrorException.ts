import intern from 'intern';
import { ServerErrorException } from '../../server/exceptions/ServerErrorException';

const { suite, test } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    test('constructor for V8 engine', (): void => {
        let exception: ServerErrorException = new ServerErrorException('test');
        assert.strictEqual(exception.message, 'test');
        assert.strictEqual(exception.errorCode, 500);
    });
    test('constructor for other JavaScript engines', (): void => {
        const captureFunction: any = Error.captureStackTrace;
        Error.captureStackTrace = null;
        let exception: ServerErrorException = new ServerErrorException('test');
        assert.strictEqual(exception.message, 'test');
        Error.captureStackTrace = captureFunction;
    });
});