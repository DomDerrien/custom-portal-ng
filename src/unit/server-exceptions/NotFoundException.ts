import intern from 'intern';
import { NotFoundException } from '../../server/exceptions/NotFoundException';

const { suite, test } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    test('constructor for V8 engine', (): void => {
        let exception: NotFoundException = new NotFoundException('test');
        assert.strictEqual(exception.message, 'test');
        assert.strictEqual(exception.errorCode, 404);
    });
    test('constructor for other JavaScript engines', (): void => {
        const captureFunction: any = Error.captureStackTrace;
        Error.captureStackTrace = null;
        let exception: NotFoundException = new NotFoundException('test');
        assert.strictEqual(exception.message, 'test');
        Error.captureStackTrace = captureFunction;
    });
});