import intern from 'intern';
import { CategoryDao } from '../../server/dao/CategoryDao';

const { suite, test } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    test('getInstance()', (): void => {
        const dao: CategoryDao = CategoryDao.getInstance();
        assert.isTrue(dao instanceof CategoryDao);
        assert.strictEqual(CategoryDao.getInstance(), dao);
        assert.strictEqual(CategoryDao.getInstance(), dao);
    });
});