import intern from 'intern';
import * as express from 'express';
import { RequestHandler } from 'express';
import { TokenPayload, LoginTicket } from 'google-auth-library/build/src/auth/loginticket';

import { AuthResource } from '../../server/resource/AuthResource';
import { UserService } from '../../server/service/UserService';
import { QueryOptions } from '../../server/dao/BaseDao';
import { User } from '../../server/model/User';
import { OAuth2Client } from 'google-auth-library';
import { VerifyIdTokenOptions } from 'google-auth-library/build/src/auth/oauth2client';

const { suite, test, beforeEach, afterEach } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');
import { stub, SinonStub } from 'sinon';
import { ServerErrorException } from '../../server/exception/ServerErrorException';

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    let resource: AuthResource;
    let response: express.Response;

    beforeEach((): void => {
        // @ts-ignore: access to private constructor
        resource = new AuthResource();
        // @ts-ignore: access to private attribute and constructor
        resource.userService = <UserService>{
            select(params: { [key: string]: string }, options: QueryOptions, loggedUser: User): Array<User> { return null; },
            get(id: number, loggedUser: User): User { return null; },
            create(candidate: User, loggedUser: User): number { return 0; },
            update(id: number, candidate: User, loggedUser: User): number { return 0; }
        };
        // @ts-ignore: access to private attribute and constructor
        resource.oauth2Client = <OAuth2Client>{
            verifyIdToken(options: VerifyIdTokenOptions): Promise<LoginTicket> { return null; }
        }

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

    afterEach((): void => {
        resource = null;
    });

    test('getInstance()', (): void => {
        const resource: AuthResource = AuthResource.getInstance();
        assert.isTrue(resource instanceof AuthResource);
        assert.strictEqual(AuthResource.getInstance(), resource);
        assert.strictEqual(AuthResource.getInstance(), resource);
    });

    test('constructor', (): void => {
        // @ts-ignore: access to private constructor
        const resource = new AuthResource();
        // @ts-ignore: access to private attribute
        const userService = resource.userService;
        assert.isTrue(userService instanceof UserService);
        // @ts-ignore: access to private attribute
        assert.strictEqual(new AuthResource().userService, userService);
    });

    test('getRouter()', (): void => {
        const idTokenValidator: (...handlers: RequestHandler[]) => Promise<void> = () => { return null; };
        const logOutProcessor: (...handlers: RequestHandler[]) => Promise<void> = () => { return null; };
        // @ts-ignore: access to private method
        const getIdTokenValidatorStub: SinonStub = stub(resource, 'getIdTokenValidator');
        getIdTokenValidatorStub.withArgs().returns(idTokenValidator);
        // @ts-ignore: access to private method
        const getLogOutProcessorStub: SinonStub = stub(resource, 'getLogOutProcessor');
        getLogOutProcessorStub.withArgs().returns(logOutProcessor);
        const Router: express.Router = <express.Router>{
            post(path: string | RegExp | Array<string | RegExp>, ...handlers: RequestHandler[]): void { },
            delete(path: string | RegExp | Array<string | RegExp>, ...handlers: RequestHandler[]): void { }
        }
        const RouterStub: SinonStub = stub(express, 'Router');
        RouterStub.withArgs().returns(Router);
        const postStub: SinonStub = stub(Router, 'post');
        const deleteStub: SinonStub = stub(Router, 'delete');

        assert.strictEqual(resource.getRouter(), Router);

        assert.isTrue(postStub.calledOnceWithExactly('/api/v1/Auth/', idTokenValidator));
        assert.isTrue(deleteStub.calledOnceWithExactly('/api/v1/Auth/', logOutProcessor));
        getIdTokenValidatorStub.restore();
        RouterStub.restore();
        postStub.restore();
    });

    suite('getLogOutProcessor()', (): void => {
        test('w/o logged user', async (): Promise<void> => {
            const statusStub: SinonStub = stub(response, 'status');
            statusStub.withArgs(401).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('text/plain').returns(response);
            const sendStub: SinonStub = stub(response, 'send');
            sendStub.withArgs('Rejected authorization sign-off!n').returns(response);

            const getLoggedUserStub: SinonStub = stub(resource, 'getLoggedUser');
            const request: express.Request = <express.Request>{};
            getLoggedUserStub.withArgs(request).returns(null);

            // @ts-ignore: access to private method
            const processor: (request: express.Request, response: express.Response) => Promise<void> = resource.getLogOutProcessor();
            await processor(request, response);

            assert.isTrue(statusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStub.calledOnce);
            assert.isTrue(getLoggedUserStub.calledOnce);
            statusStub.restore();
            contentTypeStub.restore();
            sendStub.restore();
            getLoggedUserStub.restore();
        });
        test('w/ regular logged user', async (): Promise<void> => {
            const now: number = 987654321;
            const nowStub: SinonStub = stub(Date, 'now');
            nowStub.withArgs().returns(now);

            const cookieStub: SinonStub = stub(response, 'cookie');
            cookieStub.withArgs('UserId', { expires: now }).returns(response);
            cookieStub.withArgs('Token', { expires: now }).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('text/plain').returns(response);
            const sendStatusStub: SinonStub = stub(response, 'sendStatus');
            sendStatusStub.withArgs(200).returns(response);

            const getLoggedUserStub: SinonStub = stub(resource, 'getLoggedUser');
            const request: express.Request = <express.Request>{};
            const loggedUser: User = Object.assign(new User(), { id: 12345, sessionToken: '--test--token--' });
            getLoggedUserStub.withArgs(request).returns(loggedUser);

            // @ts-ignore: access to private attribute
            const updateStub: SinonStub = stub(resource.userService, 'update');
            updateStub.withArgs(12345, { id: 12345, sessionToken: '--' }, User.Internal).returns(Promise.resolve([12345]));

            // @ts-ignore: access to private method
            const processor: (request: express.Request, response: express.Response) => Promise<void> = resource.getLogOutProcessor();
            await processor(request, response);

            assert.isTrue(nowStub.calledOnce);
            assert.isTrue(cookieStub.calledTwice);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStatusStub.calledOnce);
            assert.isTrue(getLoggedUserStub.calledOnce);
            assert.isTrue(updateStub.calledOnce);
            nowStub.restore();
            cookieStub.restore();
            contentTypeStub.restore();
            sendStatusStub.restore();
            getLoggedUserStub.restore();
            updateStub.restore();
        });
    });

    suite('setupResponseParams()', (): void => {
        test('new user', async (): Promise<void> => {
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('text/plain').returns(response);
            const cookieStub: SinonStub = stub(response, 'cookie');
            cookieStub.withArgs('UserId', 12345, { secure: false, httpOnly: true }).returns(response);
            cookieStub.withArgs('Token', 'abcde', { secure: false, httpOnly: true }).returns(response);
            const locationStub: SinonStub = stub(response, 'location');
            locationStub.withArgs('/api/v1/User/12345').returns(response);
            const sendStatusStub: SinonStub = stub(response, 'sendStatus');
            sendStatusStub.withArgs(201).returns(response);

            // @ts-ignore: access to private method
            await resource.setupResponseParams(response, 12345, 'abcde', true);

            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(cookieStub.calledTwice);
            assert.isTrue(locationStub.calledOnce);
            assert.isTrue(sendStatusStub.calledOnce);
            // No need to restore the stubs as the response object will be garbage-collected
        });
        test('existing user', async (): Promise<void> => {
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('text/plain').returns(response);
            const cookieStub: SinonStub = stub(response, 'cookie');
            cookieStub.withArgs('UserId', 12345, { secure: false, httpOnly: true }).returns(response);
            cookieStub.withArgs('Token', 'abcde', { secure: false, httpOnly: true }).returns(response);
            const locationStub: SinonStub = stub(response, 'location');
            locationStub.withArgs('/api/v1/User/12345').returns(response);
            const sendStatusStub: SinonStub = stub(response, 'sendStatus');
            sendStatusStub.withArgs(200).returns(response);

            // @ts-ignore: access to private method
            await resource.setupResponseParams(response, 12345, 'abcde');

            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(cookieStub.calledTwice);
            assert.isTrue(locationStub.calledOnce);
            assert.isTrue(sendStatusStub.calledOnce);
            // No need to restore the stubs as the response object will be garbage-collected
        });
    });

    suite('generateSessionToken()', (): void => {
        test('w/ userId I', (): void => {
            // @ts-ignore: access to private method
            assert.isTrue(/--\d+--\d+--/.test(resource.generateSessionToken(123, null)));
        });
        test('w/ userId II', (): void => {
            const now: number = ((2 * 24 + 9) * 60 + 55) * 60 * 1000; // second day before noon
            const nowStub: SinonStub = stub(Date, 'now');
            nowStub.withArgs().returns(now);
            // @ts-ignore: access to private method
            assert.strictEqual(resource.generateSessionToken(123, null), '--' + AuthResource.TEST_ACCOUNT_ID + '--2--');
            assert.isTrue(nowStub.calledOnce);
            nowStub.restore();
        });
        test('w/ userId III', (): void => {
            const now: number = ((2 * 24 + 15) * 60 + 25) * 60 * 1000; // second day after noon
            const nowStub: SinonStub = stub(Date, 'now');
            nowStub.withArgs().returns(now);
            // @ts-ignore: access to private method
            assert.strictEqual(resource.generateSessionToken(123, null), '--' + AuthResource.TEST_ACCOUNT_ID + '--3--');
            assert.isTrue(nowStub.calledOnce);
            nowStub.restore();
        });
        test('w/ short idToken', (): void => {
            // @ts-ignore: access to private method
            assert.strictEqual(resource.generateSessionToken(null, 'abc'), 'abc');
        });
        test('w/ long idToken', (): void => {
            // @ts-ignore: access to private method
            assert.strictEqual(resource.generateSessionToken(null, 'abcdefghi-abcdefghi-abcdefghi-abcdefghi-abcdefghi-'), 'i-abcdefghi-abcdefghi-abcdefghi-');
        });
        test('w/o valid parameters', (): void => {
            // @ts-ignore: access to private method
            assert.throw(resource.generateSessionToken, ServerErrorException);
        });
    });

    suite('getIdTokenValidator()', (): void => {
        test('With the test account information not logged in', async (): Promise<void> => {
            const testAccountSuffix: string = process.env.TEST_ACCOUNT_SUFFIX;
            const request: express.Request = <express.Request>{ body: { idToken: '#automaticTests-' + testAccountSuffix } };
            const user: User = Object.assign(new User(), { id: AuthResource.TEST_ACCOUNT_ID, name: 'Tester', email: 'test@mail.com', sessionToken: '--' });
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(resource.userService, 'get');
            getStub.withArgs(AuthResource.TEST_ACCOUNT_ID, User.Internal).returns(Promise.resolve(user));
            // @ts-ignore: access to private method
            const generateSessionTokenStub = stub(resource, 'generateSessionToken');
            generateSessionTokenStub.withArgs(AuthResource.TEST_ACCOUNT_ID, null).returns('--testToken');
            // @ts-ignore: access to private attribute
            const updateStub: SinonStub = stub(resource.userService, 'update');
            updateStub.withArgs(AuthResource.TEST_ACCOUNT_ID, Object.assign(new User(), user, { sessionToken: '--testToken' }), User.Internal).returns(Promise.resolve(AuthResource.TEST_ACCOUNT_ID));
            // @ts-ignore: access to private method
            const setupResponseParamsStub: SinonStub = stub(resource, 'setupResponseParams');

            // @ts-ignore: access to private method
            const validator: (request: express.Request, response: express.Response) => Promise<void> = resource.getIdTokenValidator();
            await validator(request, response);

            assert.isTrue(getStub.calledOnce);
            assert.isTrue(generateSessionTokenStub.calledOnce);
            assert.isTrue(updateStub.calledOnce);
            assert.isTrue(setupResponseParamsStub.calledOnceWithExactly(response, AuthResource.TEST_ACCOUNT_ID, '--testToken', true));
        });
        test('With the test account information already logged in', async (): Promise<void> => {
            const testAccountSuffix: string = process.env.TEST_ACCOUNT_SUFFIX;
            const request: express.Request = <express.Request>{ body: { idToken: '#automaticTests-' + testAccountSuffix } };
            const user: User = Object.assign(new User(), { id: AuthResource.TEST_ACCOUNT_ID, name: 'Tester', email: 'test@mail.com', sessionToken: '--testToken' });
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(resource.userService, 'get');
            getStub.withArgs(AuthResource.TEST_ACCOUNT_ID, User.Internal).returns(Promise.resolve(user));
            // @ts-ignore: access to private method
            const generateSessionTokenStub = stub(resource, 'generateSessionToken');
            generateSessionTokenStub.withArgs(AuthResource.TEST_ACCOUNT_ID, null).returns('--testToken');
            // @ts-ignore: access to private attribute
            const updateStub: SinonStub = stub(resource.userService, 'update');
            // @ts-ignore: access to private method
            const setupResponseParamsStub: SinonStub = stub(resource, 'setupResponseParams');

            // @ts-ignore: access to private method
            const validator: (request: express.Request, response: express.Response) => Promise<void> = resource.getIdTokenValidator();
            await validator(request, response);

            assert.isTrue(getStub.calledOnce);
            assert.isTrue(generateSessionTokenStub.calledOnce);
            assert.isTrue(updateStub.notCalled);
            assert.isTrue(setupResponseParamsStub.calledOnceWithExactly(response, AuthResource.TEST_ACCOUNT_ID, '--testToken', true));
        });
        test('Existing user', async (): Promise<void> => {
            const request: express.Request = <express.Request>{ body: { idToken: 'token' } };
            const token: TokenPayload = <TokenPayload>{ email: 'test@mail.com' };
            const user: User = Object.assign(new User(), { id: 12345, email: 'test@mail.com' });
            // @ts-ignore: access to private method
            const verifyIdTokenStub: SinonStub = stub(resource, 'verifyIdToken');
            verifyIdTokenStub.withArgs('token').returns(Promise.resolve(token));
            // @ts-ignore: access to private attribute
            const selectStub: SinonStub = stub(resource.userService, 'select');
            selectStub.withArgs({ email: 'test@mail.com' }, { idOnly: false }, User.Internal).returns(Promise.resolve([user]));
            // @ts-ignore: access to private attribute
            const updateStub: SinonStub = stub(resource.userService, 'update');
            updateStub.withArgs(12345, Object.assign(user, { sessionToken: 'token' }), User.Internal).returns(Promise.resolve(12345));
            // @ts-ignore: access to private method
            const setupResponseParamsStub: SinonStub = stub(resource, 'setupResponseParams');

            // @ts-ignore: access to private method
            const validator: (request: express.Request, response: express.Response) => Promise<void> = resource.getIdTokenValidator();
            await validator(request, response);

            assert.isTrue(verifyIdTokenStub.calledOnce);
            assert.isTrue(selectStub.calledOnce);
            assert.isTrue(updateStub.calledOnce);
            assert.isTrue(setupResponseParamsStub.calledOnceWithExactly(response, 12345, 'token'));
            // No need to restore the stubs attached to the resource as it's recycled after each test
        });
        test('New local user', async (): Promise<void> => {
            const request: express.Request = <express.Request>{ body: { idToken: 'token' }, headers: {} };
            const token: TokenPayload = <TokenPayload>{
                email: 'test@mail.com',
                name: 'name',
                picture: 'http://image.url/',
                email_verified: true
            };
            const user: User = Object.assign(new User(), {
                email: 'test@mail.com',
                name: 'name',
                picture: 'http://image.url/',
                sessionToken: 'token',
                verifiedEmail: true
            });
            // @ts-ignore: access to private method
            const verifyIdTokenStub: SinonStub = stub(resource, 'verifyIdToken');
            verifyIdTokenStub.withArgs('token').returns(Promise.resolve(token));
            // @ts-ignore: access to private attribute
            const selectStub: SinonStub = stub(resource.userService, 'select');
            selectStub.withArgs({ email: 'test@mail.com' }, { idOnly: false }, User.Internal).returns(Promise.resolve([]));
            // @ts-ignore: access to private attribute
            const createStub: SinonStub = stub(resource.userService, 'create');
            createStub.withArgs(Object.assign(user, { sessionToken: 'token' }), User.Internal).returns(Promise.resolve(12345));
            // @ts-ignore: access to private method
            const setupResponseParamsStub: SinonStub = stub(resource, 'setupResponseParams');

            // @ts-ignore: access to private method
            const validator: (request: express.Request, response: express.Response) => Promise<void> = resource.getIdTokenValidator();
            await validator(request, response);

            assert.isTrue(verifyIdTokenStub.calledOnce);
            assert.isTrue(selectStub.calledOnce);
            assert.isTrue(createStub.calledOnce);
            assert.isTrue(setupResponseParamsStub.calledOnceWithExactly(response, 12345, 'token', true));
            // No need to restore the stubs attached to the resource as it's recycled after each test
        });
        test('New GAE user', async (): Promise<void> => {
            const headersGAE: { [key: string]: string } = {
                'X-AppEngine-CityLatLong': 'LatLong',
                'X-AppEngine-City': 'City',
                'X-AppEngine-Region': 'Region',
                'X-AppEngine-Country': 'Country'
            };
            const request: express.Request = <express.Request>{ body: { idToken: 'token' }, headers: headersGAE };
            const token: TokenPayload = <TokenPayload>{
                email: 'test@mail.com',
                name: 'name',
                picture: 'http://image.url/',
                email_verified: true
            };
            const user: User = Object.assign(new User(), {
                email: 'test@mail.com',
                name: 'name',
                picture: 'http://image.url/',
                sessionToken: 'token',
                verifiedEmail: true,
                latLong: 'LatLong',
                city: 'City',
                region: 'Region',
                country: 'Country'
            });
            // @ts-ignore: access to private method
            const verifyIdTokenStub: SinonStub = stub(resource, 'verifyIdToken');
            verifyIdTokenStub.withArgs('token').returns(Promise.resolve(token));
            // @ts-ignore: access to private attribute
            const selectStub: SinonStub = stub(resource.userService, 'select');
            selectStub.withArgs({ email: 'test@mail.com' }, { idOnly: false }, User.Internal).returns(Promise.resolve([]));
            // @ts-ignore: access to private attribute
            const createStub: SinonStub = stub(resource.userService, 'create');
            createStub.withArgs(Object.assign(user, { sessionToken: 'token' }), User.Internal).returns(Promise.resolve(12345));
            // @ts-ignore: access to private method
            const setupResponseParamsStub: SinonStub = stub(resource, 'setupResponseParams');

            // @ts-ignore: access to private method
            const validator: (request: express.Request, response: express.Response) => Promise<void> = resource.getIdTokenValidator();
            await validator(request, response);

            assert.isTrue(verifyIdTokenStub.calledOnce);
            assert.isTrue(selectStub.calledOnce);
            assert.isTrue(createStub.calledOnce);
            assert.isTrue(setupResponseParamsStub.calledOnceWithExactly(response, 12345, 'token', true));
            // No need to restore the stubs attached to the resource as it's recycled after each test
        });
        test('Failure', async (): Promise<void> => {
            const request: express.Request = <express.Request>{ body: { idToken: 'token' } };
            // @ts-ignore: access to private method
            const verifyIdTokenStub: SinonStub = stub(resource, 'verifyIdToken');
            verifyIdTokenStub.withArgs('token').throws('Done in purpose!');
            const statusStub: SinonStub = stub(response, 'status');
            statusStub.withArgs(401).returns(response);
            const contentTypeStub: SinonStub = stub(response, 'contentType');
            contentTypeStub.withArgs('text/plain').returns(response);
            const sendStub: SinonStub = stub(response, 'send');
            sendStub.withArgs('Rejected authorization token!').returns(response);

            // @ts-ignore: access to private method
            const validator: (request: express.Request, response: express.Response) => Promise<void> = resource.getIdTokenValidator();
            await validator(request, response);

            assert.isTrue(verifyIdTokenStub.calledOnce);
            assert.isTrue(statusStub.calledOnce);
            assert.isTrue(contentTypeStub.calledOnce);
            assert.isTrue(sendStub.calledOnce);
        });
    });

    suite('getLoggedUser()', (): void => {
        test('success from cache', async (): Promise<void> => {
            const request: express.Request = <express.Request>{ cookies: { 'UserId': '12345', 'Token': 'abcde' } };
            const user: User = Object.assign(new User(), { id: 12345, sessionToken: 'abcde' });
            // @ts-ignore: access to private attribute
            resource.loggedUserCache.set('abcde', user);

            assert.strictEqual(await resource.getLoggedUser(request), user);

            // No need to restore the stubs attached to the resource as it's recycled after each test
        });
        test('success from datastore', async (): Promise<void> => {
            const request: express.Request = <express.Request>{ cookies: { 'UserId': '12345', 'Token': 'abcde' } };
            const user: User = Object.assign(new User(), { id: 12345, sessionToken: 'abcde' });
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(resource.userService, 'get');
            getStub.withArgs(12345, User.Internal).returns(Promise.resolve(user));

            assert.strictEqual(await resource.getLoggedUser(request), user);

            assert.isTrue(getStub.calledOnce);
            // No need to restore the stubs attached to the resource as it's recycled after each test
        });
        test('failure', async (): Promise<void> => {
            const request: express.Request = <express.Request>{ cookies: { 'UserId': '12345', 'Token': 'abcde' } };
            const user: User = Object.assign(new User(), { id: 12345, sessionToken: 'vwxyz' });
            // @ts-ignore: access to private attribute
            const getStub: SinonStub = stub(resource.userService, 'get');
            getStub.withArgs(12345, User.Internal).returns(Promise.resolve(user));

            assert.isNull(await resource.getLoggedUser(request));

            assert.isTrue(getStub.calledOnce);
            // No need to restore the stubs attached to the resource as it's recycled after each test
        });
        test('no userId nor token', async (): Promise<void> => {
            const request: express.Request = <express.Request>{ cookies: {} };
            assert.isNull(await resource.getLoggedUser(request));
        });
        test('no token', async (): Promise<void> => {
            const request: express.Request = <express.Request>{ cookies: { 'UserId': '12345' } };
            assert.isNull(await resource.getLoggedUser(request));
        });
    });

    suite('verifyIdToken()', (): void => {
        test('success', async (): Promise<void> => {
            // @ts-ignore: access to private attribute
            const verifyIdTokenStub: SinonStub = stub(resource.oauth2Client, 'verifyIdToken');
            const ticket: LoginTicket = <LoginTicket>{
                getPayload(): TokenPayload { return null; }
            };
            // @ts-ignore: access to private attribute
            verifyIdTokenStub.withArgs({ idToken: 'token', audience: resource.CLIENT_ID }).returns(Promise.resolve(ticket));
            const getPayloadStub: SinonStub = stub(ticket, 'getPayload');
            const payload: TokenPayload = <TokenPayload>{
                // @ts-ignore: access to private attribute
                aud: resource.CLIENT_ID,
                exp: new Date(new Date().getTime() + 5 * 60 * 1000).getTime()
            };
            getPayloadStub.withArgs().returns(payload);

            // @ts-ignore: access to private method
            assert.strictEqual(await resource.verifyIdToken('token'), payload);

            assert.isTrue(verifyIdTokenStub.calledOnce);
            assert.isTrue(getPayloadStub.calledOnce);
        });
        test('failure @ verifyIdToken()', async (): Promise<void> => {
            // @ts-ignore: access to private attribute
            const verifyIdTokenStub: SinonStub = stub(resource.oauth2Client, 'verifyIdToken');
            // @ts-ignore: access to private attribute
            verifyIdTokenStub.withArgs({ idToken: 'token', audience: resource.CLIENT_ID }).returns(Promise.reject('Done in purpose!'));

            try {
                // @ts-ignore: access to private method
                await resource.verifyIdToken('token');
                throw new Error('Unexpected success!');
            }
            catch (error) {
                if (error !== 'Done in purpose!') {
                    throw error;
                }
            }

            assert.isTrue(verifyIdTokenStub.calledOnce);
        });
        test('failure @ aud comparison', async (): Promise<void> => {
            // @ts-ignore: access to private attribute
            const verifyIdTokenStub: SinonStub = stub(resource.oauth2Client, 'verifyIdToken');
            const ticket: LoginTicket = <LoginTicket>{
                getPayload(): TokenPayload { return null; }
            };
            // @ts-ignore: access to private attribute
            verifyIdTokenStub.withArgs({ idToken: 'token', audience: resource.CLIENT_ID }).returns(Promise.resolve(ticket));
            const getPayloadStub: SinonStub = stub(ticket, 'getPayload');
            const payload: TokenPayload = <TokenPayload>{
                aud: '???',
                exp: new Date(new Date().getTime() + 5 * 60 * 1000).getTime()
            };
            getPayloadStub.withArgs().returns(payload);

            try {
                // @ts-ignore: access to private method
                await resource.verifyIdToken('token');
                throw new Error('Unexpected success!');
            }
            catch (error) {
                if (error !== '`aud` does not match the CLIENT_ID!') {
                    throw error;
                }
            }

            assert.isTrue(verifyIdTokenStub.calledOnce);
            assert.isTrue(getPayloadStub.calledOnce);
        });
        test('failure @ exp in past', async (): Promise<void> => {
            // @ts-ignore: access to private attribute
            const verifyIdTokenStub: SinonStub = stub(resource.oauth2Client, 'verifyIdToken');
            const ticket: LoginTicket = <LoginTicket>{
                getPayload(): TokenPayload { return null; }
            };
            // @ts-ignore: access to private attribute
            verifyIdTokenStub.withArgs({ idToken: 'token', audience: resource.CLIENT_ID }).returns(Promise.resolve(ticket));
            const getPayloadStub: SinonStub = stub(ticket, 'getPayload');
            const payload: TokenPayload = <TokenPayload>{
                // @ts-ignore: access to private attribute
                aud: resource.CLIENT_ID,
                exp: new Date().getTime() / 1000 - 5 * 60
            };
            getPayloadStub.withArgs().returns(payload);

            try {
                // @ts-ignore: access to private method
                await resource.verifyIdToken('token');
                throw new Error('Unexpected success!');
            }
            catch (error) {
                if (!error.startsWith('`exp` is set in the past!')) {
                    throw error;
                }
            }

            assert.isTrue(verifyIdTokenStub.calledOnce);
            assert.isTrue(getPayloadStub.calledOnce);
        });
    });
});