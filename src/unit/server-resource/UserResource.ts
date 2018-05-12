import * as express from 'express';
import intern from 'intern';

import { User as Model } from '../../server/model/User';
import { UserResource as Resource } from '../../server/resource/UserResource';

const { suite, test } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');
import { stub, SinonStub } from 'sinon';

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    test('getInstance()', (): void => {
        const resource: Resource = Resource.getInstance();
        assert.isTrue(resource instanceof Resource);
        assert.strictEqual(Resource.getInstance(), resource);
        assert.strictEqual(Resource.getInstance(), resource);
    });

    test('getRouter()', (): void => {
        const resource: Resource = Resource.getInstance();

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
        const getGetMeProcessorStub: SinonStub = stub(resource, 'getGetMeProcessor');
        const getGetMeProcessor: (request: express.Request, response: express.Response) => void = () => { console.log(' get ') };
        getGetMeProcessorStub.withArgs().returns(getGetMeProcessor);

        assert.strictEqual(resource.getRouter(), router);

        assert.isTrue(RouterStub.calledOnce);
        assert.isTrue(getStub.calledThrice);
        assert.isTrue(getStub.calledWithExactly('/api/v1/User/me', getGetMeProcessor));
        assert.isTrue(getGetMeProcessorStub.calledOnce);
        RouterStub.restore();
        getStub.restore();
        postStub.restore();
        putStub.restore();
        deleteStub.restore();
        getGetMeProcessorStub.restore();
    });

    suite('getGetMeProcessor()', (): void => {
        test('w/ logged user', async (): Promise<void> => {
            const resource: Resource = Resource.getInstance();
            const loggedUser: Model = <Model>{};
            const request: express.Request = <express.Request>{};
            let response: express.Response = <express.Response>{
                contentType(type: string): express.Response { return null; },
                cookie(name: string, val: string, options: express.CookieOptions): express.Response { return null; },
                location(url: string): express.Response { return null; },
                sendStatus(code: number): express.Response { return null; },
                setHeader(name: string, value: string): void { },
                status(code: number): express.Response { return null; },
                send(data: string): express.Response { return null; }
            };

            // @ts-ignore: access to private attribute
            const getLoggedUserStub: SinonStub = stub(resource.authResource, 'getLoggedUser');
            getLoggedUserStub.withArgs(request).returns(loggedUser);
            const statusStub: SinonStub = stub(response, 'status');
            statusStub.withArgs(200).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('application/json').returns(response);
            const sendStub: SinonStub = stub(response, 'send');
            sendStub.withArgs(loggedUser).returns(response);

            // @ts-ignore: access to private method
            const processor: (request: express.Request, response: express.Response) => void = resource.getGetMeProcessor();
            await processor(request, response);

            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(statusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStub.calledOnce);
            getLoggedUserStub.restore();
            statusStub.restore();
            contentTypeStub.restore();
            sendStub.restore();
        });
        test('w/o logged user', async (): Promise<void> => {
            const resource: Resource = Resource.getInstance();
            const request: express.Request = <express.Request>{};
            let response: express.Response = <express.Response>{
                contentType(type: string): express.Response { return null; },
                cookie(name: string, val: string, options: express.CookieOptions): express.Response { return null; },
                location(url: string): express.Response { return null; },
                sendStatus(code: number): express.Response { return null; },
                setHeader(name: string, value: string): void { },
                status(code: number): express.Response { return null; },
                send(data: string): express.Response { return null; }
            };

            // @ts-ignore: access to private attribute
            const getLoggedUserStub: SinonStub = stub(resource.authResource, 'getLoggedUser');
            getLoggedUserStub.withArgs(request).returns(null);
            const statusStub: SinonStub = stub(response, 'status');
            statusStub.withArgs(401).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('text/plain').returns(response);
            const sendStub: SinonStub = stub(response, 'send');
            sendStub.withArgs('Not authenticated!').returns(response);

            // @ts-ignore: access to private method
            const processor: (request: express.Request, response: express.Response) => void = resource.getGetMeProcessor();
            await processor(request, response);

            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(statusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStub.calledOnce);
            getLoggedUserStub.restore();
            statusStub.restore();
            contentTypeStub.restore();
            sendStub.restore();
        });
    });
});