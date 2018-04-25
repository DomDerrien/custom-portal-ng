import intern from 'intern';
import { NotAuthorizedException } from '../../server/exception/NotAuthorizedException';

const { suite, test } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    test('constructor for V8 engine', (): void => {
        let exception: NotAuthorizedException = new NotAuthorizedException('test');
        assert.strictEqual(exception.message, 'test');
        assert.strictEqual(exception.errorCode, 401);
    });
    test('constructor for other JavaScript engines', (): void => {
        const captureFunction: any = Error.captureStackTrace;
        Error.captureStackTrace = null;
        let exception: NotAuthorizedException = new NotAuthorizedException('test');
        assert.strictEqual(exception.message, 'test');
        Error.captureStackTrace = captureFunction;
    });
});