import intern from 'intern';
import * as express from 'express';

import { BaseModel } from '../../server/model/BaseModel';
import { BaseDao } from '../../server/dao/BaseDao';
import { BaseService } from '../../server/service/BaseService';
import { BaseResource } from '../../server/resource/BaseResource';
import { AuthResource } from '../../server/resource/AuthResource';
import { ServerErrorException } from '../../server/exception/ServerErrorException';
import { NotAuthorizedException } from '../../server/exception/NotAuthorizedException';
import { ClientErrorException } from '../../server/exception/ClientErrorException';
import { User } from '../../server/model/User';

const { suite, test, beforeEach, afterEach } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');
import { stub, SinonStub } from 'sinon';

class TestModel extends BaseModel {
    static getInstance(): TestModel { return new TestModel(); }
};
// @ts-ignore: abstract methods don't need to be implemented for the tests
class TestDao extends BaseDao<TestModel> {
    static getInstance(): TestDao { return new TestDao(); }
    constructor() { super(TestModel.getInstance()); }
}
class TestService extends BaseService<TestDao> {
    static getInstance(): TestService { return new TestService(); }
    constructor() { super(TestDao.getInstance()); }
}
class TestResource extends BaseResource<TestService> {
    static getInstance(): TestResource { return new TestResource(); }
    constructor() { super(new TestService()); }
}

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    let resource: TestResource;
    let response: express.Response;

    beforeEach((): void => {
        resource = new TestResource();

        response = <express.Response>{
            contentType(type: string): express.Response { return null; },
            cookie(name: string, val: string, options: express.CookieOptions): express.Response { return null; },
            location(url: string): express.Response { return null; },
            sendStatus(code: number): express.Response { return null; },
            setHeader(name: string, value: string): void { },
            status(code: number): express.Response { return null; },
            send(data: string): express.Response { return null; }
        };
    });
    afterEach((): void => { resource = null; });

    test('default getInstance', () => {
        assert.throw(BaseResource.getInstance, ServerErrorException, /Must be overriden\!/);
    });

    test('constructor', () => {
        const getInstanceStub: SinonStub = stub(AuthResource, 'getInstance');
        const authResource: AuthResource = <AuthResource>{};
        getInstanceStub.withArgs().returns(authResource);

        const service: BaseService<BaseDao<BaseModel>> = <BaseService<BaseDao<BaseModel>>>{};
        // @ts-ignore: access to private constructor
        const resource: BaseResource<BaseService<BaseDao<BaseModel>>> = new BaseResource(service);
        // @ts-ignore: access to private attribute
        assert.strictEqual(resource.service, service);
        // @ts-ignore: access to private attribute
        assert.strictEqual(resource.authResource, authResource);

        assert.isTrue(getInstanceStub.calledOnce);
        getInstanceStub.restore();
    });

    test('getRouter()', (): void => {
        const RouterStub: SinonStub = stub(express, 'Router');
        const router: express.Router = <express.Router>{
            get(path: string, handler: express.RequestHandler): express.Router { return null; },
            post(path: string, handler: express.RequestHandler): express.Router { return null; },
            put(path: string, handler: express.RequestHandler): express.Router { return null; },
            delete(path: string, handler: express.RequestHandler): express.Router { return null; }
        };
        RouterStub.withArgs().returns(router);
        const getStub: SinonStub = stub(router, 'get');
        const postStub: SinonStub = stub(router, 'post');
        const putStub: SinonStub = stub(router, 'put');
        const deleteStub: SinonStub = stub(router, 'delete');
        // @ts-ignore: access to private method
        const getSelectProcessorStub: SinonStub = stub(resource, 'getSelectProcessor');
        const getSelectProcessor: (request: express.Request, response: express.Response) => void = () => { console.log(' select ') };
        getSelectProcessorStub.withArgs().returns(getSelectProcessor);
        // @ts-ignore: access to private method
        const getGetProcessorStub: SinonStub = stub(resource, 'getGetProcessor');
        const getGetProcessor: (request: express.Request, response: express.Response) => void = () => { console.log(' get ') };
        getGetProcessorStub.withArgs().returns(getGetProcessor);
        // @ts-ignore: access to private method
        const getCreateProcessorStub: SinonStub = stub(resource, 'getCreateProcessor');
        const getCreateProcessor: (request: express.Request, response: express.Response) => void = () => { console.log(' create ') };
        getCreateProcessorStub.withArgs().returns(getCreateProcessor);
        // @ts-ignore: access to private method
        const getUpdateProcessorStub: SinonStub = stub(resource, 'getUpdateProcessor');
        const getUpdateProcessor: (request: express.Request, response: express.Response) => void = () => { console.log(' update ') };
        getUpdateProcessorStub.withArgs().returns(getUpdateProcessor);
        // @ts-ignore: access to private method
        const getDeleteProcessorStub: SinonStub = stub(resource, 'getDeleteProcessor');
        const getDeleteProcessor: (request: express.Request, response: express.Response) => void = () => { console.log(' delete ') };
        getDeleteProcessorStub.withArgs().returns(getDeleteProcessor);

        assert.strictEqual(resource.getRouter(), router);

        assert.isTrue(RouterStub.calledOnce);
        assert.isTrue(getStub.calledTwice);
        assert.isTrue(getStub.calledWithExactly('/api/v1/TestModel/', getSelectProcessor));
        assert.isTrue(getStub.calledWithExactly('/api/v1/TestModel/:id(\\d+)', getGetProcessor));
        assert.isTrue(postStub.calledOnceWithExactly('/api/v1/TestModel/', getCreateProcessor));
        assert.isTrue(putStub.calledOnceWithExactly('/api/v1/TestModel/:id(\\d+)', getUpdateProcessor));
        assert.isTrue(deleteStub.calledOnceWithExactly('/api/v1/TestModel/:id(\\d+)', getDeleteProcessor));
        assert.isTrue(getSelectProcessorStub.calledOnce);
        assert.isTrue(getGetProcessorStub.calledOnce);
        assert.isTrue(getCreateProcessorStub.calledOnce);
        assert.isTrue(getUpdateProcessorStub.calledOnce);
        assert.isTrue(getDeleteProcessorStub.calledOnce);
        RouterStub.restore();
        getStub.restore();
        postStub.restore();
        putStub.restore();
        deleteStub.restore();
        getSelectProcessorStub.restore();
        getGetProcessorStub.restore();
        getCreateProcessorStub.restore();
        getUpdateProcessorStub.restore();
        getDeleteProcessorStub.restore();
    });

    suite('getSelectProcessor()', (): void => {
        test('no header, no result', async (): Promise<void> => {
            const loggedUser: User = <User>{};
            const request: express.Request = <express.Request>{
                headers: { 'accept': 'headers' },
                query: { isQuery: true }
            };

            // @ts-ignore: access to private attribute
            const getLoggedUserStub: SinonStub = stub(resource.authResource, 'getLoggedUser');
            getLoggedUserStub.withArgs(request).returns(Promise.resolve(loggedUser));
            // @ts-ignore: access to private attribute
            const selectStub: SinonStub = stub(resource.service, 'select');
            selectStub.withArgs(request.query, { idOnly: false, sortBy: [] }, loggedUser).returns(Promise.resolve([]));
            const statusStub: SinonStub = stub(response, 'status');
            statusStub.withArgs(204).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('text/plain').returns(response);
            const sendStub: SinonStub = stub(response, 'send');
            sendStub.withArgs('No content matches the given criteria').returns(response);

            // @ts-ignore: access to private method
            const selectProcessor: (request: express.Request, response: express.Response) => void = resource.getSelectProcessor();
            await selectProcessor(request, response);

            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(selectStub.calledOnce);
            assert.isTrue(statusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStub.calledOnce);
            getLoggedUserStub.restore();
            selectStub.restore();
            statusStub.restore();
            contentTypeStub.restore();
            sendStub.restore();
        });
        test('some headers, `range` with wrong format, all results', async (): Promise<void> => {
            const loggedUser: User = <User>{};
            // @ts-ignore: because custom header names are not part of the express.Request definition
            const request: express.Request = <express.Request>{
                headers: { 'x-ids-only': 'false', 'x-sort-by': 'created', range: 'pages=1-2' },
                query: { isQuery: true }
            };

            // @ts-ignore: access to private attribute
            const getLoggedUserStub: SinonStub = stub(resource.authResource, 'getLoggedUser');
            getLoggedUserStub.withArgs(request).returns(Promise.resolve(loggedUser));
            // @ts-ignore: access to private attribute
            const selectStub: SinonStub = stub(resource.service, 'select');
            const entities: Array<TestModel> = [new TestModel()];
            entities.totalCount = entities.length;
            selectStub.withArgs(request.query, { idOnly: false, sortBy: ['created'] }, loggedUser).returns(Promise.resolve(entities));
            const setHeaderStub: SinonStub = stub(response, 'setHeader');
            const statusStub: SinonStub = stub(response, 'status');
            statusStub.withArgs(200).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('application/json').returns(response);
            const sendStub: SinonStub = stub(response, 'send');
            sendStub.withArgs(entities).returns(response);

            // @ts-ignore: access to private method
            const selectProcessor: (request: express.Request, response: express.Response) => void = resource.getSelectProcessor();
            await selectProcessor(request, response);

            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(selectStub.calledOnce);
            assert.isTrue(setHeaderStub.calledOnceWith('content-range', 'items 0-0/1'));
            assert.isTrue(statusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStub.calledOnce);
            getLoggedUserStub.restore();
            selectStub.restore();
            statusStub.restore();
            contentTypeStub.restore();
            sendStub.restore();
        });
        test('all headers, ids only, partial results', async (): Promise<void> => {
            const loggedUser: User = <User>{};
            // @ts-ignore: because custom header names are not part of the express.Request definition
            const request: express.Request = <express.Request>{
                headers: { 'x-ids-only': 'true', range: 'items=100-109' },
                query: { isQuery: true }
            };

            // @ts-ignore: access to private attribute
            const getLoggedUserStub: SinonStub = stub(resource.authResource, 'getLoggedUser');
            getLoggedUserStub.withArgs(request).returns(Promise.resolve(loggedUser));
            // @ts-ignore: access to private attribute
            const selectStub: SinonStub = stub(resource.service, 'select');
            const entities: Array<TestModel> = [Object.assign(new TestModel(), { id: 12345 }), Object.assign(new TestModel(), { id: 67890 })];
            selectStub.withArgs(request.query, { idOnly: true, sortBy: [], rangeStart: 100, rangeEnd: 109 }, loggedUser).returns(Promise.resolve(entities));
            const setHeaderStub: SinonStub = stub(response, 'setHeader');
            const statusStub: SinonStub = stub(response, 'status');
            statusStub.withArgs(206).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('application/json').returns(response);
            const sendStub: SinonStub = stub(response, 'send');
            sendStub.withArgs([12345, 67890]).returns(response);

            // @ts-ignore: access to private method
            const selectProcessor: (request: express.Request, response: express.Response) => void = resource.getSelectProcessor();
            await selectProcessor(request, response);

            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(selectStub.calledOnce);
            assert.isTrue(setHeaderStub.calledOnceWith('content-range', 'items 100-101/*'));
            assert.isTrue(statusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStub.calledOnce);
            getLoggedUserStub.restore();
            selectStub.restore();
            statusStub.restore();
            contentTypeStub.restore();
            sendStub.restore();
        });
        test('service failure', async (): Promise<void> => {
            const loggedUser: User = <User>{};
            // @ts-ignore: because custom header names are not part of the express.Request definition
            const request: express.Request = <express.Request>{
                query: { isQuery: true }
            };

            // @ts-ignore: access to private attribute
            const getLoggedUserStub: SinonStub = stub(resource.authResource, 'getLoggedUser');
            getLoggedUserStub.withArgs(request).returns(Promise.resolve(loggedUser));
            // @ts-ignore: access to private attribute
            const selectStub: SinonStub = stub(resource.service, 'select');
            selectStub.withArgs(request.query, {}, loggedUser).returns(Promise.reject(new NotAuthorizedException('Done in purpose!')));
            const statusStub: SinonStub = stub(response, 'status');
            statusStub.withArgs(401).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('text/plain').returns(response);
            const sendStub: SinonStub = stub(response, 'send');
            sendStub.withArgs('The corresponding request failed! -- Error: Done in purpose!').returns(response);

            // @ts-ignore: access to private method
            const selectProcessor: (request: express.Request, response: express.Response) => void = resource.getSelectProcessor();
            await selectProcessor(request, response);

            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(selectStub.calledOnce);
            assert.isTrue(statusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStub.calledOnce);
            getLoggedUserStub.restore();
            selectStub.restore();
            statusStub.restore();
            contentTypeStub.restore();
            sendStub.restore();
        });
        test('unexpected failure', async (): Promise<void> => {
            const loggedUser: User = <User>{};
            // @ts-ignore: because custom header names are not part of the express.Request definition
            const request: express.Request = <express.Request>{
                query: { isQuery: true }
            };

            // @ts-ignore: access to private attribute
            const getLoggedUserStub: SinonStub = stub(resource.authResource, 'getLoggedUser');
            getLoggedUserStub.withArgs(request).returns(Promise.resolve(loggedUser));
            // @ts-ignore: access to private attribute
            const selectStub: SinonStub = stub(resource.service, 'select');
            selectStub.withArgs(request.query, {}, loggedUser).returns(Promise.reject(new Error('Done in purpose!')));
            const statusStub: SinonStub = stub(response, 'status');
            statusStub.withArgs(404).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('text/plain').returns(response);
            const sendStub: SinonStub = stub(response, 'send');
            sendStub.withArgs('The corresponding request failed! -- Error: Done in purpose!').returns(response);

            // @ts-ignore: access to private method
            const selectProcessor: (request: express.Request, response: express.Response) => void = resource.getSelectProcessor();
            await selectProcessor(request, response);

            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(selectStub.calledOnce);
            assert.isTrue(statusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStub.calledOnce);
            getLoggedUserStub.restore();
            selectStub.restore();
            statusStub.restore();
            contentTypeStub.restore();
            sendStub.restore();
        });
    });

    suite('getGetProcessor()', (): void => {
        test('success', async (): Promise<void> => {
            const loggedUser: User = <User>{};
            // @ts-ignore: because custom header names are not part of the express.Request definition
            const request: express.Request = <express.Request>{
                params: { id: 12345 }
            };

            // @ts-ignore: access to private attribute
            const getLoggedUserStub: SinonStub = stub(resource.authResource, 'getLoggedUser');
            getLoggedUserStub.withArgs(request).returns(Promise.resolve(loggedUser));
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(resource.service, 'get');
            const entity: TestModel = new TestModel();
            getStub.withArgs(12345, loggedUser).returns(Promise.resolve(entity));
            const statusStub: SinonStub = stub(response, 'status');
            statusStub.withArgs(200).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('application/json').returns(response);
            const sendStub: SinonStub = stub(response, 'send');
            sendStub.withArgs(entity).returns(response);

            // @ts-ignore: access to private method
            const getProcessor: (request: express.Request, response: express.Response) => void = resource.getGetProcessor();
            await getProcessor(request, response);

            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(getStub.calledOnce);
            assert.isTrue(statusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStub.calledOnce);
            getLoggedUserStub.restore();
            getStub.restore();
            statusStub.restore();
            contentTypeStub.restore();
            sendStub.restore();
        });
        test('service failure', async (): Promise<void> => {
            const loggedUser: User = <User>{};
            // @ts-ignore: because custom header names are not part of the express.Request definition
            const request: express.Request = <express.Request>{
                params: { id: 12345 }
            };

            // @ts-ignore: access to private attribute
            const getLoggedUserStub: SinonStub = stub(resource.authResource, 'getLoggedUser');
            getLoggedUserStub.withArgs(request).returns(Promise.resolve(loggedUser));
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(resource.service, 'get');
            getStub.withArgs(12345, loggedUser).returns(Promise.reject(new ClientErrorException('Done in purpose!')));
            const statusStub: SinonStub = stub(response, 'status');
            statusStub.withArgs(400).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('text/plain').returns(response);
            const sendStub: SinonStub = stub(response, 'send');
            sendStub.withArgs('The corresponding request failed! -- Done in purpose!').returns(response);

            // @ts-ignore: access to private method
            const getProcessor: (request: express.Request, response: express.Response) => void = resource.getGetProcessor();
            await getProcessor(request, response);

            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(getStub.calledOnce);
            assert.isTrue(statusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStub.calledOnce);
            getLoggedUserStub.restore();
            getStub.restore();
            statusStub.restore();
            contentTypeStub.restore();
            sendStub.restore();
        });
        test('unexpected failure', async (): Promise<void> => {
            const loggedUser: User = <User>{};
            // @ts-ignore: because custom header names are not part of the express.Request definition
            const request: express.Request = <express.Request>{
                params: { id: 12345 }
            };

            // @ts-ignore: access to private attribute
            const getLoggedUserStub: SinonStub = stub(resource.authResource, 'getLoggedUser');
            getLoggedUserStub.withArgs(request).returns(Promise.resolve(loggedUser));
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(resource.service, 'get');
            getStub.withArgs(12345, loggedUser).returns(Promise.reject(new Error('Done in purpose!')));
            const statusStub: SinonStub = stub(response, 'status');
            statusStub.withArgs(404).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('text/plain').returns(response);
            const sendStub: SinonStub = stub(response, 'send');
            sendStub.withArgs('The corresponding request failed! -- Error: Done in purpose!').returns(response);

            // @ts-ignore: access to private method
            const getProcessor: (request: express.Request, response: express.Response) => void = resource.getGetProcessor();
            await getProcessor(request, response);

            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(getStub.calledOnce);
            assert.isTrue(statusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStub.calledOnce);
            getLoggedUserStub.restore();
            getStub.restore();
            statusStub.restore();
            contentTypeStub.restore();
            sendStub.restore();
        });
    });

    suite('getCreateProcessor()', (): void => {
        test('success', async (): Promise<void> => {
            const loggedUser: User = <User>{};
            // @ts-ignore: because custom header names are not part of the express.Request definition
            const request: express.Request = <express.Request>{
                body: { anyAttr: 'anyVal' },
                originalUrl: 'here'
            };

            // @ts-ignore: access to private attribute
            const getLoggedUserStub: SinonStub = stub(resource.authResource, 'getLoggedUser');
            getLoggedUserStub.withArgs(request).returns(Promise.resolve(loggedUser));
            // @ts-ignore: access to private attribute
            const createStub: SinonStub = stub(resource.service, 'create');
            const entity: TestModel = Object.assign(new TestModel(), { anyAttr: 'anyVal' });
            createStub.withArgs(entity, loggedUser).returns(Promise.resolve(12345));
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('text/plain').returns(response);
            const locationStub: SinonStub = stub(response, 'location');
            locationStub.withArgs('here/12345').returns(response);
            const sendStatusStub: SinonStub = stub(response, 'sendStatus');
            sendStatusStub.withArgs(201).returns(response);

            // @ts-ignore: access to private method
            const createProcessor: (request: express.Request, response: express.Response) => void = resource.getCreateProcessor();
            await createProcessor(request, response);

            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(createStub.calledOnce);
            assert.isTrue(sendStatusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(locationStub.calledOnce);
            getLoggedUserStub.restore();
            createStub.restore();
            sendStatusStub.restore();
            contentTypeStub.restore();
            locationStub.restore();
        });
        test('service failure', async (): Promise<void> => {
            const loggedUser: User = <User>{};
            // @ts-ignore: because custom header names are not part of the express.Request definition
            const request: express.Request = <express.Request>{
                body: { anyAttr: 'anyVal' },
                originalUrl: 'here'
            };

            // @ts-ignore: access to private attribute
            const getLoggedUserStub: SinonStub = stub(resource.authResource, 'getLoggedUser');
            getLoggedUserStub.withArgs(request).returns(Promise.resolve(loggedUser));
            // @ts-ignore: access to private attribute
            const createStub: SinonStub = stub(resource.service, 'create');
            const entity: TestModel = Object.assign(new TestModel(), { anyAttr: 'anyVal' });
            createStub.withArgs(entity, loggedUser).returns(Promise.reject(new ClientErrorException('Done in purpose!')));
            const statusStub: SinonStub = stub(response, 'status');
            statusStub.withArgs(400).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('text/plain').returns(response);
            const sendStub: SinonStub = stub(response, 'send');
            sendStub.withArgs('Creation failed! -- Error: Done in purpose!').returns(response);

            // @ts-ignore: access to private method
            const createProcessor: (request: express.Request, response: express.Response) => void = resource.getCreateProcessor();
            await createProcessor(request, response);

            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(createStub.calledOnce);
            assert.isTrue(statusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStub.calledOnce);
            getLoggedUserStub.restore();
            createStub.restore();
            statusStub.restore();
            contentTypeStub.restore();
            sendStub.restore();
        });
        test('unexpected failure', async (): Promise<void> => {
            const loggedUser: User = <User>{};
            // @ts-ignore: because custom header names are not part of the express.Request definition
            const request: express.Request = <express.Request>{
                body: { anyAttr: 'anyVal' },
                originalUrl: 'here'
            };

            // @ts-ignore: access to private attribute
            const getLoggedUserStub: SinonStub = stub(resource.authResource, 'getLoggedUser');
            getLoggedUserStub.withArgs(request).returns(Promise.resolve(loggedUser));
            // @ts-ignore: access to private attribute
            const createStub: SinonStub = stub(resource.service, 'create');
            const entity: TestModel = Object.assign(new TestModel(), { anyAttr: 'anyVal' });
            createStub.withArgs(entity, loggedUser).returns(Promise.reject(new Error('Done in purpose!')));
            const statusStub: SinonStub = stub(response, 'status');
            statusStub.withArgs(500).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('text/plain').returns(response);
            const sendStub: SinonStub = stub(response, 'send');
            sendStub.withArgs('Creation failed! -- Error: Done in purpose!').returns(response);

            // @ts-ignore: access to private method
            const createProcessor: (request: express.Request, response: express.Response) => void = resource.getCreateProcessor();
            await createProcessor(request, response);

            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(createStub.calledOnce);
            assert.isTrue(statusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStub.calledOnce);
            getLoggedUserStub.restore();
            createStub.restore();
            statusStub.restore();
            contentTypeStub.restore();
            sendStub.restore();
        });
    });

    suite('getUpdateProcessor()', (): void => {
        test('success', async (): Promise<void> => {
            const loggedUser: User = <User>{};
            // @ts-ignore: because custom header names are not part of the express.Request definition
            const request: express.Request = <express.Request>{
                params: { id: 12345 },
                body: { anyAttr: 'anyVal' }
            };

            // @ts-ignore: access to private attribute
            const getLoggedUserStub: SinonStub = stub(resource.authResource, 'getLoggedUser');
            getLoggedUserStub.withArgs(request).returns(Promise.resolve(loggedUser));
            // @ts-ignore: access to private attribute
            const updateStub: SinonStub = stub(resource.service, 'update');
            const entity: TestModel = Object.assign(new TestModel(), { anyAttr: 'anyVal' });
            updateStub.withArgs(12345, entity, loggedUser).returns(Promise.resolve(12345));
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(resource.service, 'get');
            getStub.withArgs(12345, loggedUser).returns(Promise.resolve(entity));
            const statusStub: SinonStub = stub(response, 'status');
            statusStub.withArgs(200).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('application/json').returns(response);
            const sendStub: SinonStub = stub(response, 'send');
            sendStub.withArgs(entity).returns(response);

            // @ts-ignore: access to private method
            const updateProcessor: (request: express.Request, response: express.Response) => void = resource.getUpdateProcessor();
            await updateProcessor(request, response);

            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(updateStub.calledOnce);
            assert.isTrue(getStub.calledOnce);
            assert.isTrue(statusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStub.calledOnce);
            getLoggedUserStub.restore();
            updateStub.restore();
            getStub.restore();
            statusStub.restore();
            contentTypeStub.restore();
            sendStub.restore();
        });
        test('service failure', async (): Promise<void> => {
            const loggedUser: User = <User>{};
            // @ts-ignore: because custom header names are not part of the express.Request definition
            const request: express.Request = <express.Request>{
                params: { id: 12345 },
                body: { anyAttr: 'anyVal' }
            };

            // @ts-ignore: access to private attribute
            const getLoggedUserStub: SinonStub = stub(resource.authResource, 'getLoggedUser');
            getLoggedUserStub.withArgs(request).returns(Promise.resolve(loggedUser));
            // @ts-ignore: access to private attribute
            const updateStub: SinonStub = stub(resource.service, 'update');
            const entity: TestModel = Object.assign(new TestModel(), { anyAttr: 'anyVal' });
            updateStub.withArgs(12345, entity, loggedUser).returns(Promise.reject(new ClientErrorException('Done in purpose!')));
            const statusStub: SinonStub = stub(response, 'status');
            statusStub.withArgs(400).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('text/plain').returns(response);
            const sendStub: SinonStub = stub(response, 'send');
            sendStub.withArgs('Entity not modified! -- Error: Done in purpose!').returns(response);

            // @ts-ignore: access to private method
            const updateProcessor: (request: express.Request, response: express.Response) => void = resource.getUpdateProcessor();
            await updateProcessor(request, response);

            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(updateStub.calledOnce);
            assert.isTrue(statusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStub.calledOnce);
            getLoggedUserStub.restore();
            updateStub.restore();
            statusStub.restore();
            contentTypeStub.restore();
            sendStub.restore();
        });
        test('unexpected failure', async (): Promise<void> => {
            const loggedUser: User = <User>{};
            // @ts-ignore: because custom header names are not part of the express.Request definition
            const request: express.Request = <express.Request>{
                params: { id: 12345 },
                body: { anyAttr: 'anyVal' }
            };

            // @ts-ignore: access to private attribute
            const getLoggedUserStub: SinonStub = stub(resource.authResource, 'getLoggedUser');
            getLoggedUserStub.withArgs(request).returns(Promise.resolve(loggedUser));
            // @ts-ignore: access to private attribute
            const updateStub: SinonStub = stub(resource.service, 'update');
            const entity: TestModel = Object.assign(new TestModel(), { anyAttr: 'anyVal' });
            updateStub.withArgs(12345, entity, loggedUser).returns(Promise.reject(new Error('Done in purpose!')));
            const statusStub: SinonStub = stub(response, 'status');
            statusStub.withArgs(403).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('text/plain').returns(response);
            const sendStub: SinonStub = stub(response, 'send');
            sendStub.withArgs('Entity not modified! -- Error: Done in purpose!').returns(response);

            // @ts-ignore: access to private method
            const updateProcessor: (request: express.Request, response: express.Response) => void = resource.getUpdateProcessor();
            await updateProcessor(request, response);

            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(updateStub.calledOnce);
            assert.isTrue(statusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStub.calledOnce);
            getLoggedUserStub.restore();
            updateStub.restore();
            statusStub.restore();
            contentTypeStub.restore();
            sendStub.restore();
        });
    });

    suite('getDeleteProcessor()', (): void => {
        test('success', async (): Promise<void> => {
            const loggedUser: User = <User>{};
            // @ts-ignore: because custom header names are not part of the express.Request definition
            const request: express.Request = <express.Request>{
                params: { id: 12345 }
            };

            // @ts-ignore: access to private attribute
            const getLoggedUserStub: SinonStub = stub(resource.authResource, 'getLoggedUser');
            getLoggedUserStub.withArgs(request).returns(Promise.resolve(loggedUser));
            // @ts-ignore: access to private attribute
            const deleteStub: SinonStub = stub(resource.service, 'delete');
            deleteStub.withArgs(12345, loggedUser).returns(Promise.resolve());
            const sendStatusStub: SinonStub = stub(response, 'sendStatus');
            sendStatusStub.withArgs(200).returns(response);

            // @ts-ignore: access to private method
            const deleteProcessor: (request: express.Request, response: express.Response) => void = resource.getDeleteProcessor();
            await deleteProcessor(request, response);

            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(deleteStub.calledOnce);
            assert.isTrue(sendStatusStub.calledOnce);
            getLoggedUserStub.restore();
            deleteStub.restore();
            sendStatusStub.restore();
        });
        test('service failure', async (): Promise<void> => {
            const loggedUser: User = <User>{};
            // @ts-ignore: because custom header names are not part of the express.Request definition
            const request: express.Request = <express.Request>{
                params: { id: 12345 }
            };

            // @ts-ignore: access to private attribute
            const getLoggedUserStub: SinonStub = stub(resource.authResource, 'getLoggedUser');
            getLoggedUserStub.withArgs(request).returns(Promise.resolve(loggedUser));
            // @ts-ignore: access to private attribute
            const deleteStub: SinonStub = stub(resource.service, 'delete');
            deleteStub.withArgs(12345, loggedUser).returns(Promise.reject(new ClientErrorException('Done in purpose!')));
            const statusStub: SinonStub = stub(response, 'status');
            statusStub.withArgs(400).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('text/plain').returns(response);
            const sendStub: SinonStub = stub(response, 'send');
            sendStub.withArgs('Entity not deleted! -- Error: Done in purpose!').returns(response);

            // @ts-ignore: access to private method
            const deleteProcessor: (request: express.Request, response: express.Response) => void = resource.getDeleteProcessor();
            await deleteProcessor(request, response);

            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(deleteStub.calledOnce);
            assert.isTrue(statusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStub.calledOnce);
            getLoggedUserStub.restore();
            deleteStub.restore();
            statusStub.restore();
            contentTypeStub.restore();
            sendStub.restore();
        });
        test('unexpected failure', async (): Promise<void> => {
            const loggedUser: User = <User>{};
            // @ts-ignore: because custom header names are not part of the express.Request definition
            const request: express.Request = <express.Request>{
                params: { id: 12345 }
            };

            // @ts-ignore: access to private attribute
            const getLoggedUserStub: SinonStub = stub(resource.authResource, 'getLoggedUser');
            getLoggedUserStub.withArgs(request).returns(Promise.resolve(loggedUser));
            // @ts-ignore: access to private attribute
            const deleteStub: SinonStub = stub(resource.service, 'delete');
            deleteStub.withArgs(12345, loggedUser).returns(Promise.reject(new Error('Done in purpose!')));
            const statusStub: SinonStub = stub(response, 'status');
            statusStub.withArgs(403).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('text/plain').returns(response);
            const sendStub: SinonStub = stub(response, 'send');
            sendStub.withArgs('Entity not deleted! -- Error: Done in purpose!').returns(response);

            // @ts-ignore: access to private method
            const deleteProcessor: (request: express.Request, response: express.Response) => void = resource.getDeleteProcessor();
            await deleteProcessor(request, response);

            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(deleteStub.calledOnce);
            assert.isTrue(statusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStub.calledOnce);
            getLoggedUserStub.restore();
            deleteStub.restore();
            statusStub.restore();
            contentTypeStub.restore();
            sendStub.restore();
        });
    });
});