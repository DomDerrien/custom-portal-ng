import intern from 'intern';
import { Remote } from 'intern/lib/executors/Node';
import LFElement from '@theintern/leadfoot/Element';
import LFCommand from '@theintern/leadfoot/Command';
import Task from '@dojo/core/async/Task';

import { AuthResource } from '../server/resource/AuthResource';
import { Category } from '../server/model/Category';

const { suite, test, before, after } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

// Function executed on the client
// Get an Element instance while traversing the`shadowRoot` of the custom elements
function findElement(...path: Array<string>): ParentNode {
    return path.reduce((prev: ParentNode, part: string): ParentNode => part === '^' ? (<Element>prev).shadowRoot : prev.querySelector(part), document);
}

// Function executed on the client
// Get any Element instance while traversing the`shadowRoot` of the custom elements
function findAllElements(...path: Array<string>): NodeList {
    const limit: number = path.length - 1;
    return <NodeList>path.reduce((prev: ParentNode, part: string, idx: number): ParentNode | NodeList => {
        return part === '^' ? (<Element>prev).shadowRoot : idx === limit ? prev.querySelectorAll(part) : prev.querySelector(part);
    }, document);
}

// Helper related to the test environment
// Close the warning message, click on the sign-in button, and wait to make sure the login is completed
function proceedWithLogin(remote: Remote) {
    return function () {
        return remote
            .execute(findElement, ['portal-shell', '^', '#dialogFeedback paper-button']).then((element: LFElement): void => { element.click(); }).end()
            // Click on the login button
            .execute(findElement, ['portal-shell', '^', 'portal-auth']).then((element: LFElement): void => { assert.isNotNull(element); element.click(); }).end()
            .sleep(3000)
            ;
    }
}

suite(__filename.substring(__filename.indexOf('/functional/') + '/functional/'.length), (): void => {

    before(({ remote }: { remote: Remote }): LFCommand<void, any> => {
        const testAccountSuffix = process.env.TEST_ACCOUNT_SUFFIX || '';
        if (!testAccountSuffix) {
            assert.fail('The environment variable TEST_ACCOUNT_SUFFIX is not set, so no functional tests can be run with a successful login!');
        }
        return remote
            // Load the application page with the token for sign-in with the test account
            .get('http://localhost:8082/#automaticTests-' + testAccountSuffix)
            .setFindTimeout(10000)
            .sleep(2000)
            .execute(findElement, ['body'])
            .then((element: LFElement): Task<{ width: number, height: number }> => {
                return element.getSize();
            })
            .then(({ width, height }: { width: number, height: number }): void => {
                console.log(`Window size: ${width}px / ${height}px`);
            })
            .then(proceedWithLogin(remote))
            ;
    });

    after(({ remote }: { remote: Remote }): LFCommand<void, any> => {
        return remote
            .sleep(2000)
            .execute(findElement, ['portal-shell', '^', '#signOut'])
            .then((element: LFElement): void => { element.click(); })
            .sleep(2000)
            // Check the pressence of the message informing about the login requirement
            .execute(findElement, ['portal-shell', '^', '#dialogFeedback paper-button'])
            .then((element: LFElement): Task<boolean> => { return element.isDisplayed(); })
            .then((isDisplayed: boolean): void => { assert.isTrue(isDisplayed); })
            .end()
    });

    test('Successful creation, update, and deletion of a Category item', ({ remote }: { remote: Remote }): LFCommand<void, any> => {
        console.log(`Test: Successful creation, update, and deletion of a Category item`);
        const title: string = 'This is a title ' + Math.round(Math.random() * 10000);
        return remote
            // Check there's no <portal-category-item/>
            .execute(findAllElements, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item'])
            .then((element: Array<LFElement>): void => { assert.isNotNull(element); assert.isTrue(Array.isArray(element)); assert.strictEqual(element.length, 0); }).end()
            // Open the category creation dialog
            .execute(findElement, ['portal-shell', '^', '#addCategory']).then((element: LFElement): void => { element.click(); }).end()
            .sleep(1000)
            // Fill up the form
            .execute(findElement, ['#addCategoryDlg paper-input[name=title]', '^', 'iron-input input']).then((element: LFElement): void => { element.type(title) }).end()
            .execute(findElement, ['#addCategoryDlg paper-input[name=positionIdx]', '^', 'iron-input input']).then((element: LFElement): void => { element.type('10') }).end()
            // FIXME: .execute(findElement, ['#addCategoryDlg paper-input[name=positionIdx]', '^', 'iron-input input']).then((element: LFElement):void => { element.value = '-title'; }).end()
            // Submit the form
            .execute(findElement, ['#addCategoryFormSubmit']).then((element: LFElement): void => { element.click(); }).end()
            .sleep(2000)
            // Check there's one <portal-category-item/>
            .execute(findElement, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item'])
            .then((element: LFElement): Task<string> => {
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
            .execute(findElement, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item', '^', 'app-toolbar div'])
            .then((element: LFElement): Task<string> => {
                assert.isNotNull(element);
                return element.getVisibleText();
            })
            .then((text: string): void => { assert.strictEqual(text, title); })
            .end()
            // Check there's no <portal-category-item/>
            .execute(findAllElements, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item'])
            .then((element: Array<LFElement>): void => { assert.isNotNull(element); assert.isTrue(Array.isArray(element)); assert.strictEqual(element.length, 1); }).end()
            // Update the category title
            .execute(findElement, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item', '^', 'app-header']).then((element: LFElement): void => { remote.moveMouseTo(element); }).end()
            .execute(findElement, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item', '^', '#editResource']).then((element: LFElement): void => { element.click(); }).end()
            .sleep(1000)
            .execute(findElement, ['#editCategoryDlg paper-input[name=title]', '^', 'iron-input input']).then((element: LFElement): void => { element.type(' - ' + title) }).end()
            .execute(findElement, ['#editCategoryFormSubmit']).then((element: LFElement): void => { element.click(); }).end()
            .sleep(2000)
            // Refresh the page and verify the Category is there again with the right title
            .refresh()
            .sleep(1000)
            .then(proceedWithLogin(remote))
            // Check the displayed title
            .execute(findElement, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item', '^', 'app-toolbar div'])
            .then((element: LFElement): Task<string> => {
                assert.isNotNull(element);
                return element.getVisibleText();
            })
            .then((text: string): void => { assert.strictEqual(text, title + ' - ' + title); })
            .end()
            // Delete the category
            .execute(findElement, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item', '^', 'app-header']).then((element: LFElement): void => { remote.moveMouseTo(element); }).end()
            .execute(findElement, ['portal-shell', '^', 'portal-category-list', '^', 'portal-category-item', '^', '#deleteResource']).then((element: LFElement): void => { element.click(); }).end()
            ;
    });
});