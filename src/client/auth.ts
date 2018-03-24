// Documentation: https://developers.google.com/identity/
// Documentation: https://developers.google.com/identity/one-tap/web/
import { User } from './model/User.js';
import { Shell } from './shell.js';

// Source: Google One-tap sign-in and automatic sign-in
// https://developers.google.com/identity/one-tap/web/overview

const SUPPORTED_AUTH_METHODS: Array<string> = [
    "https://accounts.google.com",
    "googleyolo://id-and-password",
];
const SUPPORTED_ID_TOKEN_PROVIDERS: Array<{ [key: string]: string }> = [{
    uri: "https://accounts.google.com",
    clientId: "273389031064-g5buehmojtmebs0v3rgonm8v28aa4s8v.apps.googleusercontent.com"
}];

interface YoloResponse {
    id: string;
    password: string;
    idToken: string;
}

class YoloError {
    public type: 'userCanceled' | 'noCredentialsAvailable' | 'requestFailed' | 'operationCanceled"' | 'illegalConcurrentRequest' | 'initializationError' | 'configurationError' | 'unknown';
}

async function automaticSignIn(googleYolo: any): Promise<User> {
    return googleYolo.retrieve({
        supportedAuthMethods: SUPPORTED_AUTH_METHODS,
        supportedIdTokenProviders: SUPPORTED_ID_TOKEN_PROVIDERS
    }).then((response: YoloResponse): Promise<User> => {
        if (response.password) {
            return signInWithEmailAndPassword(response.id, response.password);
        }
        return useGoogleIdTokenForAuth(response.idToken);
    }).catch((error: YoloError): never => {
        throw error;
    })
}

async function oneTapSignIn(googleYolo: any): Promise<User> {
    return googleYolo.hint({
        supportedAuthMethods: SUPPORTED_AUTH_METHODS,
        supportedIdTokenProviders: SUPPORTED_ID_TOKEN_PROVIDERS,
        context: 'signUp'
    }).then((response: YoloResponse): Promise<User> => {
        if (response.password) {
            return signInWithEmailAndPassword(response.id, response.password);
        }
        return useGoogleIdTokenForAuth(response.idToken);
    }).catch((error: YoloError): never => {
        throw error;
    });

}

const triggerLoggedUserRetreival = async (googleYolo: any): Promise<User | null> => {

    return automaticSignIn(googleYolo).catch((error: YoloError): Promise<User> => {
        if (error.type === 'noCredentialsAvailable') {
            return oneTapSignIn(googleYolo);
        }
        throw Object.assign(new YoloError(), {
            type: 'unknown'
        });
    }).catch((error: YoloError): Promise<User> => {
        if (error.type === 'noCredentialsAvailable') {
            // saveLoggedUser(null);
            appShellRef.showDialogFeedback(`
                No signed in Google accounts available...<br/>
                Please, visit <a href="https://accounts.google.com" target="_googleAccount">accounts.google.com</a> to ensure that<br/>
                at least one account is signed in, otherwise this application will remain unuseful!
            `);

        }
        else if (error.type === 'userCanceled') {
            appShellRef.showDialogFeedback(`
                This application requires a valid login to enable its features!<br/>
                Please, visit us again when you accept to share a unique identity.
            `);
        }
        return null;
    });
}

let appShellRef: Shell;
let appContext: Window;

export const setupAuth = (appShell: Shell, context: Window = window): void => {
    appShellRef = appShell;
    appContext = context;
    appContext.onGoogleYoloLoad = triggerLoggedUserRetreival;
}

let loggedUser: User;
let loggedUserPromise: Promise<User>;
let loggedUserPromiseResolver: (value: User) => void;

const saveLoggedUser = (user: User): void => {
    if (loggedUserPromiseResolver) {
        loggedUserPromiseResolver(user);
        return;
    }
    loggedUser = user;
}

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

async function signInWithEmailAndPassword(userId: string, password: string): Promise<User> {
    // An ID (usually email address) and password credential was retrieved.
    // Sign in to your backend using the password.
    console.log('ID and password to pass to back-end for verification...');
    return null;
}

async function useGoogleIdTokenForAuth(idToken: string): Promise<User> {
    // A Google Account is retrieved. Since Google supports ID token responses,  you can use the token to sign in instead of initiating the Google sign-in flow.
    const response: Response = await fetch('/api/v1/Auth', {
        body: `{"idToken":"${idToken}"}`,
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'user-agent': 'Mozilla/4.0 MDN Example',
            'content-type': 'application/json'
        },
        method: 'POST'
    });
    if (response.status === 200 || response.status === 201) {
        const loggedUserLocation = response.headers.get('Location');
        saveLoggedUser(await getUser(loggedUserLocation));
    }
    else {
        saveLoggedUser(null);
    }
    return getLoggedUser();
}

async function getUser(location: string): Promise<User> {
    const response: Response = await fetch(location, {
        credentials: 'same-origin',
        headers: {
            'user-agent': 'Mozilla/4.0 MDN Example',
            'content-type': 'application/json'
        },
        method: 'GET'
    });
    if (response.status === 200 || response.status === 201) {
        return response.json();
    }
    return null;
}