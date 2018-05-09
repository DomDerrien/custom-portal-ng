import { Remote } from 'intern/lib/executors/Node';
import RemoteElement from '@theintern/leadfoot/Element';
import Command from '@theintern/leadfoot/Command';
import pollUntil, { Poller } from '@theintern/leadfoot/helpers/pollUntil';
import Task from '@dojo/core/async/Task';
import { default as fetch, Response } from 'node-fetch';

// Function executed on the client
// Get an Element instance while traversing the`shadowRoot` of the custom elements, and return it only if it is visible
export function findElement(...path: Array<string>): ParentNode {
    const element: ParentNode = path.reduce((prev: ParentNode, part: string): ParentNode => {
        return prev === null ? null : part === '^' ? (<Element>prev).shadowRoot : prev.querySelector(part)
    }, document);
    if (!element) {
        return null;
    }
    const style: CSSStyleDeclaration = window.getComputedStyle(<Element>element);
    const invisible: boolean = style.display === 'none' || style.opacity === '0' || style.visibility === 'hidden';
    return invisible ? null : element;
}

// Function executed on the client
// Get any Element instance while traversing the`shadowRoot` of the custom elements, no visiblity status checked
export function findAllElements(...path: Array<string>): NodeList {
    const limit: number = path.length - 1;
    return <NodeList>path.reduce((prev: ParentNode, part: string, idx: number): ParentNode | NodeList => {
        return prev === null ? null : part === '^' ? (<Element>prev).shadowRoot : idx === limit ? prev.querySelectorAll(part) : prev.querySelector(part);
    }, document);
}

// Helper related to the test environment
// Open the application page with the test account token
export function openAppForTests(remote: Remote): () => Command<any, void> {
    const testAccountSuffix = process.env.TEST_ACCOUNT_SUFFIX || '';
    if (!testAccountSuffix) {
        throw new Error('The environment variable TEST_ACCOUNT_SUFFIX is not set, so no functional tests can be run with a successful login!');
    }
    return function () {
        return remote
            // Load the application page with the token for sign-in with the test account
            .get('http://localhost:8082/#automaticTests-' + testAccountSuffix)
            .then(pollUntil(<Poller>findElement, ['portal-shell', '^', '#dialogFeedback'], 5000, 250))
            ;
    }
}

// Helper related to the test environment
// Close the warning message, click on the sign-in button, and wait to make sure the login is completed
export function proceedWithLogin(remote: Remote): () => Command<void, any> {
    return function (): Command<void, any> {
        return remote
            .execute(findElement, ['portal-shell', '^', '#dialogFeedback paper-button']).
            then((element: RemoteElement): void => { element.click(); })
            .end()
            // Click on the login button
            .execute(findElement, ['portal-shell', '^', 'portal-auth'])
            .then((element: RemoteElement): void => { element.click(); })
            .end()
            .then(pollUntil(<Poller>findElement, ['portal-shell', '^', '#avatar img'], 5000, 250))
            .end()
            ;
    }
}

// Helper related to the test environment
// Prints in the console the size of the browser window size
export function printWindowSize(remote: Remote): () => Command<void, any> {
    return function (): Command<void, any> {
        return remote
            .execute(findElement, ['body'])
            .then((element: RemoteElement): Task<{ width: number, height: number }> => element.getSize())
            .then(({ width, height }: { width: number, height: number }): void => {
                console.log(`Window size: ${width}px / ${height}px`);
            })
            .end()
            ;
    }
}

// Helper related to the test environment
// Prints in the console the size of the browser window size
export function logoutForTests(remote: Remote): () => Command<void, any> {
    return function (): Command<void, any> {
        return remote
            .execute(findElement, ['portal-shell', '^', '#signOut'])
            .then((element: RemoteElement): void => { element.click(); })
            .end()
            .sleep(1000) // To accomodate the page reload
            // Check the pressence of the message informing about the login requirement
            .then(pollUntil(<Poller>findElement, ['portal-shell', '^', '#dialogFeedback'], 5000, 250))
            .execute(findElement, ['portal-shell', '^', '#dialogFeedback paper-button'])
            .then((element: RemoteElement): Task<boolean> => element.isDisplayed())
            .then((isDisplayed: boolean): void => { if (!isDisplayed) { throw new Error('The warning message after the page refresh following the logout must be visible!'); } })
            .end()
            ;
    }
}

const testAccountSuffix: string = process.env.TEST_ACCOUNT_SUFFIX;
export const serverBaseUrl = 'http://localhost:8082/';

export async function loginViaAPI(): Promise<{ userId?: string, sessionToken?: string }> {
    return fetch(
        serverBaseUrl + 'api/v1/Auth',
        {
            body: `{"idToken":"#automaticTests-${testAccountSuffix}"}`,
            headers: {
                'content-type': 'application/json'
            },
            method: 'POST'
        }
    ).then((response: Response): { userId?: string, sessionToken?: string } => {
        if (response.status !== 200 && response.status !== 201) {
            throw new Error('Cannot get an authentication token!');
        }
        const cookies: Array<string> = response.headers.get('Set-Cookie').split(',');
        const out: { userId?: string, sessionToken?: string } = {};
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith('UserId=')) {
                out.userId = cookie.substring('UserId='.length, cookie.indexOf(';'));
            }
            else if (cookie.startsWith('Token=')) {
                out.sessionToken = cookie.substring('Token='.length, cookie.indexOf(';'));
            }
        }
        return out;
    });
}

export async function logoutViaAPI(userId: string, sessionToken: string): Promise<void> {
    return fetch(
        serverBaseUrl + 'api/v1/Auth',
        {
            headers: {
                'cookie': `UserId=${userId}; Token=${sessionToken}`
            },
            method: 'DELETE'
        }
    ).then((response: Response): void => {
        if (response.status !== 200) {
            throw new Error('Cannot logout w/ authentication token!');
        }
    });
}