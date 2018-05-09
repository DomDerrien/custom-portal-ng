import intern from 'intern';
import { Remote } from 'intern/lib/executors/Node';
import { default as fetch, Response } from 'node-fetch';
import { loginViaAPI, logoutViaAPI, serverBaseUrl } from '../utils';

import { Category } from '../../server/model/Category';

const { suite, test, before, after } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');

suite(__filename.substring(__filename.indexOf('/functional/') + '/functional/'.length), (): void => {
    const url = serverBaseUrl + 'api/v1/Category';
    let loggedUserId: string;
    let sessionToken: string;

    before(async ({ remote }: { remote: Remote }): Promise<void> => {
        return loginViaAPI().then((credentials: { userId: string, sessionToken: string }): Remote => {
            loggedUserId = credentials.userId;
            sessionToken = credentials.sessionToken;
            return remote;
        });
    });

    after(async ({ remote }: { remote: Remote }): Promise<void> => {
        return logoutViaAPI(loggedUserId, sessionToken).then((): Remote => {
            loggedUserId = null;
            sessionToken = null;
            return remote;
        });
    });

    test('list attempt w/o authentication', async ({ remote }: { remote: Remote }): Promise<void> => {
        return fetch(
            url,
            {
                method: 'GET'
            }
        ).then((response: Response): Remote => {
            assert.strictEqual(response.status, 401);
            return remote;
        });
    });

    test('list no resource', async ({ remote }: { remote: Remote }): Promise<void> => {
        return fetch(
            url,
            {
                headers: {
                    'cookie': `UserId=${loggedUserId}; Token=${sessionToken}`
                },
                method: 'GET'
            }
        ).then((response: Response): Remote => {
            assert.strictEqual(response.status, 204);
            return remote;
        });
    });

    test('create one resource and get it back', async ({ remote }: { remote: Remote }): Promise<void> => {
        const source: Category = Object.assign(new Category(), {
            title: 'First Category',
            positionIdx: 11,
            sortBy: '+creation'
        });
        const testStart: number = Date.now();
        return fetch(
            url,
            {
                body: JSON.stringify(source),
                headers: {
                    'content-type': 'application/json',
                    'cookie': `UserId=${loggedUserId}; Token=${sessionToken}`
                },
                method: 'POST'
            }
        ).then((response: Response): string => {
            assert.strictEqual(response.status, 201);
            const prefix: string = '/api/v1/Category/';
            const locationHeader: string = response.headers.get('Location');
            assert.isTrue(locationHeader.startsWith(prefix));
            assert.isTrue(/\d+/.test(locationHeader.substring(prefix.length)));
            return locationHeader.substring(prefix.length);
        }).then((id: string): Promise<Response> => fetch(
            url + '/' + id,
            {
                headers: {
                    'cookie': `UserId=${loggedUserId}; Token=${sessionToken}`
                },
                method: 'GET'
            }
        )).then((response: Response): Promise<any> => response.json()
        ).then((entity: Category): void => {
            assert.strictEqual(entity.title, source.title);
            assert.strictEqual(entity.positionIdx, source.positionIdx);
            assert.strictEqual(entity.sortBy, source.sortBy);
            assert.isNotNull(entity.created);
            const created: number = new Date(entity.created).getTime();
            assert.isTrue(testStart < created);
            assert.isTrue(created < Date.now());
            assert.strictEqual(entity.created, entity.updated);
        }).then((): Remote => remote);
    });

    test('create a second resource', async ({ remote }: { remote: Remote }): Promise<void> => {
        const source: Category = Object.assign(new Category(), {
            title: 'Second Category',
            positionIdx: -11,
            sortBy: '-title'
        });
        let sourceId: string;
        return fetch(
            url,
            {
                body: JSON.stringify(source),
                headers: {
                    'content-type': 'application/json',
                    'cookie': `UserId=${loggedUserId}; Token=${sessionToken}`
                },
                method: 'POST'
            }
        ).then((response: Response): void => {
            assert.strictEqual(response.status, 201);
            const prefix: string = '/api/v1/Category/';
            const locationHeader: string = response.headers.get('Location');
            sourceId = locationHeader.substring(prefix.length);
        }).then((): Promise<Response> => fetch(
            url,
            {
                headers: {
                    'x-sort-by': '+positionIdx',
                    'cookie': `UserId=${loggedUserId}; Token=${sessionToken}`
                },
                method: 'GET'
            }
        )).then((response: Response): Promise<any> => response.json()
        ).then((categories: Array<Category>): void => {
            assert.strictEqual(categories.length, 2);
            assert.strictEqual(categories[0].id, parseInt(sourceId));
            assert.strictEqual(categories[1].title, 'First Category');
            assert.strictEqual(categories[1].positionIdx, 11);
        }).then((): Remote => remote);
    });

    test('update the second resource', async ({ remote }: { remote: Remote }): Promise<void> => {
        let sourceId: number;
        const testStart: number = Date.now();
        return fetch(
            url,
            {
                headers: {
                    'range': 'items=0-0',
                    'x-sort-by': '+positionIdx',
                    'cookie': `UserId=${loggedUserId}; Token=${sessionToken}`
                },
                method: 'GET'
            }
        ).then((response: Response): Promise<any> => {
            assert.strictEqual(response.headers.get('Content-Range'), 'items 0-0/*');
            return response.json();
        }).then((categories: Array<Category>): Category => {
            assert.strictEqual(categories.length, 1);
            const category: Category = categories[0];
            assert.strictEqual(category.title, 'Second Category');
            assert.strictEqual(category.positionIdx, -11);
            sourceId = category.id;
            category.title = 'Updated Category';
            category.positionIdx = 22;
            return category;
        }).then((category: Category): Promise<Response> => fetch(
            url + '/' + category.id,
            {
                body: JSON.stringify(category),
                headers: {
                    'content-type': 'application/json',
                    'cookie': `UserId=${loggedUserId}; Token=${sessionToken}`
                },
                method: 'PUT'
            }
        )).then((response: Response): Promise<any> => response.json()
        ).then((category: Category): void => {
            assert.strictEqual(category.id, sourceId);
            assert.strictEqual(category.positionIdx, 22);
            assert.isTrue(category.created < category.updated);
            const updated: number = new Date(category.updated).getTime();
            assert.isTrue(testStart < updated);
            assert.isTrue(updated < Date.now());
        }).then((): Remote => remote);
    });

    test('delete two resources', async ({ remote }: { remote: Remote }): Promise<void> => {
        return fetch(
            url,
            {
                headers: {
                    'x-ids-only': 'true',
                    'cookie': `UserId=${loggedUserId}; Token=${sessionToken}`
                },
                method: 'GET'
            }
        ).then((response: Response): Promise<any> => response.json()
        ).then((categoryIds: Array<number>): Promise<Array<number>> => {
            assert.strictEqual(categoryIds.length, 2);
            assert.strictEqual(typeof categoryIds[0], 'number');
            return fetch(
                url + '/' + categoryIds[0],
                {
                    headers: {
                        'cookie': `UserId=${loggedUserId}; Token=${sessionToken}`
                    },
                    method: 'DELETE'
                }
            ).then((response: Response): Array<number> => {
                return categoryIds.slice(1);
            });
        }).then((categoryIds: Array<number>): Promise<Response> => {
            assert.strictEqual(categoryIds.length, 1);
            assert.strictEqual(typeof categoryIds[0], 'number');
            return fetch(
                url + '/' + categoryIds[0],
                {
                    headers: {
                        'cookie': `UserId=${loggedUserId}; Token=${sessionToken}`
                    },
                    method: 'DELETE'
                }
            );
        }).then((): Promise<Response> => fetch(
            url,
            {
                headers: {
                    // 'x-ids-only': 'true',
                    'cookie': `UserId=${loggedUserId}; Token=${sessionToken}`
                },
                method: 'GET'
            }
        )).then((response: Response): void => {
            assert.strictEqual(response.status, 204);
        }).then((): Remote => remote);
    });
});