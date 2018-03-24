import { User } from './model/User.js';
import { Shell } from './shell.js';

// Source: Google One-tap sign-in and automatic sign-in
// https://developers.google.com/identity/one-tap/web/overview

const SUPPORTED_AUTH_METHODS: Array<string> = [
    "https://accounts.google.com",
    // "googleyolo://id-and-password",
];
const SUPPORTED_ID_TOKEN_PROVIDERS: Array<{ [key: string]: string }> = [{
    uri: "https://accounts.google.com",
    clientId: "273389031064-g5buehmojtmebs0v3rgonm8v28aa4s8v.apps.googleusercontent.com"
}];

async function automaticSignIn(googleYolo: any): Promise<User> {
    const credential = await googleYolo.retrieve({
        supportedAuthMethods: SUPPORTED_AUTH_METHODS,
        supportedIdTokenProviders: SUPPORTED_ID_TOKEN_PROVIDERS
    });

    if (credential.password) {
        return signInWithEmailAndPassword(credential.id, credential.password);
    }
    return useGoogleIdTokenForAuth(credential.idToken);
}

async function oneTapSignIn(googleYolo: any): Promise<User> {
    const credential = await googleYolo.hint({
        supportedAuthMethods: SUPPORTED_AUTH_METHODS,
        supportedIdTokenProviders: SUPPORTED_ID_TOKEN_PROVIDERS
    });

    if (credential.password) {
        return signInWithEmailAndPassword(credential.id, credential.password);
    }
    return useGoogleIdTokenForAuth(credential.idToken);
}

const triggerLoggedUserRetreival = async (googleYolo: any): Promise<User> => {

    try {
        return automaticSignIn(googleYolo);
    }
    catch (error) {
        if (error.type === 'noCredentialsAvailable') {
            try {
                return oneTapSignIn(googleYolo);
            }
            catch (error) { }
        }
        saveLoggedUser(null);
    }

    // switch (error.type) {
    //     case "userCanceled": break; // The user closed the hint selector. Depending on the desired UX, request manual sign up or do nothing.
    //     case "noCredentialsAvailable": break; // No hint available for the session. Depending on the desired UX, request manual sign up or do nothing.
    //     case "requestFailed": break; // The request failed, most likely because of a timeout. You can retry another time if necessary.
    //     case "operationCanceled": break; // The operation was programmatically canceled, do nothing.
    //     case "illegalConcurrentRequest": break; // Another operation is pending, this one was aborted.
    //     case "initializationError":break; // Failed to initialize. Refer to error.message for debugging.
    //     case "configurationError": break; // Configuration error. Refer to error.message for debugging.
    //     default: // Unknown error, do nothing.
    // }
}

export const setupAuth = (appShell: Shell): void => {
    (<any>window).onGoogleYoloLoad = triggerLoggedUserRetreival;
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