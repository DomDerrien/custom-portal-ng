import { PolymerElement } from '@polymer/polymer/polymer-element.js';

import { tmpl } from './auth.tmpl.js';

import { User } from '../model/User.js';

// Source: Google Sign-in for websites
// https://developers.google.com/identity/sign-in/web/

// Source: Google One-tap sign-in and automatic sign-in
// https://developers.google.com/identity/one-tap/web/overview

/* Mechanism:
 *
 * 1. Once the Google Smart-lock library is loaded:
 *    1.1 There an attempt for automatic sign-in
 *        If successful, there's a little popup showing the association and then the display of the logged user data
 *    1.2 If a signed in account is detected, a popup proposed the logged in user to sign in to continue with the application
 *        If successful, there's a little popup showing the association and then the display of the logged user data
 *    1.3 If no signed in account is detected, the application displays a popup with a message inviting the user to login into her Google account
 *    1.4 If the user declines to sign in, a popup tells the user to come back when she's ready to share her identity
 *
 * 2. If the user chooses to login to her Google account
 *    2.1 A standalone popup is open within the Google domain for the user to securly login
 *    2.2 If the login is successful, when the popup is closed, the application is reloaded and the process restarts at step 1
 *    2.3 If there's no successful login, a popup tells the user to come back when she's ready to share her identity
 */
const SUPPORTED_AUTH_METHODS: Array<string> = [
    "https://accounts.google.com",
    // "googleyolo://id-and-password", // Not supported by Custom-Portal
];
const SUPPORTED_ID_TOKEN_PROVIDERS: Array<{ [key: string]: string }> = [{
    uri: "https://accounts.google.com",
    clientId: "273389031064-d7cu4dnn3a48kerusgr7k1tnf3i6jj1v.apps.googleusercontent.com"
}];

interface YoloResponse {
    id: string;
    password: string;
    idToken: string;
}

class YoloError {
    public type: 'userCanceled' | 'noCredentialsAvailable' | 'requestFailed' | 'operationCanceled"' | 'illegalConcurrentRequest' | 'initializationError' | 'configurationError' | 'unknown';
}

let loggedUser: User;
let loggedUserPromise: Promise<User>;
let loggedUserPromiseResolver: (value: User) => void;
let googleYoloController: any;

export const getLoggedUser = (): Promise<User> => {
    if (!loggedUserPromise) {
        loggedUserPromise = new Promise((resolve: (value: User) => void, reject: (reason: any) => void): void => {
            if (loggedUser != undefined) {
                resolve(loggedUser);
                return;
            }
            loggedUserPromiseResolver = resolve;
        });
    }
    return loggedUserPromise;
}

export const signOut = async (): Promise<void> => {
    if (loggedUser) {
        googleYoloController.disableAutoSignIn().then((): void => {
            const auth2Controller = window.gapi.auth2 ? window.gapi.auth2.getAuthInstance() : null;
            if (auth2Controller) {
                auth2Controller.signOut();
            }
        }).then((): Promise<Response> => fetch(
            '/api/v1/Auth',
            {
                credentials: 'same-origin',
                cache: 'no-cache',
                method: 'DELETE'
            }
        )).then((): void => {
            window.location.reload();
        });
    }
}

export class AuthenticationController extends PolymerElement {
    public static get is(): string {
        return 'portal-auth';
    }

    public static get template(): HTMLTemplateElement {
        return tmpl;
    }

    public ready(): void {
        super.ready();

        window.onGoogleYoloLoad = this._triggerLoggedUserRetreival.bind(this);
    }

    private async _getUser(location: string): Promise<User> {
        const response: Response = await fetch(location, {
            credentials: 'same-origin',
            headers: {
                'content-type': 'application/json'
            },
            method: 'GET'
        });
        if (response.status === 200 || response.status === 201) {
            return response.json();
        }
        return null;
    }

    private async _useGoogleIdTokenForAuth(idToken: string): Promise<User> {
        // A Google Account is retrieved. Since Google supports ID token responses,  you can use the token to sign in instead of initiating the Google sign-in flow.
        const response: Response = await fetch(
            '/api/v1/Auth',
            {
                body: `{"idToken":"${idToken}"}`,
                credentials: 'same-origin',
                cache: 'no-cache',
                headers: {
                    'content-type': 'application/json'
                },
                method: 'POST'
            }
        );
        if (response.status === 200 || response.status === 201) {
            const loggedUserLocation: string = response.headers.get('Location');
            this._saveLoggedUser(await this._getUser(loggedUserLocation));
        }
        else {
            this._saveLoggedUser(null);
        }
        return getLoggedUser();
    }

    private async _automaticSignIn(googleYolo: any): Promise<User> {
        return googleYolo.retrieve({
            supportedAuthMethods: SUPPORTED_AUTH_METHODS,
            supportedIdTokenProviders: SUPPORTED_ID_TOKEN_PROVIDERS
        }).then((response: YoloResponse): Promise<User> => {
            if (response.idToken) {
                return this._useGoogleIdTokenForAuth(response.idToken);
            }
            throw new Error('Login with username and password is not implemented by Custom-Portal');
        }).catch((error: YoloError): never => {
            throw error;
        })
    }

    private async _oneTapSignIn(googleYolo: any): Promise<User> {
        return googleYolo.hint({
            supportedAuthMethods: SUPPORTED_AUTH_METHODS,
            supportedIdTokenProviders: SUPPORTED_ID_TOKEN_PROVIDERS,
            context: 'signUp'
        }).then((response: YoloResponse): Promise<User> => {
            if (response.idToken) {
                return this._useGoogleIdTokenForAuth(response.idToken);
            }
            throw new Error('Login with username and password is not implemented by Custom-Portal');
        }).catch((error: YoloError): never => {
            throw error;
        });
    }

    private async _triggerLoggedUserRetreival(googleYolo: any): Promise<User | null> {
        googleYoloController = googleYolo;

        return this._automaticSignIn(googleYolo).catch((error: YoloError): Promise<User> => {
            if (error.type === 'noCredentialsAvailable') {
                return this._oneTapSignIn(googleYolo);
            }
            throw Object.assign(new YoloError(), {
                type: 'unknown'
            });
        }).catch((error: YoloError): Promise<User> => {
            if (error.type === 'noCredentialsAvailable') {
                // saveLoggedUser(null);
                const message: string = `No signed in Google account detected...<br/>Use the "Sign-in" button to login into your Google account.`;
                (<any>this).dispatchEvent(new CustomEvent('show-dialog', { bubbles: true, composed: true, detail: { text: message } }));

                this.$.googleLoginBtn.style.display = 'block';
                if (window.location.hash.startsWith('#automaticTests-')) {
                    this.$.googleLoginBtn.addEventListener('click', (event: Event): void => {
                        this._useGoogleIdTokenForAuth(window.location.hash);
                    }, { once: true });
                }
                else {
                    window.gapi.load('auth2', () => {
                        // For scopes, look at: https://developers.google.com/identity/protocols/googlescopes
                        // - email
                        // - profile
                        // - https://www.googleapis.com/auth/calendar.readonly
                        // - https://www.googleapis.com/auth/cloud-platform // Cloud Tasks
                        // - https://www.googleapis.com/auth/drive.readonly
                        // - https://www.googleapis.com/auth/fitness.activity.write
                        // - https://www.googleapis.com/auth/gmail.readonly
                        // - https://www.googleapis.com/auth/urlshortener
                        // - https://www.googleapis.com/auth/cloud-translation
                        // - https://www.googleapis.com/auth/youtube.readonly

                        // For incremental authorization: https://developers.google.com/identity/protocols/OAuth2UserAgent#incrementalAuth

                        const auth2Lib = window.gapi.auth2.init({
                            client_id: SUPPORTED_ID_TOKEN_PROVIDERS[0].clientId,
                            fetch_basic_profile: true, // Otherwise the ticked won't have the user's profile and the on-the-fly user account creation will fail server-side
                            scope: 'profile'
                        });
                        auth2Lib.attachClickHandler(this.$.googleLoginBtn, {},
                            (googleUser: { getAuthResponse: () => { id_token: string } }) => {
                                this._useGoogleIdTokenForAuth(googleUser.getAuthResponse().id_token);
                            },
                            (error: any) => {
                                const message: string = `This application requires a valid login to enable its features!<br/>Please, visit us again when you accept to share a unique identity.`;
                                (<any>this).dispatchEvent(new CustomEvent('show-dialog', { bubbles: true, composed: true, detail: { text: message } }));
                            });
                    });
                }
            }
            else if (error.type === 'userCanceled') {
                const message: string = `This application requires a valid login to enable its features!<br/>Please, visit us again when you accept to share a unique identity.`;
                (<any>this).dispatchEvent(new CustomEvent('show-dialog', { bubbles: true, composed: true, detail: { text: message } }));
            }
            return null;
        });
    }

    private _saveLoggedUser(user: User): void {
        loggedUser = user;
        if (loggedUserPromiseResolver) {
            loggedUserPromiseResolver(user);
            return;
        }
    }
}

customElements.define(AuthenticationController.is, AuthenticationController);