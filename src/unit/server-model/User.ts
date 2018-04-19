import intern from 'intern';
import { User } from '../../server/model/User';

const { suite, test } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    test('constructor w/o getInstance() implementation', (): void => {
        assert.isTrue(User.getInstance() instanceof User);
    });

    test('regular merge', (): void => {
        let source: User = Object.assign(new User(), {
            name: '111',
            email: '222',
            verifiedEmail: true,
            sessionToken: '444',
            picture: '555',
            latLong: '666',
            city: '777',
            region: '888',
            country: '999'
        });
        let update: User = Object.assign(new User(), {
            name: 'aaa',
            email: 'bbb',
            verifiedEmail: false,
            sessionToken: 'ddd',
            picture: 'eee',
            latLong: 'fff',
            city: 'ggg',
            region: 'hhh',
            country: 'iii'
        });
        assert.isTrue(source.merge(update));
        assert.deepEqual(source, <any>{
            name: 'aaa',
            email: '222',
            verifiedEmail: true,
            sessionToken: 'ddd',
            picture: 'eee',
            latLong: '666',
            city: '777',
            region: '888',
            country: '999'
        });
    });
});