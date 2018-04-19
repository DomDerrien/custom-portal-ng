import intern from 'intern';
import { BaseException } from '../../server/exceptions/BaseException';

const { suite, test } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    test('constructor', (): void => {
        let exception: BaseException = new BaseException('test');
        assert.strictEqual(exception.message, 'test');
    });
});