import intern from 'intern';
import { Remote } from 'intern/lib/executors/Node';
import Element from '@theintern/leadfoot/Element';
import Command from '@theintern/leadfoot/Command';
import pollUntil, { Poller } from '@theintern/leadfoot/helpers/pollUntil';
import Task from '@dojo/core/async/Task';

import { AuthResource } from '../../server/resource/AuthResource';
import { Category } from '../../server/model/Category';
import { openAppForTests, proceedWithLogin, logoutForTests, findElement, findAllElements } from '../utils';

const { suite, test, before, after, beforeEach } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

suite(__filename.substring(__filename.indexOf('/functional/') + '/functional/'.length), (): void => {

    before(({ remote }: { remote: Remote }): Command<void, any> => {
        return remote
            .setFindTimeout(10000)
            .then(openAppForTests(remote))
            ;
    });

    after(({ remote }: { remote: Remote }): Command<void, any> => {
        return remote
            .then(logoutForTests(remote))
            ;
    });

    beforeEach((({ remote }: { remote: Remote }): Command<void, any> => {
        return remote
            .refresh()
            .sleep(1000)
            .then(proceedWithLogin(remote))
            ;
    }));

    test('Successful creation, update, and deletion of a Category item', ({ remote }: { remote: Remote }): Command<void, any> => {
        const title: string = 'This is a title ' + Math.round(Math.random() * 10000);
        return remote
            // Check there's no <portal-category-item/>
            .execute(findAllElements, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item'])
            .then((element: Array<Element>): void => { assert.isNotNull(element); assert.isTrue(Array.isArray(element)); assert.strictEqual(element.length, 0); }).end()
            // Open the category creation dialog
            .execute(findElement, ['portal-shell', '^', '#addCategory']).then((element: Element): void => { element.click(); }).end()
            // Fill up the form
            .then(pollUntil(<Poller>findElement, ['#addCategoryDlg'], 5000, 250))
            .execute(findElement, ['#addCategoryDlg paper-input[name=title]', '^', 'iron-input input']).then((element: Element): void => { element.type(title) }).end()
            .execute(findElement, ['#addCategoryDlg paper-input[name=positionIdx]', '^', 'iron-input input']).then((element: Element): void => { element.type('10') }).end()
            // FIXME: .execute(findElement, ['#addCategoryDlg paper-input[name=positionIdx]', '^', 'iron-input input']).then((element: LFElement):void => { element.value = '-title'; }).end()
            // Submit the form
            .execute(findElement, ['#addCategoryFormSubmit']).then((element: Element): void => { element.click(); }).end()
            // Check there's one <portal-category-item/>
            .then(pollUntil(<Poller>findElement, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item'], 5000, 250))
            .execute(findElement, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item'])
            .then((element: Element): Task<string> => {
                assert.isNotNull(element);
                return element.getAttribute('resource');
            })
            .then((attribute: string): void => {
                const resource: Category = JSON.parse(attribute);
                assert.strictEqual(resource.ownerId, AuthResource.TEST_ACCOUNT_ID);
                assert.strictEqual(resource.title, title);
                assert.strictEqual(resource.positionIdx, 10);
                // FIXME: assert.strictEqual(resource.sortBy, '-title');
                assert.strictEqual(resource.created, resource.updated);
            })
            .end()
            // Refresh the page and verify the Category is there again with the right title
            .refresh()
            .sleep(1000)
            .then(proceedWithLogin(remote))
            // Check the displayed title
            .then(pollUntil(<Poller>findElement, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item'], 5000, 250))
            .execute(findElement, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item', '^', 'app-toolbar div'])
            .then((element: Element): Task<string> => {
                assert.isNotNull(element);
                return element.getVisibleText();
            })
            .then((text: string): void => { assert.strictEqual(text, title); })
            .end()
            // Check there's no <portal-category-item/>
            .execute(findAllElements, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item'])
            .then((element: Array<Element>): void => { assert.isNotNull(element); assert.isTrue(Array.isArray(element)); assert.strictEqual(element.length, 1); }).end()
            // Update the category title
            .execute(findElement, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item', '^', 'app-header']).then((element: Element): void => { remote.moveMouseTo(element); }).end()
            .execute(findElement, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item', '^', '#editResource']).then((element: Element): void => { element.click(); }).end()
            .then(pollUntil(<Poller>findElement, ['#editCategoryDlg'], 5000, 250))
            .execute(findElement, ['#editCategoryDlg paper-input[name=title]', '^', 'iron-input input']).then((element: Element): void => { element.type(' - ' + title) }).end()
            .execute(findElement, ['#editCategoryFormSubmit']).then((element: Element): void => { element.click(); }).end()
            .sleep(2000)
            // Refresh the page and verify the Category is there again with the right title
            .refresh()
            .sleep(1000)
            .then(proceedWithLogin(remote))
            // Check the displayed title
            .then(pollUntil(<Poller>findElement, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item'], 5000, 250))
            .execute(findElement, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item', '^', 'app-toolbar div'])
            .then((element: Element): Task<string> => {
                assert.isNotNull(element);
                return element.getVisibleText();
            })
            .then((text: string): void => { assert.strictEqual(text, title + ' - ' + title); })
            .end()
            // Delete the category
            .execute(findElement, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item', '^', 'app-header']).then((element: Element): void => { remote.moveMouseTo(element); }).end()
            .execute(findElement, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item', '^', '#deleteResource']).then((element: Element): void => { element.click(); }).end()
            ;
    });

    test('Creation attempt with bad title', ({ remote }: { remote: Remote }): Command<void, any> => {
        const title: string = 'this is a bad title ¡¡¡¡¡¡ no starting capital letter, unexpected character...' + Math.round(Math.random() * 10000);
        return remote
            // Check there's no <portal-category-item/>
            .execute(findAllElements, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item'])
            .then((element: Array<Element>): void => { assert.isNotNull(element); assert.isTrue(Array.isArray(element)); assert.strictEqual(element.length, 0); }).end()
            // Open the category creation dialog
            .execute(findElement, ['portal-shell', '^', '#addCategory']).then((element: Element): void => { element.click(); }).end()
            // Fill up the form
            .then(pollUntil(<Poller>findElement, ['#addCategoryDlg'], 5000, 250))
            .execute(findElement, ['#addCategoryDlg paper-input[name=title]', '^', 'iron-input input']).then((element: Element): void => { element.type(title) }).end()
            .execute(findElement, ['#addCategoryDlg paper-input[name=positionIdx]', '^', 'iron-input input']).then((element: Element): void => { element.type('10') }).end()
            // FIXME: .execute(findElement, ['#addCategoryDlg paper-input[name=positionIdx]', '^', 'iron-input input']).then((element: LFElement):void => { element.value = '-title'; }).end()
            // Submit the form
            .execute(findElement, ['#addCategoryFormSubmit']).then((element: Element): void => { element.click(); }).end()
            .sleep(2000)
            // Check the form is still visible
            .execute(findElement, ['#addCategoryFormSubmit']).then((element: Element): Task<boolean> => element.isDisplayed()).then((isDisplayed: boolean): void => { assert.isTrue(isDisplayed); }).end()
            // Refresh the page and verify the Category has not been created
            .refresh()
            .sleep(1000)
            .then(proceedWithLogin(remote))
            // Check there's no <portal-category-item/>
            .execute(findAllElements, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item'])
            .then((element: Array<Element>): void => { assert.isNotNull(element); assert.isTrue(Array.isArray(element)); assert.strictEqual(element.length, 0); }).end()
            ;
    });
});