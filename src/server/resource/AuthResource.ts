import * as express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { LoginTicket, TokenPayload } from 'google-auth-library/build/src/auth/loginticket';

import { UserService } from '../service/UserService';
import { User } from '../model/User';
import { ServerErrorException } from '../exception/ServerErrorException';
import { NotAuthorizedException } from '../exception/NotAuthorizedException';

const GAE_STANDARD_HEADER_NAMES: { [key: string]: string } = {
    cityLatLong: 'X-AppEngine-CityLatLong',
    city: 'X-AppEngine-City',
    region: 'X-AppEngine-Region',
    country: 'X-AppEngine-Country',
    https: 'X-AppEngine-Https',
    userIP: 'X-AppEngine-User-IP',
    traceContext: 'X-Cloud-Trace-Context',
    email: 'X-AppEngine-User-Email',
    authDomain: 'X-AppEngine-Auth-Domain',
    userId: 'X-AppEngine-User-ID',
    nickname: 'X-AppEngine-User-Nickname',
    organization: 'X-AppEngine-User-Organization',
    isAdmin: 'X-AppEngine-User-Is-Admin',
}

// AuthResource does not extends BaseResource because it does not define operations for a specific resource
// It does however process one entry point to help authenticating a user. It relies on Google OAuth service.
// For this entry point, it mimics a BaseResource-like class with the methods `getIntance()` and `getRoute()`.

export class AuthResource {
    private static instance: AuthResource;
    private userService: UserService;
    private oauth2Client: OAuth2Client;
    public static readonly TEST_ACCOUNT_ID: number = 5764878782431232; // Test account identifier
    private readonly CLIENT_ID: string = '273389031064-d7cu4dnn3a48kerusgr7k1tnf3i6jj1v.apps.googleusercontent.com';

    // Factory method
    public static getInstance(): AuthResource {
        if (!AuthResource.instance) {
            AuthResource.instance = new AuthResource();
        }
        return AuthResource.instance;
    }

    private constructor() {
        this.userService = UserService.getInstance();
        this.oauth2Client = new OAuth2Client(this.CLIENT_ID, '', '');
    }

    public getRouter(): express.Router {
        let basePath: string = '/api/v1/Auth';

        let router: express.Router = express.Router();
        router.post(basePath + '/', this.getIdTokenValidator());
        router.delete(basePath + '/', this.getLogOutProcessor())

        console.log('Ready to serve requests sent to:', basePath);
        return router;
    }

    private getLogOutProcessor(): (request: express.Request, response: express.Response) => Promise<void> {
        return async (request: express.Request, response: express.Response): Promise<void> => {
            try {
                const loggedUser: User = await this.getLoggedUser(request);
                if (loggedUser === null) {
                    throw new NotAuthorizedException('Invalid authorization pattern');
                }
                await this.userService.update(loggedUser.id, Object.assign(loggedUser, { sessionToken: '--' }), User.Internal);
                const now: number = Date.now();
                response.
                    cookie('UserId', { expires: now }).
                    cookie('Token', { expires: now }).
                    contentType('text/plain').
                    sendStatus(200);
            }
            catch (error) {
                console.log('Logout failed!', error);
                response.status(401).contentType('text/plain').send('Rejected authorization sign-off!');
            }
        };
    }

    private async setupResponseParams(response: express.Response, userId: number, sessionToken: string, newUser: boolean = false): Promise<void> {
        const status: number = newUser ? 201 : 200; // HTTP status: CREATED or OK
        response
            .cookie('UserId', userId, { secure: false, httpOnly: true }) // TODO: identify the local dev server for `secure:false`, default being `secure:true`
            .cookie('Token', sessionToken, { secure: false, httpOnly: true })
            .contentType('text/plain')
            .location('/api/v1/User/' + userId)
            .sendStatus(status);
    }

    private generateSessionToken(userId: number, googleSessionToken: string): string {
        if (userId) {
            // Token generated for test purposes: number of the day since epoch, with a switch @ noon
            const short: number = Math.round(Date.now() / (24 * 60 * 60 * 1000));
            return '--' + AuthResource.TEST_ACCOUNT_ID + '--' + short + '--';
        }
        if (googleSessionToken) {
            return googleSessionToken.substring(Math.max(0, googleSessionToken.length - 32));
        }
        throw new ServerErrorException('Error while generating a session token');
    }

    private getIdTokenValidator(): (request: express.Request, response: express.Response) => Promise<void> {
        return async (request: express.Request, response: express.Response): Promise<void> => {
            try {
                const idToken: string = request.body.idToken;
                const testAccountSuffix: string = process.env.TEST_ACCOUNT_SUFFIX;

                if (testAccountSuffix && idToken === ('#automaticTests-' + testAccountSuffix)) {
                    const user: User = await this.userService.get(AuthResource.TEST_ACCOUNT_ID, User.Internal);
                    const sessionToken: string = this.generateSessionToken(AuthResource.TEST_ACCOUNT_ID, null);
                    if (user.sessionToken !== sessionToken) {
                        await this.userService.update(AuthResource.TEST_ACCOUNT_ID, Object.assign(user, { sessionToken: sessionToken }), User.Internal);
                    }

                    return this.setupResponseParams(response, AuthResource.TEST_ACCOUNT_ID, sessionToken, true);
                }

                const decodedToken: TokenPayload = await this.verifyIdToken(idToken);
                const sessionToken: string = this.generateSessionToken(null, idToken);

                const email: string = decodedToken.email;
                const users: Array<User> = <Array<User>>await this.userService.select({ email: email }, { idOnly: false }, User.Internal);
                if (0 < users.length) {
                    const user: User = users[0];
                    const userId: number = await this.userService.update(user.id, Object.assign(user, { sessionToken: sessionToken }), User.Internal);
                    return this.setupResponseParams(response, userId, sessionToken);
                }

                const user: User = Object.assign(new User(), {
                    email: email,
                    name: decodedToken.name,
                    picture: decodedToken.picture,
                    sessionToken: sessionToken,
                    verifiedEmail: decodedToken.email_verified
                });
                if (request.headers[GAE_STANDARD_HEADER_NAMES.cityLatLong]) {
                    user.latLong = <string>request.headers[GAE_STANDARD_HEADER_NAMES.cityLatLong];
                    user.city = <string>request.headers[GAE_STANDARD_HEADER_NAMES.city];
                    user.region = <string>request.headers[GAE_STANDARD_HEADER_NAMES.region];
                    user.country = <string>request.headers[GAE_STANDARD_HEADER_NAMES.country];
                }
                const userId = await this.userService.create(user, User.Internal);
                this.setupResponseParams(response, userId, sessionToken, true);
            }
            catch (error) {
                console.log('Cannot verify the Google IdToken', error);
                response.status(401).contentType('text/plain').send('Rejected authorization token!');
            }
        };
    }

    public async getLoggedUser(request: express.Request): Promise<User | null> {
        const userId: number = parseInt(request.cookies['UserId']);
        const sessionToken: string = request.cookies['Token'];
        if (userId && sessionToken) {
            try {
                const user: User = <User>await this.userService.get(userId, User.Internal);
                if (user.sessionToken === sessionToken) {
                    return user;
                }
            }
            catch (ex) { }
        }
        return Promise.resolve(null);
    }


    private async verifyIdToken(idToken: string): Promise<TokenPayload> {
        return new Promise(((resolve: (value: TokenPayload) => void, reject: (reason: any) => void) => {
            this.oauth2Client.verifyIdToken({ idToken: idToken, audience: this.CLIENT_ID })
                .then((loginTicket: LoginTicket): void => {
                    const decodedToken: TokenPayload = loginTicket.getPayload();
                    if (decodedToken.aud !== this.CLIENT_ID) {
                        reject('`aud` does not match the CLIENT_ID!');
                        return;
                    }
                    if (decodedToken.exp * 1000 < new Date().getTime()) {
                        reject('`exp` is set in the past! ' + new Date(decodedToken.exp * 1000) + ' vs ' + new Date());
                        return;
                    }
                    resolve(decodedToken);
                })
                .catch((reason: any): void => {
                    reject(reason);
                });
        }));
    }
}