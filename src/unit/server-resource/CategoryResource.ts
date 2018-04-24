import intern from 'intern';

import { CategoryResource } from '../../server/resource/CategoryResource';

const { suite, test } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    test('getInstance()', (): void => {
        const resource: CategoryResource = CategoryResource.getInstance();
        assert.isTrue(resource instanceof CategoryResource);
        assert.strictEqual(CategoryResource.getInstance(), resource);
        assert.strictEqual(CategoryResource.getInstance(), resource);
    });
});