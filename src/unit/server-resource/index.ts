import intern from 'intern';

import * as resources from '../../server/resource/index'; // List of all concrete BaseResource classes implementions
import { BaseResource } from '../../server/resource/BaseResource';
import { AuthResource } from '../../server/resource/index';

const { suite, test } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    test('check imports', (): void => {
        const resourceClasses: { [key: string]: typeof BaseResource } = <any>resources;
        for (let resourceName in resourceClasses) {
            assert.isTrue(!!resourceClasses[resourceName].getInstance);
            const resource: any = resourceClasses[resourceName].getInstance();
            assert.isTrue(!!resource.getRouter);
            if (!(resource instanceof BaseResource)) {
                // Only exception of the BaseResource heritage
                assert.isTrue(resource === AuthResource.getInstance());
            }
        }
    });
});