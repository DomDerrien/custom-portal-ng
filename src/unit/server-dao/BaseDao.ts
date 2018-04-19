import intern from 'intern';
import { BaseDao } from '../../server/dao/BaseDao';
import { BaseModel } from '../../server/model/BaseModel';

const { suite, test } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

class TestModel extends BaseModel {
    public static getInstance(): BaseModel {
        return new TestModel();
    }
};
// @ts-ignore: abstract methods don't need to be implemented for the tests
class TestDao extends BaseDao<TestModel> {
    public constructor() {
        super(new TestModel());
    }
};

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    test('default getInstance() implementation', (): void => {
        assert.throw(BaseDao.getInstance, Error, /Must be overriden\!/);
    });

    test('constructor', (): void => {
        const dao: TestDao = new TestDao();
        // @ts-ignore: the `private` scope of `model` is ignored
        assert.isTrue(dao.model instanceof TestModel);
    });

    test('modelClass', (): void => {
        const dao: TestDao = new TestDao();
        assert.strictEqual(dao.modelClass, TestModel);
    });

    test('modelName', (): void => {
        const dao: TestDao = new TestDao();
        assert.strictEqual(dao.modelName, 'TestModel');
    });

    test('modelInstance', (): void => {
        const dao: TestDao = new TestDao();
        assert.isTrue(dao.modelInstance instanceof TestModel);
    });
});