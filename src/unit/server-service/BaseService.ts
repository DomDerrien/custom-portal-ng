import intern from 'intern';

import { BaseModel } from '../../server/model/BaseModel';
import { BaseDao, QueryOptions } from '../../server/dao/BaseDao';
import { BaseService } from '../../server/service/BaseService';
import { ServerErrorException } from '../../server/exceptions/ServerErrorException';
import { NotAuthorizedException } from '../../server/exceptions/NotAuthorizedException';

const { suite, test, beforeEach, afterEach } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');
import { stub, SinonStub } from 'sinon';
import { User } from '../../server/model/User';
import { NotFoundException } from '../../server/exceptions/NotFoundException';

class TestModel extends BaseModel {
    static getInstance(): TestModel { return new TestModel(); }
};
class TestDao extends BaseDao<TestModel> {
    static getInstance(): TestDao { return new TestDao(); }
    constructor() { super(TestModel.getInstance()); }
    async get(id: number): Promise<TestModel> { return null; };
    async query(filters: { [key: string]: any }, options: QueryOptions): Promise<Array<TestModel>> { return []; };
    async create(candidate: TestModel): Promise<number> { return 0; };
    async update(id: number, candidate: TestModel): Promise<number> { return 0; };
    async delete(id: number): Promise<void> { };
}
class TestService extends BaseService<TestDao> {
    static getInstance(): TestService { return new TestService(); }
    constructor() { super(TestDao.getInstance()); }
}

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    let service: TestService;
    let loggedUser: User;

    beforeEach((): void => {
        service = new TestService();
        loggedUser = Object.assign(new User(), { id: 12345, email: 'test@mail.com' });;
    });
    afterEach((): void => {
        service = null;
        loggedUser = null;
    });

    test('default getInstance', () => {
        assert.throw(BaseService.getInstance, ServerErrorException, /Must be overriden\!/);
    });

    test('constructor', () => {
        const dao: TestDao = new TestDao();
        // @ts-ignore: access to private constructor & attribute
        assert.strictEqual(new BaseService(dao).dao, dao);
    });

    test('getModelName()', () => {
        assert.strictEqual(service.modelName, 'TestModel');
    });

    test('getModelInstance()', () => {
        assert.isTrue(service.modelInstance instanceof TestModel);
    });

    suite('select()', (): void => {
        test('unauthenticated', async (): Promise<void> => {
            await service.select({}, {}, null)
                .then((): never => { throw new Error('Unexepected success!') })
                .catch((reason: any) => { if (!(reason instanceof NotAuthorizedException)) { throw reason; } });
        });
        test('Regular user', async (): Promise<void> => {
            const filters: any = {};
            const options: any = {};
            const entities: Array<TestModel> = []
            // @ts-ignore: access to private attribute
            const queryStub: SinonStub = stub(service.dao, 'query');
            queryStub.withArgs(filters, options).returns(Promise.resolve(entities));

            assert.strictEqual(await service.select(filters, options, loggedUser), entities);
            assert.strictEqual(filters.ownerId, '12345');

            assert.isTrue(queryStub.calledOnce);
            queryStub.restore();
        });
        test('Internal user', async (): Promise<void> => {
            const filters: any = {};
            const options: any = {};
            const entities: Array<TestModel> = []
            // @ts-ignore: access to private attribute
            const queryStub: SinonStub = stub(service.dao, 'query');
            queryStub.withArgs(filters, options).returns(Promise.resolve(entities));

            assert.strictEqual(await service.select(filters, options, User.Internal), entities);
            assert.isUndefined(filters.ownerId);

            assert.isTrue(queryStub.calledOnce);
            queryStub.restore();
        });
    });

    suite('get()', (): void => {
        test('unauthenticated', async (): Promise<void> => {
            await service.get(12345, null)
                .then((): never => { throw new Error('Unexepected success!') })
                .catch((reason: any) => { if (!(reason instanceof NotAuthorizedException)) { throw reason; } });
        });
        test('not found', async (): Promise<void> => {
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(service.dao, 'get');
            getStub.withArgs(12345).returns(Promise.resolve(null));

            await service.get(12345, loggedUser)
                .then((): never => { throw new Error('Unexepected success!') })
                .catch((reason: any) => { if (!(reason instanceof NotFoundException)) { throw reason; } });

            assert.isTrue(getStub.calledOnce);
            getStub.restore();
        });
        test('not owned by logged user', async (): Promise<void> => {
            const entity = new TestModel();
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(service.dao, 'get');
            getStub.withArgs(12345).returns(Promise.resolve(entity));

            await service.get(12345, loggedUser)
                .then((): never => { throw new Error('Unexepected success!') })
                .catch((reason: any) => { if (!(reason instanceof NotAuthorizedException)) { throw reason; } });

            assert.isTrue(getStub.calledOnce);
            getStub.restore();
        });
        test('owned by logged user', async (): Promise<void> => {
            const entity = Object.assign(new TestModel(), { ownerId: 12345 });
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(service.dao, 'get');
            getStub.withArgs(12345).returns(Promise.resolve(entity));

            assert.strictEqual(await service.get(12345, loggedUser), entity);

            assert.isTrue(getStub.calledOnce);
            getStub.restore();
        });
        test('triggered by internal user', async (): Promise<void> => {
            const entity = new TestModel();
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(service.dao, 'get');
            getStub.withArgs(12345).returns(Promise.resolve(entity));

            assert.strictEqual(await service.get(12345, User.Internal), entity);

            assert.isTrue(getStub.calledOnce);
            getStub.restore();
        });
    });

    suite('create()', (): void => {
        test('unauthenticated', async (): Promise<void> => {
            await service.create(<TestModel>{}, null)
                .then((): never => { throw new Error('Unexepected success!') })
                .catch((reason: any) => { if (!(reason instanceof NotAuthorizedException)) { throw reason; } });
        });
        test('success', async (): Promise<void> => {
            const entity = new TestModel();
            // @ts-ignore: access to private attribute
            const createStub: SinonStub = stub(service.dao, 'create');
            createStub.withArgs(entity).returns(Promise.resolve(12345));

            assert.strictEqual(await service.create(entity, loggedUser), 12345);

            assert.isTrue(createStub.calledOnce);
            createStub.restore();
        });
    });

    suite('update()', (): void => {
        test('unauthenticated', async (): Promise<void> => {
            await service.update(12345, <TestModel>{}, null)
                .then((): never => { throw new Error('Unexepected success!') })
                .catch((reason: any) => { if (!(reason instanceof NotAuthorizedException)) { throw reason; } });
        });
        test('not found', async (): Promise<void> => {
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(service.dao, 'get');
            getStub.withArgs(12345).returns(Promise.resolve(null));

            await service.update(12345, <TestModel>{}, loggedUser)
                .then((): never => { throw new Error('Unexepected success!') })
                .catch((reason: any) => { if (!(reason instanceof NotFoundException)) { throw reason; } });

            assert.isTrue(getStub.calledOnce);
            getStub.restore();
        });
        test('not owned by logged user', async (): Promise<void> => {
            const entity = new TestModel();
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(service.dao, 'get');
            getStub.withArgs(12345).returns(Promise.resolve(entity));

            await service.update(12345, entity, loggedUser)
                .then((): never => { throw new Error('Unexepected success!') })
                .catch((reason: any) => { if (!(reason instanceof NotAuthorizedException)) { throw reason; } });

            assert.isTrue(getStub.calledOnce);
            getStub.restore();
        });
        test('owned by logged user', async (): Promise<void> => {
            const entity = Object.assign(new TestModel(), { ownerId: 12345 });
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(service.dao, 'get');
            getStub.withArgs(12345).returns(Promise.resolve(entity));
            // @ts-ignore: access to private attribute
            const updateStub: SinonStub = stub(service.dao, 'update');
            updateStub.withArgs(12345, entity).returns(Promise.resolve(12345));

            assert.strictEqual(await service.update(12345, entity, loggedUser), 12345);

            assert.isTrue(getStub.calledOnce);
            assert.isTrue(updateStub.calledOnce);
            getStub.restore();
            updateStub.restore();
        });
        test('triggered by internal user', async (): Promise<void> => {
            const entity = new TestModel();
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(service.dao, 'get');
            getStub.withArgs(12345).returns(Promise.resolve(entity));
            // @ts-ignore: access to private attribute
            const updateStub: SinonStub = stub(service.dao, 'update');
            updateStub.withArgs(12345, entity).returns(Promise.resolve(12345));

            assert.strictEqual(await service.update(12345, entity, User.Internal), 12345);

            assert.isTrue(getStub.calledOnce);
            assert.isTrue(updateStub.calledOnce);
            getStub.restore();
            updateStub.restore();
        });
    });

    suite('delete()', (): void => {
        test('unauthenticated', async (): Promise<void> => {
            await service.delete(12345, null)
                .then((): never => { throw new Error('Unexepected success!') })
                .catch((reason: any) => { if (!(reason instanceof NotAuthorizedException)) { throw reason; } });
        });
        test('not found', async (): Promise<void> => {
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(service.dao, 'get');
            getStub.withArgs(12345).returns(Promise.resolve(null));

            await service.delete(12345, loggedUser)
                .then((): never => { throw new Error('Unexepected success!') })
                .catch((reason: any) => { if (!(reason instanceof NotFoundException)) { throw reason; } });

            assert.isTrue(getStub.calledOnce);
            getStub.restore();
        });
        test('not owned by logged user', async (): Promise<void> => {
            const entity = new TestModel();
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(service.dao, 'get');
            getStub.withArgs(12345).returns(Promise.resolve(entity));

            await service.delete(12345, loggedUser)
                .then((): never => { throw new Error('Unexepected success!') })
                .catch((reason: any) => { if (!(reason instanceof NotAuthorizedException)) { throw reason; } });

            assert.isTrue(getStub.calledOnce);
            getStub.restore();
        });
        test('owned by logged user', async (): Promise<void> => {
            const entity = Object.assign(new TestModel(), { ownerId: 12345 });
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(service.dao, 'get');
            getStub.withArgs(12345).returns(Promise.resolve(entity));
            // @ts-ignore: access to private attribute
            const deleteStub: SinonStub = stub(service.dao, 'delete');
            deleteStub.withArgs(12345, entity).returns(Promise.resolve(12345));

            await service.delete(12345, loggedUser);

            assert.isTrue(getStub.calledOnce);
            assert.isTrue(deleteStub.calledOnce);
            getStub.restore();
            deleteStub.restore();
        });
        test('triggered by internal user', async (): Promise<void> => {
            const entity = new TestModel();
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(service.dao, 'get');
            getStub.withArgs(12345).returns(Promise.resolve(entity));
            // @ts-ignore: access to private attribute
            const deleteStub: SinonStub = stub(service.dao, 'delete');
            deleteStub.withArgs(12345, entity).returns(Promise.resolve(12345));

            await service.delete(12345, User.Internal);

            assert.isTrue(getStub.calledOnce);
            assert.isTrue(deleteStub.calledOnce);
            getStub.restore();
            deleteStub.restore();
        });
    });
});