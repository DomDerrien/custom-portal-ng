import intern from 'intern';

import { UserService } from '../../server/service/UserService';
import { UserDao } from '../../server/dao/UserDao';
import { User } from '../../server/model/User';
import { NotAuthorizedException } from '../../server/exception/NotAuthorizedException';

const { suite, test, beforeEach, afterEach } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');
import { stub, SinonStub } from 'sinon';

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    let service: UserService;
    let loggedUser: User;

    beforeEach((): void => {
        // @ts-ignore: access to private constructor
        service = new UserService();
        loggedUser = Object.assign(new User(), { id: 12345 });
    });
    afterEach((): void => {
        service = null;
        loggedUser = null;
    });

    test('getInstance()', (): void => {
        const service: UserService = UserService.getInstance();
        assert.isTrue(service instanceof UserService);
        assert.strictEqual(UserService.getInstance(), service);
        assert.strictEqual(UserService.getInstance(), service);
    });

    test('constructor', () => {
        // @ts-ignore: access to private constructor & attribute
        assert.isTrue(new UserService().dao instanceof UserDao);
    });

    suite('get()', (): void => {
        test('not identified', async (): Promise<void> => {
            await service.get(12345, null)
                .then((): never => { throw new Error('Unexpected success!'); })
                .catch((reason: any): void => { if (!(reason instanceof NotAuthorizedException)) { throw reason; } });
        });
        test('not self', async (): Promise<void> => {
            await service.get(67890, loggedUser)
                .then((): never => { throw new Error('Unexpected success!'); })
                .catch((reason: any): void => { if (!(reason instanceof NotAuthorizedException)) { throw reason; } });
        });
        test('get self', async (): Promise<void> => {
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(service.dao, 'get');
            getStub.withArgs(12345).returns(loggedUser);

            assert.strictEqual(await service.get(12345, loggedUser), loggedUser);

            assert.isTrue(getStub.calledOnce);
            getStub.restore();
        });
        test('get anyone by internal user', async (): Promise<void> => {
            const entity: User = new User();
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(service.dao, 'get');
            getStub.withArgs(12345).returns(entity);

            assert.strictEqual(await service.get(12345, User.Internal), entity);

            assert.isTrue(getStub.calledOnce);
            getStub.restore();
        });
    });

    suite('create()', (): void => {
        test('by normal user', async (): Promise<void> => {
            await service.create(<User>{}, loggedUser)
                .then((): never => { throw new Error('Unexpected success!'); })
                .catch((reason: any): void => { if (!(reason instanceof NotAuthorizedException)) { throw reason; } });
        });
        test('by internal user', async (): Promise<void> => {
            const entity: User = new User();
            // @ts-ignore: access to private attribute
            const createStub: SinonStub = stub(service.dao, 'create');
            createStub.withArgs(entity).returns(12345);

            assert.strictEqual(await service.create(entity, User.Internal), 12345);
            assert.strictEqual(entity.ownerId, User.Internal.id);

            assert.isTrue(createStub.calledOnce);
            createStub.restore();
        });
    });

    suite('update()', (): void => {
        test('not authenticated', async (): Promise<void> => {
            await service.update(12345, <User>{}, null)
                .then((): never => { throw new Error('Unexpected success!'); })
                .catch((reason: any): void => { if (!(reason instanceof NotAuthorizedException)) { throw reason; } });
        });
        test('not self', async (): Promise<void> => {
            await service.update(67890, <User>{}, loggedUser)
                .then((): never => { throw new Error('Unexpected success!'); })
                .catch((reason: any): void => { if (!(reason instanceof NotAuthorizedException)) { throw reason; } });
        });
        test('by internal user', async (): Promise<void> => {
            const entity: User = new User();
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(service.dao, 'get');
            getStub.withArgs(12345).returns(entity);
            // @ts-ignore: access to private attribute
            const updateStub: SinonStub = stub(service.dao, 'update');
            updateStub.withArgs(12345, entity).returns(12345);

            assert.strictEqual(await service.update(12345, entity, User.Internal), 12345);

            assert.isTrue(getStub.calledOnce);
            assert.isTrue(updateStub.calledOnce);
            getStub.restore();
            updateStub.restore();
        });
    });

    test('delete()', async (): Promise<void> => {
        await service.delete(12345, loggedUser)
            .then((): never => { throw new Error('Unexpected success!'); })
            .catch((reason: any): void => { if (!(reason instanceof NotAuthorizedException)) { throw reason; } });
    });
});