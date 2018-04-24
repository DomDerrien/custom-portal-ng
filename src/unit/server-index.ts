import intern from 'intern';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import { RequestHandler } from 'express';
import { OptionsJson, OptionsUrlencoded } from 'body-parser';
import { ServeStaticOptions } from 'serve-static';
import { Router } from 'express-serve-static-core';
import * as fs from 'fs';

import { Server } from '../server/index';
import { AuthResource, CategoryResource, LinkResource, UserResource } from '../server/resource';

const { suite, test, beforeEach, afterEach } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');
import { stub, SinonStub } from 'sinon';

interface ExpressBodyParser {
    json(options?: OptionsJson): RequestHandler;
    urlencoded(options?: OptionsUrlencoded): RequestHandler;
}
interface ExpressCookieParser {
    (secret?: string | string[], options?: cookieParser.CookieParseOptions): express.RequestHandler;
}
interface ExpressStatic {
    (root: string, options?: ServeStaticOptions): express.Handler
}
interface ExpressRouter {
    (options?: express.RouterOptions): Router
}
declare global {
    interface FileSystemAccess {
        statSync(path: string): fs.Stats;
    }
}

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    let server: Server;
    let expressApp: express.Application;
    let expressBodyParser: ExpressBodyParser;
    let expressCookieParser: ExpressCookieParser;
    let expressStatic: ExpressStatic;
    let expressRouter: ExpressRouter;
    let fsAccess: FileSystemAccess;

    beforeEach((): void => {
        expressApp = <express.Application>{
            use(): express.Application { return null },
            listen(port: number): void { }
        };
        expressBodyParser = <ExpressBodyParser>{
            json(): express.Application { return null },
            urlencoded(): express.Application { return null }
        };
        expressCookieParser = function (path: string, options?: cookieParser.CookieParseOptions): express.RequestHandler {
            return null;
        };
        expressStatic = function (root: string, options?: ServeStaticOptions): express.Handler {
            return null;
        };
        expressRouter = function (options?: express.RouterOptions): Router {
            return null;
        };
        fsAccess = <FileSystemAccess>{
            readFileSync(path: string): Buffer { return null; },
            statSync(path: string): any { return null; }
        };

        server = new Server(expressApp, expressBodyParser, expressCookieParser, expressStatic, expressRouter, fsAccess);
    });
    afterEach((): void => {
        server = null;
        expressApp = null;
        expressBodyParser = null;
        expressCookieParser = null;
        expressStatic = null;
        expressRouter = null;
        fsAccess = null;
    });

    suite('constructor', (): void => {
        test('with default parameters', (): void => {
            const server: Server = new Server();

            // @ts-ignore: access to private attribute
            assert.isNotNull(server.expressApp); // strict comparison with `express()` fails
            // @ts-ignore: access to private attribute
            assert.strictEqual(server.expressBodyParser, bodyParser);
            // @ts-ignore: access to private attribute
            assert.strictEqual(server.expressCookieParser, cookieParser);
            // @ts-ignore: access to private attribute
            assert.strictEqual(server.expressStatic, express.static);
            // @ts-ignore: access to private attribute
            assert.strictEqual(server.expressRouter, express.Router);
            // @ts-ignore: access to private attribute
            assert.strictEqual(server.fsAccess, fs);
        });
        test('with mocks', (): void => {
            const server: Server = new Server(expressApp, expressBodyParser, expressCookieParser, expressStatic, expressRouter, fsAccess);

            // @ts-ignore: access to private attribute
            assert.strictEqual(server.expressApp, expressApp);
            // @ts-ignore: access to private attribute
            assert.strictEqual(server.expressBodyParser, expressBodyParser);
            // @ts-ignore: access to private attribute
            assert.strictEqual(server.expressCookieParser, expressCookieParser);
            // @ts-ignore: access to private attribute
            assert.strictEqual(server.expressStatic, expressStatic);
            // @ts-ignore: access to private attribute
            assert.strictEqual(server.expressRouter, expressRouter);
            // @ts-ignore: access to private attribute
            assert.strictEqual(server.fsAccess, fsAccess);
        });
    });

    test('getServerDirectory()', (): void => {
        // @ts-ignore: access to private method
        assert.strictEqual(server.getServerDirectory(), __dirname.replace('/unit', '/server'));
    });

    test('loadDependencoes()', (): void => {
        // @ts-ignore: access to private method
        const getServerDirectoryStub: SinonStub = stub(server, 'getServerDirectory');
        getServerDirectoryStub.withArgs().returns('here');
        const readFileSyncStub: SinonStub = stub(fsAccess, 'readFileSync');
        readFileSyncStub.withArgs('here' + '/../../src/client/index.html').returns(new Buffer('there it is!', 'utf8'));

        // @ts-ignore: access to private method
        server.loadDependencies();
        // @ts-ignore: access to private attribute
        assert.strictEqual(server.clientMainPage, 'there it is!');

        assert.isTrue(getServerDirectoryStub.calledOnce);
        assert.isTrue(readFileSyncStub.calledOnce);
        getServerDirectoryStub.restore();
        readFileSyncStub.restore();
    });

    test('handleCORS()', (): void => {
        const request: express.Request = <express.Request>{
            header(name: string): string | undefined { return null; }
        };
        const response: express.Response = <express.Response>{
            header(name: string, value: string): express.Response { return null; }
        };
        const nextStub: SinonStub = stub();
        const requestHeaderStub: SinonStub = stub(request, 'header');
        requestHeaderStub.withArgs('origin').returns('origin');
        const responseHeaderStub: SinonStub = stub(response, 'header');
        responseHeaderStub.withArgs('Vary', 'Origin').returns(response);
        responseHeaderStub.withArgs('Access-Control-Allow-Origin', 'origin').returns(response);
        responseHeaderStub.withArgs('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Ids-Only, X-Sort-By').returns(response);
        responseHeaderStub.withArgs('Access-Control-Allow-Credentials', 'true').returns(response);

        // @ts-ignore: access to private method
        server.handleCORS(request, response, nextStub);

        assert.isTrue(requestHeaderStub.calledOnce);
        assert.strictEqual(responseHeaderStub.callCount, 4);
        assert.isTrue(nextStub.calledOnce);
        requestHeaderStub.restore();
        responseHeaderStub.restore();
    });

    test('addMiddlewares()', (): void => {
        // @ts-ignore: access to private attribute
        const jsonStub: SinonStub = stub(expressBodyParser, 'json');
        jsonStub.withArgs().returns('json');
        // @ts-ignore: access to private attribute
        const urlencodedStub: SinonStub = stub(expressBodyParser, 'urlencoded');
        urlencodedStub.withArgs({ extended: false }).returns('urlEncoded');
        // @ts-ignore: access to private attribute
        const expressCookieParserStub: SinonStub = stub(server, 'expressCookieParser');
        expressCookieParserStub.withArgs().returns('cookieParser');
        // @ts-ignore: access to private attribute
        const useStub: SinonStub = stub(expressApp, 'use');
        useStub.withArgs('json').returns(expressApp);
        useStub.withArgs('urlEncoded').returns(expressApp);
        useStub.withArgs('cookieParser').returns(expressApp);
        // @ts-ignore: access to private method
        useStub.withArgs(server.handleCORS).returns(expressApp);

        // @ts-ignore: access to private method
        const getServerDirectoryStub = stub(server, 'getServerDirectory');
        getServerDirectoryStub.withArgs().returns('here');
        // @ts-ignore: access to private attribute
        const staticStub: SinonStub = stub(server, 'expressStatic');
        staticStub.withArgs('here/../../src/client/fonts', { etag: true, immutable: true, index: false, lastModified: true, maxAge: 30000000, redirect: false }).returns('fonts');
        staticStub.withArgs('here/../../src/client/images', { etag: true, immutable: true, index: false, lastModified: true, maxAge: 30000000, redirect: false }).returns('images');
        staticStub.withArgs('here/../../src/client/model', { etag: true, immutable: true, index: false, lastModified: true, maxAge: 300000, redirect: false }).returns('model');
        useStub.withArgs('/fonts', 'fonts').returns(expressApp);
        useStub.withArgs('/images', 'images').returns(expressApp);
        useStub.withArgs('/model', 'model').returns(expressApp);

        // @ts-ignore: access to private method
        server.addMiddlewares();

        assert.isTrue(jsonStub.calledOnce);
        assert.isTrue(urlencodedStub.calledOnce);
        assert.isTrue(expressCookieParserStub.calledOnce);
        assert.isTrue(getServerDirectoryStub.calledOnce);
        assert.isTrue(staticStub.calledThrice);
        assert.strictEqual(useStub.callCount, 4 + 3);
        jsonStub.restore();
        urlencodedStub.restore();
        expressCookieParserStub.restore();
        getServerDirectoryStub.restore();
        staticStub.restore();
        useStub.restore();
    });

    suite('addServerRoutes()', (): void => {
        test('with fake resource', (): void => {
            const resourceClass: any = {
                getInstance(): any {
                    return {
                        getRouter(): any {
                            return 'router';
                        }
                    };
                }
            };
            // @ts-ignore: access to private attribute
            const useStub: SinonStub = stub(expressApp, 'use');
            useStub.withArgs('router').returns(expressApp);

            // @ts-ignore: access to private method
            server.addServerRoutes({ a: resourceClass });

            assert.isTrue(useStub.calledOnce);
            useStub.restore();
        });
        test('with real resources', (): void => {
            const authResourceStub: SinonStub = stub(AuthResource, 'getInstance');
            authResourceStub.withArgs().returns({ getRouter() { return 'auth-router'; } });
            const categoryResourceStub: SinonStub = stub(CategoryResource, 'getInstance');
            categoryResourceStub.withArgs().returns({ getRouter() { return 'category-router'; } });
            const linkResourceStub: SinonStub = stub(LinkResource, 'getInstance');
            linkResourceStub.withArgs().returns({ getRouter() { return 'link-router'; } });
            const userResourceStub: SinonStub = stub(UserResource, 'getInstance');
            userResourceStub.withArgs().returns({ getRouter() { return 'user-router'; } });
            // @ts-ignore: access to private attribute
            const useStub: SinonStub = stub(expressApp, 'use');

            // @ts-ignore: access to private method
            server.addServerRoutes();

            assert.strictEqual(useStub.callCount, 4);
            assert.isTrue(useStub.calledWithExactly('auth-router'));
            assert.isTrue(useStub.calledWithExactly('category-router'));
            assert.isTrue(useStub.calledWithExactly('link-router'));
            assert.isTrue(useStub.calledWithExactly('user-router'));
            authResourceStub.restore();
            categoryResourceStub.restore();
            linkResourceStub.restore();
            userResourceStub.restore();
            useStub.restore();
        });
    });

    suite('replaceNodeImports()', (): void => {
        test('without node-like module imports', (): void => {
            const url: string = '/node_modules/aaa/bbb/ccc.js';
            const content: string = `
                import '../../../node_modules/katex/iii/jjj.js';
            `;
            const pattern: string = '@polymer';

            // @ts-ignore: access to private method
            assert.strictEqual(server.replaceNodeImports(url, content, pattern), content);
        });
        test('with node-like module imports', (): void => {
            const url: string = '/node_modules/aaa/bbb/ccc.js';
            const content: string = `
                import '@polymer/ddd/eee.js';
                import '@polymer/fff/ggg/hhh.js';
                import '../../../node_modules/@polymer/iii/jjj.js';
            `;
            const pattern: string = '@polymer';
            const expected: string = `
                import '../../../node_modules/@polymer/ddd/eee.js';
                import '../../../node_modules/@polymer/fff/ggg/hhh.js';
                import '../../../node_modules/@polymer/iii/jjj.js';
            `;

            // @ts-ignore: access to private method
            assert.strictEqual(server.replaceNodeImports(url, content, pattern), expected);
        });
    });

    test('toLastModifiedFormat()', (): void => {
        // @ts-ignore: access to private method
        assert.strictEqual(server.toLastModifiedFormat(new Date('2000-01-01T01:01:01')), 'Sat, 01 Jan 2000 01:01:01 GMT');
        // @ts-ignore: access to private method
        assert.strictEqual(server.toLastModifiedFormat(new Date('2000-12-13T12:11:10')), 'Wed, 13 Dec 2000 12:11:10 GMT');
    });

    suite('processNodeImportsInApp()', (): void => {
        test('do not need filtering with `map` file', (): void => {
            const response: express.Response = <express.Response>{
                set(value: any): express.Response { return null; },
                send(data: any): express.Response { return null; }
            };
            // @ts-ignore: access to private attribute
            const readFileSyncStub: SinonStub = stub(server.fsAccess, 'readFileSync');
            readFileSyncStub.withArgs('./dist/client/thisFile.map').returns(new Buffer('thisContent', 'utf8'));
            // @ts-ignore: access to private attribute
            const statSyncStub: SinonStub = stub(server.fsAccess, 'statSync');
            statSyncStub.withArgs('./dist/client/thisFile.map').returns({ mtime: 123 });
            // @ts-ignore: access to private method
            const toLastModifiedFormatStub: SinonStub = stub(server, 'toLastModifiedFormat');
            toLastModifiedFormatStub.withArgs(new Date(123)).returns('thisDate');
            const setStub = stub(response, 'set');
            setStub.withArgs('Content-Type', 'application/octet-stream').returns(response);
            setStub.withArgs({ 'Cache-Control': 'public, immutable, max-age=900', 'Last-Modified': 'thisDate' }).returns(response);
            const sendStub = stub(response, 'send');

            // @ts-ignore: access to private method
            server.processNodeImportsInApp(<express.Request>{ url: '/thisFile.map' }, response);

            assert.isTrue(readFileSyncStub.calledOnce);
            assert.isTrue(statSyncStub.calledOnce);
            assert.isTrue(toLastModifiedFormatStub.calledOnce);
            assert.isTrue(setStub.calledTwice);
            assert.isTrue(sendStub.calledOnceWithExactly('thisContent'));
            readFileSyncStub.restore();
            statSyncStub.restore();
            toLastModifiedFormatStub.restore();
            setStub.restore();
            sendStub.restore();
        });
        test('do not need filtering with `unknown` file', (): void => {
            const response: express.Response = <express.Response>{
                set(value: any): express.Response { return null; },
                send(data: any): express.Response { return null; }
            };
            // @ts-ignore: access to private attribute
            const readFileSyncStub: SinonStub = stub(server.fsAccess, 'readFileSync');
            readFileSyncStub.withArgs('./dist/client/thisFile.png').returns(new Buffer('thisContent', 'utf8'));
            // @ts-ignore: access to private attribute
            const statSyncStub: SinonStub = stub(server.fsAccess, 'statSync');
            statSyncStub.withArgs('./dist/client/thisFile.png').returns({ mtime: 123 });
            // @ts-ignore: access to private method
            const toLastModifiedFormatStub: SinonStub = stub(server, 'toLastModifiedFormat');
            toLastModifiedFormatStub.withArgs(new Date(123)).returns('thisDate');
            const setStub = stub(response, 'set');
            setStub.withArgs({ 'Cache-Control': 'public, immutable, max-age=900', 'Last-Modified': 'thisDate' }).returns(response);
            const sendStub = stub(response, 'send');

            // @ts-ignore: access to private method
            server.processNodeImportsInApp(<express.Request>{ url: '/thisFile.png' }, response);

            assert.isTrue(readFileSyncStub.calledOnce);
            assert.isTrue(statSyncStub.calledOnce);
            assert.isTrue(toLastModifiedFormatStub.calledOnce);
            assert.isTrue(setStub.calledOnce);
            assert.isTrue(sendStub.calledOnceWithExactly('thisContent'));
            readFileSyncStub.restore();
            statSyncStub.restore();
            toLastModifiedFormatStub.restore();
            setStub.restore();
            sendStub.restore();
        });
        test('do not need filtering with `js` file', (): void => {
            const response: express.Response = <express.Response>{
                set(value: any): express.Response { return null; },
                send(data: any): express.Response { return null; }
            };
            // @ts-ignore: access to private attribute
            const readFileSyncStub: SinonStub = stub(server.fsAccess, 'readFileSync');
            readFileSyncStub.withArgs('./dist/client/thisFile.js').returns(new Buffer('thisContent', 'utf8'));
            // @ts-ignore: access to private attribute
            const statSyncStub: SinonStub = stub(server.fsAccess, 'statSync');
            statSyncStub.withArgs('./dist/client/thisFile.js').returns({ mtime: 123 });
            // @ts-ignore: access to private method
            const replaceNodeImportsStub: SinonStub = stub(server, 'replaceNodeImports');
            replaceNodeImportsStub.withArgs('/thisFile.js', 'thisContent', '@polymer').returns('thisCleanContent');
            // @ts-ignore: access to private method
            const toLastModifiedFormatStub: SinonStub = stub(server, 'toLastModifiedFormat');
            toLastModifiedFormatStub.withArgs(new Date(123)).returns('thisDate');
            const setStub = stub(response, 'set');
            setStub.withArgs('Content-Type', 'application/javascript').returns(response);
            setStub.withArgs({ 'Cache-Control': 'public, immutable, max-age=900', 'Last-Modified': 'thisDate' }).returns(response);
            const sendStub = stub(response, 'send');

            // @ts-ignore: access to private method
            server.processNodeImportsInApp(<express.Request>{ url: '/thisFile.js' }, response);

            assert.isTrue(readFileSyncStub.calledOnce);
            assert.isTrue(statSyncStub.calledOnce);
            assert.isTrue(replaceNodeImportsStub.calledOnce);
            assert.isTrue(toLastModifiedFormatStub.calledOnce);
            assert.isTrue(setStub.calledTwice);
            assert.isTrue(sendStub.calledOnceWithExactly('thisCleanContent'));
            readFileSyncStub.restore();
            statSyncStub.restore();
            replaceNodeImportsStub.restore();
            toLastModifiedFormatStub.restore();
            setStub.restore();
            sendStub.restore();
        });
    });

    suite('processNodeImportsInPolymer()', (): void => {
        test('do not need filtering with `map` file', (): void => {
            const response: express.Response = <express.Response>{
                set(value: any): express.Response { return null; },
                send(data: any): express.Response { return null; }
            };
            // @ts-ignore: access to private attribute
            const readFileSyncStub: SinonStub = stub(server.fsAccess, 'readFileSync');
            readFileSyncStub.withArgs('./thisFile.map').returns(new Buffer('thisContent', 'utf8'));
            // @ts-ignore: access to private attribute
            const statSyncStub: SinonStub = stub(server.fsAccess, 'statSync');
            statSyncStub.withArgs('./thisFile.map').returns({ mtime: 123 });
            // @ts-ignore: access to private method
            const toLastModifiedFormatStub: SinonStub = stub(server, 'toLastModifiedFormat');
            toLastModifiedFormatStub.withArgs(new Date(123)).returns('thisDate');
            const setStub = stub(response, 'set');
            setStub.withArgs('Content-Type', 'application/octet-stream').returns(response);
            setStub.withArgs({ 'Cache-Control': 'public, immutable, max-age=900', 'Last-Modified': 'thisDate' }).returns(response);
            const sendStub = stub(response, 'send');

            // @ts-ignore: access to private method
            server.processNodeImportsInPolymer(<express.Request>{ url: '/thisFile.map' }, response);

            assert.isTrue(readFileSyncStub.calledOnce);
            assert.isTrue(statSyncStub.calledOnce);
            assert.isTrue(toLastModifiedFormatStub.calledOnce);
            assert.isTrue(setStub.calledTwice);
            assert.isTrue(sendStub.calledOnceWithExactly('thisContent'));
            readFileSyncStub.restore();
            statSyncStub.restore();
            toLastModifiedFormatStub.restore();
            setStub.restore();
            sendStub.restore();
        });
        test('do not need filtering with `unknown` file', (): void => {
            const response: express.Response = <express.Response>{
                set(value: any): express.Response { return null; },
                send(data: any): express.Response { return null; }
            };
            // @ts-ignore: access to private attribute
            const readFileSyncStub: SinonStub = stub(server.fsAccess, 'readFileSync');
            readFileSyncStub.withArgs('./thisFile.png').returns(new Buffer('thisContent', 'utf8'));
            // @ts-ignore: access to private attribute
            const statSyncStub: SinonStub = stub(server.fsAccess, 'statSync');
            statSyncStub.withArgs('./thisFile.png').returns({ mtime: 123 });
            // @ts-ignore: access to private method
            const toLastModifiedFormatStub: SinonStub = stub(server, 'toLastModifiedFormat');
            toLastModifiedFormatStub.withArgs(new Date(123)).returns('thisDate');
            const setStub = stub(response, 'set');
            setStub.withArgs({ 'Cache-Control': 'public, immutable, max-age=900', 'Last-Modified': 'thisDate' }).returns(response);
            const sendStub = stub(response, 'send');

            // @ts-ignore: access to private method
            server.processNodeImportsInPolymer(<express.Request>{ url: '/thisFile.png' }, response);

            assert.isTrue(readFileSyncStub.calledOnce);
            assert.isTrue(statSyncStub.calledOnce);
            assert.isTrue(toLastModifiedFormatStub.calledOnce);
            assert.isTrue(setStub.calledOnce);
            assert.isTrue(sendStub.calledOnceWithExactly('thisContent'));
            readFileSyncStub.restore();
            statSyncStub.restore();
            toLastModifiedFormatStub.restore();
            setStub.restore();
            sendStub.restore();
        });
        test('need filtering with `js`', (): void => {
            const response: express.Response = <express.Response>{
                set(value: any): express.Response { return null; },
                send(data: any): express.Response { return null; }
            };
            // @ts-ignore: access to private attribute
            const readFileSyncStub: SinonStub = stub(server.fsAccess, 'readFileSync');
            readFileSyncStub.withArgs('./@polymer/thisFile.js').returns(new Buffer('thisContent', 'utf8'));
            // @ts-ignore: access to private attribute
            const statSyncStub: SinonStub = stub(server.fsAccess, 'statSync');
            statSyncStub.withArgs('./@polymer/thisFile.js').returns({ mtime: 123 });
            // @ts-ignore: access to private method
            const replaceNodeImportsStub: SinonStub = stub(server, 'replaceNodeImports');
            replaceNodeImportsStub.withArgs('/@polymer/thisFile.js', 'thisContent', '@polymer').returns('thisCleanContent');
            replaceNodeImportsStub.withArgs('/@polymer/thisFile.js', 'thisCleanContent', '@webcomponents').returns('thisMuchCleanerContent');
            replaceNodeImportsStub.withArgs('/@polymer/thisFile.js', 'thisMuchCleanerContent', '@domderrien').returns('thisFoolProofContent');
            // @ts-ignore: access to private method
            const toLastModifiedFormatStub: SinonStub = stub(server, 'toLastModifiedFormat');
            toLastModifiedFormatStub.withArgs(new Date(123)).returns('thisDate');
            const setStub = stub(response, 'set');
            setStub.withArgs('Content-Type', 'application/javascript').returns(response);
            setStub.withArgs({ 'Cache-Control': 'public, immutable, max-age=900', 'Last-Modified': 'thisDate' }).returns(response);
            const sendStub = stub(response, 'send');

            // @ts-ignore: access to private method
            server.processNodeImportsInPolymer(<express.Request>{ url: '/@polymer/thisFile.js' }, response);

            assert.isTrue(readFileSyncStub.calledOnce);
            assert.isTrue(statSyncStub.calledOnce);
            assert.isTrue(replaceNodeImportsStub.calledThrice);
            assert.isTrue(toLastModifiedFormatStub.calledOnce);
            assert.isTrue(setStub.calledTwice);
            assert.isTrue(sendStub.calledOnceWithExactly('thisFoolProofContent'));
            readFileSyncStub.restore();
            statSyncStub.restore();
            replaceNodeImportsStub.restore();
            toLastModifiedFormatStub.restore();
            setStub.restore();
            sendStub.restore();
        });
    });

    test('handleAnyRemainingRequest()', (): void => {
        const response: express.Response = <express.Response>{
            set(name: string, value: string): express.Response { return null; },
            send(content: string): express.Response { return null; }
        };
        const setStub: SinonStub = stub(response, 'set');
        setStub.withArgs('Content-Type', 'text/html').returns(response);
        const sendStub: SinonStub = stub(response, 'send');
        sendStub.withArgs('thisContent').returns(response);

        // @ts-ignore: access to private attribute
        server.clientMainPage = 'thisContent';
        // @ts-ignore: access to private method
        server.handleAnyRemainingRequest(null, response);

        assert.isTrue(setStub.calledOnce);
        assert.isTrue(sendStub.calledOnce);
        setStub.restore();
        sendStub.restore();
    });

    test('addClientRoutes()', (): void => {
        // @ts-ignore: access to private method
        const bind1Stub: SinonStub = stub(server.processNodeImportsInApp, 'bind');
        const f1: (request: express.Request, response: express.Response) => void = () => { console.log('f1'); };
        bind1Stub.withArgs(server).returns(f1);
        // @ts-ignore: access to private method
        const bind2Stub: SinonStub = stub(server.processNodeImportsInPolymer, 'bind');
        const f2: (request: express.Request, response: express.Response) => void = () => { console.log('f2'); };
        bind2Stub.withArgs(server).returns(f2);

        const getStub: SinonStub = stub();
        // @ts-ignore: access to private attribute
        const expressRouterStub: SinonStub = stub(server, 'expressRouter');
        expressRouterStub.withArgs().returns({ get: getStub });
        // @ts-ignore: access to private attribute
        const useStub: SinonStub = stub(server.expressApp, 'use');

        // @ts-ignore: access to private method
        server.addClientRoutes();

        assert.isTrue(bind1Stub.calledOnce);
        assert.isTrue(bind2Stub.calledOnce);
        assert.isTrue(expressRouterStub.calledOnce);
        assert.isTrue(getStub.calledThrice);
        assert.isTrue(getStub.calledWithExactly(/^\/(?:app|widgets)\//, f1));
        assert.isTrue(getStub.calledWithExactly('/node_modules/*', f2));
        // @ts-ignore: access to private method
        assert.isTrue(getStub.calledWithExactly('/*', server.handleAnyRemainingRequest));
        assert.isTrue(useStub.calledThrice);
        bind1Stub.restore();
        bind2Stub.restore();
        expressRouterStub.restore();
        useStub.restore();
    });

    test('start()', (): void => {
        // @ts-ignore: access to private method
        const loadDependenciesStub: SinonStub = stub(server, 'loadDependencies');
        // @ts-ignore: access to private method
        const addMiddlewaresStub: SinonStub = stub(server, 'addMiddlewares');
        // @ts-ignore: access to private method
        const addServerRoutesStub: SinonStub = stub(server, 'addServerRoutes');
        // @ts-ignore: access to private method
        const addClientRoutesStub: SinonStub = stub(server, 'addClientRoutes');
        // @ts-ignore: access to private attribute
        const listenStub: SinonStub = stub(server.expressApp, 'listen');

        server.start(9876);

        assert.isTrue(loadDependenciesStub.calledOnceWithExactly());
        assert.isTrue(addMiddlewaresStub.calledOnceWithExactly());
        assert.isTrue(addServerRoutesStub.calledOnceWithExactly());
        assert.isTrue(addClientRoutesStub.calledOnceWithExactly());
        assert.isTrue(listenStub.calledOnceWithExactly(9876));
    });
});