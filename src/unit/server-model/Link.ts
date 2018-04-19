import intern from 'intern';
import { Link } from '../../server/model/Link';

const { suite, test } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    test('constructor w/o getInstance() implementation', (): void => {
        assert.isTrue(Link.getInstance() instanceof Link);
    });

    test('regular merge', (): void => {
        let source: Link = Object.assign(new Link(), {
            title: '111',
            href: '222',
            categoryId: 333,
            faviconUrl: '444',
            accessKey: '555'
        });
        let update: Link = Object.assign(new Link(), {
            title: 'aaa',
            href: 'bbb',
            categoryId: 999,
            faviconUrl: 'ddd',
            accessKey: 'eee'
        });
        assert.isTrue(source.merge(update));
        assert.deepEqual(source, <any>{
            title: 'aaa',
            href: 'bbb',
            categoryId: 333,
            faviconUrl: 'ddd',
            accessKey: 'eee'
        });
    });
});