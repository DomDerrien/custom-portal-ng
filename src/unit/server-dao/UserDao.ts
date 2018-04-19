import intern from 'intern';
import { UserDao } from '../../server/dao/UserDao';

const { suite, test } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    test('getInstance()', (): void => {
        const dao: UserDao = UserDao.getInstance();
        assert.isTrue(dao instanceof UserDao);
        assert.strictEqual(UserDao.getInstance(), dao);
        assert.strictEqual(UserDao.getInstance(), dao);
    });
});