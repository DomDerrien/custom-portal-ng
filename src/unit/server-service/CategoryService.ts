import intern from 'intern';

import { CategoryService } from '../../server/service/CategoryService';
import { CategoryDao } from '../../server/dao/CategoryDao';
import { QueryOptions } from '../../server/dao/BaseDao';
import { LinkService } from '../../server/service/LinkService';
import { Category } from '../../server/model/Category';
import { Link } from '../../server/model/Link';
import { User } from '../../server/model/User';

const { suite, test, beforeEach, afterEach } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');
import { stub, SinonStub } from 'sinon';

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    let service: CategoryService;

    beforeEach((): void => {
        // @ts-ignore: access to private constructor
        service = new CategoryService();
    });
    afterEach((): void => { service = null; });

    test('getInstance()', (): void => {
        const service: CategoryService = CategoryService.getInstance();
        assert.isTrue(service instanceof CategoryService);
        assert.strictEqual(CategoryService.getInstance(), service);
        assert.strictEqual(CategoryService.getInstance(), service);
    });

    test('constructor', () => {
        // @ts-ignore: access to private constructor & attribute
        assert.isTrue(new CategoryService().dao instanceof CategoryDao);
    });

    test('getChildService()', () => {
        // @ts-ignore: access to private constructor & attribute
        assert.isTrue(service.getChildService() instanceof LinkService);
    });

    suite('create()', (): void => {
        test('with default positionIdx', async (): Promise<void> => {
            const entity: Category = new Category();
            // @ts-ignore: access to private attribute
            const createStub: SinonStub = stub(service.dao, 'create');
            createStub.withArgs(entity).returns(12345);

            assert.strictEqual(await service.create(entity, User.Internal), 12345);
            assert.strictEqual(entity.positionIdx, 0);

            assert.isTrue(createStub.calledOnce);
            createStub.restore();
        });
        test('with given positionIdx', async (): Promise<void> => {
            const entity: Category = Object.assign(new Category(), { positionIdx: 24 });
            // @ts-ignore: access to private attribute
            const createStub: SinonStub = stub(service.dao, 'create');
            createStub.withArgs(entity).returns(12345);

            assert.strictEqual(await service.create(entity, User.Internal), 12345);
            assert.strictEqual(entity.positionIdx, 24);

            assert.isTrue(createStub.calledOnce);
            createStub.restore();
        });
    });

    suite('update()', (): void => {
        test('with given positionIdx', async (): Promise<void> => {
            const entity: Category = Object.assign(new Category(), { positionIdx: '42' });
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(service.dao, 'get');
            getStub.withArgs(12345).returns(entity);
            // @ts-ignore: access to private attribute
            const updateStub: SinonStub = stub(service.dao, 'update');
            updateStub.withArgs(12345, entity).returns(12345);

            assert.strictEqual(await service.update(12345, entity, User.Internal), 12345);
            assert.strictEqual(entity.positionIdx, 42);

            assert.isTrue(getStub.calledOnce);
            assert.isTrue(updateStub.calledOnce);
            getStub.restore();
            updateStub.restore();
        });
        test('without given positionIdx', async (): Promise<void> => {
            const entity: Category = new Category();
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(service.dao, 'get');
            getStub.withArgs(12345).returns(entity);
            // @ts-ignore: access to private attribute
            const updateStub: SinonStub = stub(service.dao, 'update');
            updateStub.withArgs(12345, entity).returns(12345);

            assert.strictEqual(await service.update(12345, entity, User.Internal), 12345);
            assert.isUndefined(entity.positionIdx);

            assert.isTrue(getStub.calledOnce);
            assert.isTrue(updateStub.calledOnce);
            getStub.restore();
            updateStub.restore();
        });
    });

    suite('delete()', (): void => {
        test('with given positionIdx', async (): Promise<void> => {
            const entity: Category = Object.assign(new Category(), { positionIdx: '42' });
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(service.dao, 'get');
            getStub.withArgs(12345).returns(entity);
            // @ts-ignore: partial definition
            const childService: LinkService = <LinkService>{
                select(filters: any, options: QueryOptions, loggedUser: User): Array<Link> { return null; },
                delete(id: number, loggedUser: User): void { }
            }
            // @ts-ignore: access to private attribute
            const getChildServiceStub: SinonStub = stub(service, 'getChildService');
            getChildServiceStub.withArgs().returns(childService);
            const entities: Array<Link> = [Object.assign(new Link(), { id: 12345 }), Object.assign(new Link(), { id: 67890 })];
            const selectChildrenStub: SinonStub = stub(childService, 'select');
            selectChildrenStub.withArgs().returns(entities);
            const deleteChildStub: SinonStub = stub(childService, 'delete');
            deleteChildStub.withArgs(12345, User.Internal).returns(Promise.resolve());
            deleteChildStub.withArgs(67890, User.Internal).returns(Promise.resolve());
            // @ts-ignore: access to private attribute
            const deleteStub: SinonStub = stub(service.dao, 'delete');
            deleteStub.withArgs(12345, entity).returns(12345);

            await service.delete(12345, User.Internal);

            assert.isTrue(getStub.called);
            assert.isTrue(getChildServiceStub.calledOnce);
            assert.isTrue(selectChildrenStub.calledOnce);
            assert.isTrue(deleteChildStub.calledTwice);
            assert.isTrue(deleteChildStub.calledWithExactly(12345, User.Internal));
            assert.isTrue(deleteChildStub.calledWithExactly(67890, User.Internal));
            assert.isTrue(deleteStub.calledOnce);
            getStub.restore();
            getChildServiceStub.restore();
            selectChildrenStub.restore();
            deleteChildStub.restore();
            deleteStub.restore();
        });
    });
});