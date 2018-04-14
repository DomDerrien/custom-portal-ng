import * as express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { LoginTicket, TokenPayload } from 'google-auth-library/build/src/auth/loginticket';

import { UserService } from '../service/UserService';
import { User } from '../model/User';

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

export class AuthResource {
    private static instance: AuthResource;
    private userService: UserService;

    // Factory method
    public static getInstance(): AuthResource {
        if (!AuthResource.instance) {
            AuthResource.instance = new AuthResource();
        }
        return AuthResource.instance;
    }

    private constructor() {
        this.userService = UserService.getInstance();
    }

    public getRouter(): express.Router {
        let basePath: string = '/api/v1/Auth';

        let router: express.Router = express.Router();
        router.post(basePath + '/', this.idTokenValidator);

        console.log('Ready to serve requests sent to:', basePath);
        return router;
    }

    private async setupResponseParams(response: express.Response, userId: number, sessionToken: string, newUser: boolean = false): Promise<void> {
        response.
            cookie('UserId', userId, { secure: false, httpOnly: true }). // TODO: identify the local dev server for `secure:false`, default being `secure:true`
            cookie('Token', sessionToken, { secure: false, httpOnly: true }).
            contentType('text/plain').
            location('/api/v1/User/' + userId).
            sendStatus(newUser ? 201 : 200); // HTTP status: CREATED or OK
    }

    private get idTokenValidator(): (request: express.Request, response: express.Response) => void {
        return async (request: express.Request, response: express.Response): Promise<void> => {
            try {
                const idToken: string = request.body.idToken;
                const decodedToken: TokenPayload = await this.verifyIdToken(idToken);
                const sessionToken: string = idToken.substring(Math.max(0, idToken.length - 32));

                const email: string = decodedToken.email;
                const users: Array<User> = <Array<User>>await this.userService.select({ email: email }, { idOnly: false }, User.Internal);
                if (0 < users.length) {
                    const user: User = users[0];
                    await this.userService.update(user.id, Object.assign(user, { sessionToken: sessionToken }), User.Internal);
                    return this.setupResponseParams(response, user.id, sessionToken);
                }

                const user: User = Object.assign(new User(), {
                    email: email,
                    name: decodedToken.name,
                    picture: decodedToken.picture,
                    sessionToken: sessionToken,
                    verifiedEmail: decodedToken.email_verified
                });
                if (request.headers[GAE_STANDARD_HEADER_NAMES.CityLatLong]) {
                    user.latLong = <string>request.headers[GAE_STANDARD_HEADER_NAMES.CityLatLong];
                    user.city = <string>request.headers[GAE_STANDARD_HEADER_NAMES.City];
                    user.region = <string>request.headers[GAE_STANDARD_HEADER_NAMES.Region];
                    user.country = <string>request.headers[GAE_STANDARD_HEADER_NAMES.Country];
                }
                const userId = await this.userService.create(user, User.Internal);
                this.setupResponseParams(response, userId, sessionToken, true);
            }
            catch (error) {
                console.log('Cannot verifiy the Google IdToken', error);
                response.status(401).contentType('text/plain').send('Rejected authorization token!');
            }
        };
    }

    public async getLoggedUser(request: express.Request): Promise<User> {
        const userId: number = parseInt(request.cookies['UserId']);
        const sessionToken: string = request.cookies['Token'];
        const user: User = <User>await this.userService.get(userId, User.Internal);
        if (user.sessionToken === sessionToken) {
            return user;
        }
        return Promise.resolve(null);
    }

    private readonly CLIENT_ID: string = '273389031064-d7cu4dnn3a48kerusgr7k1tnf3i6jj1v.apps.googleusercontent.com';

    private async verifyIdToken(idToken: string): Promise<TokenPayload> {
        return new Promise(((resolve: (value: TokenPayload) => void, reject: (reason: any) => void) => {
            const client = new OAuth2Client(this.CLIENT_ID, '', '');
            client.verifyIdToken({ idToken: idToken, audience: this.CLIENT_ID }).then(
                (loginTicket: LoginTicket): void => {
                    const decodedToken: TokenPayload = loginTicket.getPayload();
                    if (decodedToken.aud !== this.CLIENT_ID) {
                        reject('`aud` does not match the CLIENT_ID!');
                        return;
                    }
                    if (new Date().getTime() < decodedToken.exp) {
                        reject('`exp` is set in the past! ' + new Date(decodedToken.exp));
                        return;
                    }
                    resolve(decodedToken);
                }
            ).catch(
                (reason: any): void => {
                    reject(reason);
                }
            );
        }));
    }
}