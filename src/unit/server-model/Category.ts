import intern from 'intern';
import { Category } from '../../server/model/Category';

const { suite, test } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    test('constructor w/o getInstance() implementation', (): void => {
        assert.isTrue(Category.getInstance() instanceof Category);
    });

    test('regular merge', (): void => {
        let source: Category = Object.assign(new Category(), {
            title: '111',
            positionIdx: 222,
            sortBy: '333'
        });
        let update: Category = Object.assign(new Category(), {
            title: 'aaa',
            positionIdx: 999,
            sortBy: 'ccc'
        });
        assert.isTrue(source.merge(update));
        assert.deepEqual(source, {
            title: 'aaa',
            positionIdx: 999,
            sortBy: 'ccc'
        });
    });
});