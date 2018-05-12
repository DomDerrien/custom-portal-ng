import intern from 'intern';
import { User } from '../../server/model/User';
import { UserCache } from '../../server/utils/UserCache';

const { suite, test } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    test('all functions', (): void => {
        const token: string = 'tok';
        const user: User = new User();
        const cache: UserCache = new UserCache();

        assert.isUndefined(cache.get(token));
        assert.strictEqual(cache.set(token, user), user);
        assert.strictEqual(cache.get(token), user);
        assert.isTrue(cache.clear(token));
        assert.isUndefined(cache.get(token));
    });
});