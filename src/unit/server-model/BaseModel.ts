import intern from 'intern';
import { BaseModel } from '../../server/model/BaseModel';
import { ServerErrorException } from '../../server/exceptions/ServerErrorException';

const { suite, test, beforeEach, afterEach } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

class TestModel extends BaseModel {
    public booleanProp: boolean;
    public numberProp: number;
    public stringProp: string;
    public arrayStringProp: Array<string>;
    public arrayAnyProp: Array<any>;
    public mapProp: { [key: string]: string };
}

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    let source: TestModel;
    let update: TestModel;

    beforeEach((): void => {
        source = Object.assign(new TestModel(), {
            id: 111,
            ownerId: 222,
            created: '333',
            updated: null
        });
        update = new TestModel();
    });

    afterEach((): void => {
        source = null;
        update = null;
    });

    test('constructor w/o getInstance() implementation', (): void => {
        assert.throw(TestModel.getInstance, ServerErrorException, /Must be overriden\!/);
    });

    suite('merge', (): void => {
        test('merge with null', (): void => {
            assert.isFalse(source.merge(null));
        });

        test('merge with itsef', (): void => {
            assert.isFalse(source.merge(source));
        });

        test('merge with a number', (): void => {
            // Use of <any> to avoid TSC complaining about the misstype
            assert.isFalse(source.merge(<any>1));
        });

        test('merge with empty object', (): void => {
            assert.isFalse(source.merge(update));
        });

        test('merge with empty read-only fields', (): void => {
            update.id = source.id + 889;
            update.ownerId = source.ownerId + -444;
            update.created = source.created + '---';
            update.updated = new Date().toJSON();

            assert.isFalse(source.merge(update));

            assert.strictEqual(source.id, 111);
            assert.strictEqual(source.ownerId, 222);
            assert.strictEqual(source.created, '333');
            assert.isNull(source.updated);
        });

        test('merge a r-w field with same value', (): void => {
            source.numberProp = 12;
            update.numberProp = 12;

            assert.isFalse(source.merge(update));
            assert.strictEqual(source.numberProp, 12);
        });

        test('merge a r-w boolean field with different value', (): void => {
            source.booleanProp = false;
            update.booleanProp = true;

            assert.isTrue(source.merge(update));
            assert.isTrue(source.booleanProp);
        });

        test('merge a r-w boolean field with null equivalent value', (): void => {
            source.booleanProp = true;
            update.booleanProp = false;

            assert.isTrue(source.merge(update));
            assert.isFalse(source.booleanProp);
        });

        test('merge a r-w boolean field with undefined value', (): void => {
            source.booleanProp = true;
            update.booleanProp = undefined;

            assert.isFalse(source.merge(update));
            assert.isTrue(source.booleanProp);
        });

        test('merge a r-w number field with different value', (): void => {
            source.numberProp = 12;
            update.numberProp = 144;

            assert.isTrue(source.merge(update));
            assert.strictEqual(source.numberProp, 144);
        });

        test('merge a r-w number field with null equivalent value', (): void => {
            source.numberProp = 12;
            update.numberProp = 0;

            assert.isTrue(source.merge(update));
            assert.strictEqual(source.numberProp, 0);
        });

        test('merge a r-w string field with different value', (): void => {
            source.stringProp = 'source';
            update.stringProp = 'update';

            assert.isTrue(source.merge(update));
            assert.strictEqual(source.stringProp, 'update');
        });

        test('merge a r-w string field with null equivalent value', (): void => {
            source.stringProp = 'source';
            update.stringProp = '';

            assert.isTrue(source.merge(update));
            assert.strictEqual(source.stringProp, '');
        });

        test('merge a r-w array field with same value', (): void => {
            source.arrayStringProp = ['a', 'b'];
            update.arrayStringProp = ['a', 'b'];

            assert.isFalse(source.merge(update));
            assert.isArray(source.arrayStringProp);
            assert.isNotEmpty(source.arrayStringProp);
            assert.deepEqual(source.arrayStringProp, ['a', 'b']);
        });

        test('merge a r-w array field with different value', (): void => {
            source.arrayStringProp = ['a', 'b'];
            update.arrayStringProp = ['e', 'z'];

            assert.isTrue(source.merge(update));
            assert.isArray(source.arrayStringProp);
            assert.isNotEmpty(source.arrayStringProp);
            assert.deepEqual(source.arrayStringProp, ['e', 'z']);
        });

        test('merge a r-w array field with null equivalent value', (): void => {
            source.arrayStringProp = ['a', 'b'];
            update.arrayStringProp = [];

            assert.isTrue(source.merge(update));
            assert.isArray(source.arrayStringProp);
            assert.isEmpty(source.arrayStringProp);
        });

        test('merge a r-w array field with nested object', (): void => {
            source.arrayAnyProp = [{ a: 'b' }];
            update.arrayAnyProp = [{ e: 'z' }];

            assert.isTrue(source.merge(update));
            assert.isArray(source.arrayAnyProp);
            assert.lengthOf(source.arrayAnyProp, 1);
            assert.strictEqual(source.arrayAnyProp[0], update.arrayAnyProp[0]);
        });

        test('merge a r-w nested object field with different value', (): void => {
            source.mapProp = { a: 'b', c: 'd' };
            update.mapProp = { e: 'z' };

            assert.isTrue(source.merge(update));
            assert.isObject(source.mapProp);
            assert.isNotEmpty(source.mapProp);
            assert.deepEqual(source.mapProp, { a: 'b', c: 'd', e: 'z' });
        });

        test('merge a r-w nested object field with null equivalent value', (): void => {
            source.mapProp = { a: 'b', c: 'd' };
            update.mapProp = {};

            assert.isFalse(source.merge(update));
            assert.deepEqual(source.mapProp, { a: 'b', c: 'd' });
        });

        test('merge with non-object instances', (): void => {
            assert.isFalse(BaseModel.merge('a', 'e'));
            assert.isFalse(BaseModel.merge({ a: 'b' }, 'e'));
        });
    });
});