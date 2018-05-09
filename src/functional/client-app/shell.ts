import intern from 'intern';
import { Remote } from 'intern/lib/executors/Node';
import Element from '@theintern/leadfoot/Element';
import Command from '@theintern/leadfoot/Command';
import pollUntil, { Poller } from '@theintern/leadfoot/helpers/pollUntil';
import Task from '@dojo/core/async/Task';

import { findElement } from '../utils';

const { suite, test } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

suite(__filename.substring(__filename.indexOf('/functional/') + '/functional/'.length), (): void => {

    test('Check the message in the background', ({ remote }: { remote: Remote }): Command<void, any> => {
        return remote
            .get('http://localhost:8082/')
            .execute(findElement, ['portal-shell', '^', '#splashScreen div div'])
            .then((element: Element): Task<string> => element.getVisibleText())
            .then((text: string): void => { assert.strictEqual(text, 'The Portal waits for your successful login.'); })
            .end()
            .execute(findElement, ['portal-shell', '^', 'portal-auth'])
            .then((element: Element): void => { assert.isNotNull(element); })
            .end()
            ;
    });

    test('Check the warning message when there is not automatic login', ({ remote }: { remote: Remote }): Command<void, any> => {
        return remote
            .get('http://localhost:8082/')
            .then(pollUntil(<Poller>findElement, ['portal-shell', '^', '#dialogFeedback'], 5000, 250))
            .execute(findElement, ['portal-shell', '^', '#dialogFeedback h2'])
            .then((element: Element): Task<string> => element.getVisibleText())
            .then((text: string): void => { assert.strictEqual(text, 'Information'); })
            .end()
            .execute(findElement, ['portal-shell', '^', '#dialogFeedback p.message'])
            .then((element: Element): Task<string> => element.getVisibleText())
            .then((text: string): void => { assert.strictEqual(text, 'No signed in Google account detected...\nUse the "Sign-in" button to login into your Google account.'); })
            .end()
            .execute(findElement, ['portal-shell', '^', '#dialogFeedback paper-button'])
            .then((element: Element): Task<string> => element.getVisibleText())
            .then((text: string): void => { assert.strictEqual(text, 'OK'); })
            .end()
            ;
    });
});