import intern from 'intern';

const { suite, test, before } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

function findElement(...pathParts: Array<string>) {
    let element: any = document;
    for (let idx: number = 0, limit: number = pathParts.length; idx < limit; idx += 1) {
        let part: string = pathParts[idx];
        if (part === '^') {
            element = element.shadowRoot;
        }
        else {
            element = element.querySelector(part);
        }
    }
    return element;
}

suite(__filename.substring(__filename.indexOf('/functional/') + '/functional/'.length), (): void => {

    before(({ remote }) => {
        return remote
            .get('http://localhost:8082/')
            .setFindTimeout(10000)
            .sleep(2000);
    });

    suite('suite()', (): void => {
        test('test()', async ({ remote }): Promise<void> => {
            return remote
                .execute(findElement, ['portal-shell', '^', '#dialogFeedback paper-button'])
                .then(function (element) { element.click(); return element; })
                .end()
                .execute(findElement, ['portal-shell', '!', 'app-header-layout portal-auth'])
                .then(function (element) { assert.isNotNull(element); element.click(); return element; })
                .sleep(3000)
                .getCurrentUrl()
                .then(function (url) { console.log('1111', url); })
                .type('dominique.derrien@gmail.com')
                .end()
                .sleep(5000)
                ;
        });
    });
});