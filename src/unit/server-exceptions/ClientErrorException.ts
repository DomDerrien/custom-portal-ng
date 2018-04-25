import intern from 'intern';
import { ClientErrorException } from '../../server/exception/ClientErrorException';

const { suite, test } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    test('constructor for V8 engine', (): void => {
        let exception: ClientErrorException = new ClientErrorException('test');
        assert.strictEqual(exception.message, 'test');
        assert.strictEqual(exception.errorCode, 400);
    });
    test('constructor for other JavaScript engines', (): void => {
        const captureFunction: any = Error.captureStackTrace;
        Error.captureStackTrace = null;
        let exception: ClientErrorException = new ClientErrorException('test');
        assert.strictEqual(exception.message, 'test');
        Error.captureStackTrace = captureFunction;
    });
});