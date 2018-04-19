import intern from 'intern';
import { LinkDao } from '../../server/dao/LinkDao';

const { suite, test } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    test('getInstance()', (): void => {
        const dao: LinkDao = LinkDao.getInstance();
        assert.isTrue(dao instanceof LinkDao);
        assert.strictEqual(LinkDao.getInstance(), dao);
        assert.strictEqual(LinkDao.getInstance(), dao);
    });
});