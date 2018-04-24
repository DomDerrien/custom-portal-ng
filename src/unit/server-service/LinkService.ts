import intern from 'intern';

import { LinkService } from '../../server/service/LinkService';
import { LinkDao } from '../../server/dao/LinkDao';
import { CategoryService } from '../../server/service/CategoryService';
import { Link } from '../../server/model/Link';
import { Category } from '../../server/model/Category';
import { User } from '../../server/model/User';
import { ClientErrorException } from '../../server/exceptions/ClientErrorException';

const { suite, test, beforeEach, afterEach } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');
import { stub, SinonStub } from 'sinon';

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    let service: LinkService;

    beforeEach((): void => {
        // @ts-ignore: access to private constructor
        service = new LinkService();
    });
    afterEach((): void => { service = null; });

    test('getInstance()', (): void => {
        const service: LinkService = LinkService.getInstance();
        assert.isTrue(service instanceof LinkService);
        assert.strictEqual(LinkService.getInstance(), service);
        assert.strictEqual(LinkService.getInstance(), service);
    });

    test('constructor', () => {
        // @ts-ignore: access to private constructor & attribute
        assert.isTrue(new LinkService().dao instanceof LinkDao);
    });

    test('getChildService()', (): void => {
        // @ts-ignore: access to private constructor & attribute
        assert.isTrue(service.getParentService() instanceof CategoryService);
    });

    suite('select()', () => {
        test('with categoryId', async (): Promise<void> => {
            // @ts-ignore: partial definition
            const parentService: CategoryService = <CategoryService>{
                get(id: number, loggedUser: User): Category { return null; }
            }
            // @ts-ignore: access to private attribute
            const getParentServiceStub: SinonStub = stub(service, 'getParentService');
            getParentServiceStub.withArgs().returns(parentService);
            const getStub: SinonStub = stub(parentService, 'get');
            getStub.withArgs(12345, User.Internal).returns(Promise.resolve(new Category()));
            // @ts-ignore: access to private attribute
            const queryStub: SinonStub = stub(service.dao, 'query');
            const entities: Array<Link> = [];
            queryStub.withArgs({ categoryId: '12345' }, {}).returns(entities);

            assert.strictEqual(await service.select({ categoryId: '12345' }, {}, User.Internal), entities);

            assert.isTrue(getParentServiceStub.calledOnce);
            assert.isTrue(getStub.calledOnce);
            assert.isTrue(queryStub.calledOnce);
            getParentServiceStub.restore();
            getStub.restore();
            queryStub.restore();
        });
        test('without categoryId', async (): Promise<void> => {
            // @ts-ignore: access to private attribute
            const getParentServiceStub: SinonStub = stub(service, 'getParentService');
            // @ts-ignore: access to private attribute
            const queryStub: SinonStub = stub(service.dao, 'query');
            const entities: Array<Link> = [];
            queryStub.withArgs({}, {}).returns(entities);

            assert.strictEqual(await service.select({}, {}, User.Internal), entities);

            assert.isTrue(getParentServiceStub.notCalled);
            assert.isTrue(queryStub.calledOnce);
            queryStub.restore();
        });
    });

    suite('create()', () => {
        test('without categoryId', async (): Promise<void> => {
            await service.create(<Link>{}, User.Internal)
                .then((): never => { throw new Error('Unexpected success!'); })
                .catch((reason: any): void => { if (!(reason instanceof ClientErrorException)) { throw reason; }; });
        });
        test('with categoryId', async (): Promise<void> => {
            // @ts-ignore: partial definition
            const parentService: CategoryService = <CategoryService>{
                get(id: number, loggedUser: User): Category { return null; }
            }
            // @ts-ignore: access to private attribute
            const getParentServiceStub: SinonStub = stub(service, 'getParentService');
            getParentServiceStub.withArgs().returns(parentService);
            const getStub: SinonStub = stub(parentService, 'get');
            getStub.withArgs(12345, User.Internal).returns(Promise.resolve(new Category()));
            // @ts-ignore: access to private attribute
            const createStub: SinonStub = stub(service.dao, 'create');
            createStub.withArgs({ categoryId: 12345, ownerId: User.Internal.id }).returns(12345);

            assert.strictEqual(await service.create(<Link>{ categoryId: 12345 }, User.Internal), 12345);

            assert.isTrue(getParentServiceStub.calledOnce);
            assert.isTrue(getStub.calledOnce);
            assert.isTrue(createStub.calledOnce);
            getParentServiceStub.restore();
            getStub.restore();
            createStub.restore();
        });
    });

    test('update()', async (): Promise<void> => {
        const entity: Link = Object.assign(new Link(), { categoryId: 67890 });
        // @ts-ignore: access to private attribute
        const getStub: SinonStub = stub(service.dao, 'get');
        getStub.withArgs(12345).returns(entity);
        // @ts-ignore: access to private attribute
        const updateStub: SinonStub = stub(service.dao, 'update');
        updateStub.withArgs(12345, entity).returns(12345);

        assert.strictEqual(await service.update(12345, entity, User.Internal), 12345);
        assert.isUndefined(entity.categoryId);

        assert.isTrue(getStub.calledOnce);
        assert.isTrue(updateStub.calledOnce);
        getStub.restore();
        updateStub.restore();
    });
});