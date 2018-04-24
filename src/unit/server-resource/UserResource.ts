import intern from 'intern';

import { UserResource } from '../../server/resource/UserResource';

const { suite, test } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    test('getInstance()', (): void => {
        const resource: UserResource = UserResource.getInstance();
        assert.isTrue(resource instanceof UserResource);
        assert.strictEqual(UserResource.getInstance(), resource);
        assert.strictEqual(UserResource.getInstance(), resource);
    });
});