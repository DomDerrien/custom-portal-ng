import intern from 'intern';

import { LinkResource } from '../../server/resource/LinkResource';

const { suite, test } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    test('getInstance()', (): void => {
        const resource: LinkResource = LinkResource.getInstance();
        assert.isTrue(resource instanceof LinkResource);
        assert.strictEqual(LinkResource.getInstance(), resource);
        assert.strictEqual(LinkResource.getInstance(), resource);
    });
});