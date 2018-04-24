import intern from 'intern';
import * as Datastore from '@google-cloud/datastore';
import { GoogleDatastoreDao } from '../../server/dao/GoogleDatastoreDao';
import { DatastoreKey, OneOrMany } from '@google-cloud/datastore/entity';
import { CommitResult } from '@google-cloud/datastore/request';
import { Query } from '@google-cloud/datastore/query';
import { DatastoreTransaction, BeginTransactionResponse, RollbackResult } from '@google-cloud/datastore/transaction';

import { BaseModel } from '../../server/model/BaseModel';
import { ServerErrorException } from '../../server/exceptions/ServerErrorException';
import { ClientErrorException } from '../../server/exceptions/ClientErrorException';

const { suite, test, beforeEach, afterEach } = intern.getInterface('tdd');
const { assert } = intern.getPlugin('chai');
import { stub, SinonStub } from 'sinon';

class TestModel extends BaseModel {
    public static getInstance(): BaseModel {
        return new TestModel();
    }

    public anyAttr: string;
};
// @ts-ignore: abstract methods don't need to be implemented for the tests
class TestDao extends GoogleDatastoreDao<TestModel> {
    public static getInstance(): TestDao {
        return new TestDao();
    }

    public constructor() {
        super(new TestModel());
    }

    // @ts-ignore: access to private method
    public get datastore() { return this.store; }
};

suite(__filename.substring(__filename.indexOf('/unit/') + '/unit/'.length), (): void => {
    let dao: TestDao;
    let query: Query;
    let transaction: DatastoreTransaction;

    beforeEach((): void => {
        dao = new TestDao();
        query = <Query>{
            end: (token: string): never => { throw new Error('Unexpected call to Query.end()'); },
            filter: (property: string, value: any): never => { throw new Error('Unexpected call to Query.filter()'); },
            groupBy: (property: string): never => { throw new Error('Unexpected call to Query.groupBy()'); },
            hasAncestor: (key: DatastoreKey): never => { throw new Error('Unexpected call to Query.hasAncestor()'); },
            limit: (n: number): never => { throw new Error('Unexpected call to Query.limit()'); },
            offset: (n: number): never => { throw new Error('Unexpected call to Query.offset()'); },
            order: (property: string): never => { throw new Error('Unexpected call to Query.order()'); },
            select: (property: string): never => { throw new Error('Unexpected call to Query.select()'); },
            run: (): never => { throw new Error('Unexpected call to Query.run()'); },
            runStream: (): never => { throw new Error('Unexpected call to Query.runStream()'); },
            start: (token: string): never => { throw new Error('Unexpected call to Query.start()'); }
        };
        transaction = <DatastoreTransaction>{
            commit(): Promise<CommitResult> { return null; },
            get(key: DatastoreKey): Promise<[TestModel]> { return null; },
            run(): Promise<[DatastoreTransaction, BeginTransactionResponse]> { return null; },
            rollback(): Promise<RollbackResult> { return null; },
            save(entities: OneOrMany<object>): Promise<CommitResult> | void { }
        };

    });

    afterEach((): void => {
        dao = null;
        query = null;
        transaction = null;
    });

    test('getInstance()', (): void => {
        const dao: TestDao = TestDao.getInstance();
        assert.isTrue(dao instanceof GoogleDatastoreDao);
        assert.isNotNull(dao.datastore);
    });

    suite('prepareModelInstance', (): void => {
        test('w/o attributes', (): void => {
            // @ts-ignore: access to private method
            assert.deepEqual(dao.prepareModelInstance(), {});
        });
        test('w/ no key', (): void => {
            const input: object = {
                anyAttr: 'anyVal'
            };
            const output: any = {
                id: undefined,
                anyAttr: 'anyVal'
            }
            // @ts-ignore: access to private method
            assert.deepEqual(dao.prepareModelInstance(input), output);
        });
        test('w/ all attributes', (): void => {
            const input: object = {
                [dao.datastore.KEY]: { kind: 'TestModel', id: 12345 },
                anyAttr: 'anyVal'
            };
            const output: any = {
                id: 12345,
                anyAttr: 'anyVal'
            }
            // @ts-ignore: access to private method
            assert.deepEqual(dao.prepareModelInstance(input), output);
        });
    });

    suite('get', (): void => {
        test('success', async (): Promise<void> => {
            const id: number = 12345;
            const storeKey: DatastoreKey = dao.datastore.key(['TestModel', id]);
            const getStub: SinonStub = stub(dao.datastore, 'get');
            getStub.withArgs(storeKey).returns(Promise.resolve([{ [dao.datastore.KEY]: storeKey, anyAttr: 'anyVal' }]));

            const model: TestModel = await dao.get(id);
            assert.deepEqual(model, {
                id: 12345,
                anyAttr: 'anyVal'
            });

            assert.isTrue(getStub.calledOnceWithExactly(storeKey));
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('failure', async (): Promise<void> => {
            const getStub: SinonStub = stub(dao.datastore, 'get');
            getStub.returns(Promise.reject('Done in purpose!'));

            try {
                await dao.get(111);
                throw new Error('Unexpected success!');
            }
            catch (error) {
                if (error !== 'Done in purpose!') {
                    throw error;
                }
            }

            assert.isTrue(getStub.calledOnce);
            // No need to restore stubs as the DAO instance is recreated before each test
        });
    });

    suite('prepareStandardQuery', (): void => {
        test('empty filter', async (): Promise<void> => {
            const createQueryStub: SinonStub = stub(dao.datastore, 'createQuery');
            createQueryStub.withArgs('TestModel').returns(query);

            // @ts-ignore: access to private method
            assert.strictEqual(dao.prepareStandardQuery({}, {}), query);

            assert.isTrue(createQueryStub.calledOnceWithExactly('TestModel'));
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('filter w/ array of values', async (): Promise<void> => {
            const createQueryStub: SinonStub = stub(dao.datastore, 'createQuery');
            createQueryStub.withArgs('TestModel').returns(query);

            try {
                // @ts-ignore: access to private method
                dao.prepareStandardQuery({ id: [] }, {});
                throw new Error('Unexpected success!');
            }
            catch (error) {
                if (!(error instanceof ServerErrorException)) {
                    throw error;
                }
            }

            assert.isTrue(createQueryStub.calledOnceWithExactly('TestModel'));
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('filter w/ an identifier', async (): Promise<void> => {
            const createQueryStub: SinonStub = stub(dao.datastore, 'createQuery');
            createQueryStub.withArgs('TestModel').returns(query);
            const filterStub: SinonStub = stub(query, 'filter');

            // @ts-ignore: access to private method
            assert.strictEqual(dao.prepareStandardQuery({ id: '12345' }, {}), query);

            assert.isTrue(createQueryStub.calledOnceWithExactly('TestModel'));
            assert.isTrue(filterStub.calledOnceWithExactly('__key__', dao.datastore.key(['TestModel', 12345])));
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('filter w/ string equalities', async (): Promise<void> => {
            const createQueryStub: SinonStub = stub(dao.datastore, 'createQuery');
            createQueryStub.withArgs('TestModel').returns(query);
            const filterStub: SinonStub = stub(query, 'filter');

            // @ts-ignore: access to private method
            assert.strictEqual(dao.prepareStandardQuery({ name1: 'value1', name2: '=value2', name3: '=' }, {}), query);

            assert.isTrue(createQueryStub.calledOnceWithExactly('TestModel'));
            assert.isTrue(filterStub.calledWithExactly('name1', '=', 'value1'));
            assert.isTrue(filterStub.calledWithExactly('name2', '=', 'value2'));
            assert.isTrue(filterStub.calledWithExactly('name3', '=', ''));
            assert.isTrue(filterStub.calledThrice);
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('filter w/ boolean equalities', async (): Promise<void> => {
            const createQueryStub: SinonStub = stub(dao.datastore, 'createQuery');
            createQueryStub.withArgs('TestModel').returns(query);
            const filterStub: SinonStub = stub(query, 'filter');

            // @ts-ignore: access to private method
            assert.strictEqual(dao.prepareStandardQuery({ name1: 'true', name2: 'false' }, {}), query);

            assert.isTrue(createQueryStub.calledOnceWithExactly('TestModel'));
            assert.isTrue(filterStub.calledWithExactly('name1', '=', true));
            assert.isTrue(filterStub.calledWithExactly('name2', '=', false));
            assert.isTrue(filterStub.calledTwice);
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('filter w/ number inequality I', async (): Promise<void> => {
            const createQueryStub: SinonStub = stub(dao.datastore, 'createQuery');
            createQueryStub.withArgs('TestModel').returns(query);
            const filterStub: SinonStub = stub(query, 'filter');
            const orderStub: SinonStub = stub(query, 'order');

            // @ts-ignore: access to private method
            assert.strictEqual(dao.prepareStandardQuery({ name: '>=1' }, {}), query);

            assert.isTrue(createQueryStub.calledOnceWithExactly('TestModel'));
            assert.isTrue(filterStub.calledWithExactly('name', '>=', 1));
            assert.isTrue(filterStub.calledOnce);
            assert.isTrue(orderStub.calledWithExactly('name', { descending: false }));
            assert.isTrue(orderStub.calledOnce);
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('filter w/ number inequality II', async (): Promise<void> => {
            const createQueryStub: SinonStub = stub(dao.datastore, 'createQuery');
            createQueryStub.withArgs('TestModel').returns(query);
            const filterStub: SinonStub = stub(query, 'filter');
            const orderStub: SinonStub = stub(query, 'order');

            // @ts-ignore: access to private method
            assert.strictEqual(dao.prepareStandardQuery({ name: '<=2' }, {}), query);

            assert.isTrue(createQueryStub.calledOnceWithExactly('TestModel'));
            assert.isTrue(filterStub.calledWithExactly('name', '<=', 2));
            assert.isTrue(filterStub.calledOnce);
            assert.isTrue(orderStub.calledWithExactly('name', { descending: false }));
            assert.isTrue(orderStub.calledOnce);
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('filter w/ two inequality III', async (): Promise<void> => {
            const createQueryStub: SinonStub = stub(dao.datastore, 'createQuery');
            createQueryStub.withArgs('TestModel').returns(query);
            const filterStub: SinonStub = stub(query, 'filter');
            const orderStub: SinonStub = stub(query, 'order');

            try {
                // @ts-ignore: access to private method
                dao.prepareStandardQuery({ name1: '>=1', name2: '<=2' }, {});
                throw new Error('Unexpected success!');
            }
            catch (error) {
                if (!(error instanceof ClientErrorException)) {
                    throw error;
                }
            }

            assert.isTrue(createQueryStub.calledOnceWithExactly('TestModel'));
            assert.isTrue(filterStub.calledWithExactly('name1', '>=', 1));
            assert.isTrue(filterStub.calledOnce);
            assert.isTrue(orderStub.calledWithExactly('name1', { descending: false }));
            assert.isTrue(orderStub.calledOnce);
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('options w/ good sortBy I', async (): Promise<void> => {
            const createQueryStub: SinonStub = stub(dao.datastore, 'createQuery');
            createQueryStub.withArgs('TestModel').returns(query);
            const orderStub: SinonStub = stub(query, 'order');

            // @ts-ignore: access to private method
            assert.strictEqual(dao.prepareStandardQuery({}, { sortBy: ['+name1', '-name2'] }), query);

            assert.isTrue(createQueryStub.calledOnceWithExactly('TestModel'));
            assert.isTrue(orderStub.calledWithExactly('name1', { descending: false }));
            assert.isTrue(orderStub.calledWithExactly('name2', { descending: true }));
            assert.isTrue(orderStub.calledTwice);
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('options w/ bad sortBy II', async (): Promise<void> => {
            const createQueryStub: SinonStub = stub(dao.datastore, 'createQuery');
            createQueryStub.withArgs('TestModel').returns(query);
            const orderStub: SinonStub = stub(query, 'order');

            try {
                // @ts-ignore: access to private method
                dao.prepareStandardQuery({}, { sortBy: ['+', 'name2'] });
                throw new Error('Unexpected success!');
            }
            catch (error) {
                if (!(error instanceof ClientErrorException)) {
                    throw error;
                }
            }

            assert.isTrue(createQueryStub.calledOnceWithExactly('TestModel'));
            assert.isTrue(orderStub.notCalled);
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('option w/ idOnly', async (): Promise<void> => {
            const createQueryStub: SinonStub = stub(dao.datastore, 'createQuery');
            createQueryStub.withArgs('TestModel').returns(query);
            const selectStub: SinonStub = stub(query, 'select');

            // @ts-ignore: access to private method
            assert.strictEqual(dao.prepareStandardQuery({}, { idOnly: true }), query);

            assert.isTrue(createQueryStub.calledOnceWithExactly('TestModel'));
            assert.isTrue(selectStub.calledOnceWithExactly('__key__'));
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('option w/ rangeStart only', async (): Promise<void> => {
            const createQueryStub: SinonStub = stub(dao.datastore, 'createQuery');
            createQueryStub.withArgs('TestModel').returns(query);
            const offsetStub: SinonStub = stub(query, 'offset');

            // @ts-ignore: access to private method
            assert.strictEqual(dao.prepareStandardQuery({}, { rangeStart: 123 }), query);

            assert.isTrue(createQueryStub.calledOnceWithExactly('TestModel'));
            assert.isTrue(offsetStub.calledOnceWithExactly(123));
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('option w/ rangeEnd only', async (): Promise<void> => {
            const createQueryStub: SinonStub = stub(dao.datastore, 'createQuery');
            createQueryStub.withArgs('TestModel').returns(query);
            const limitStub: SinonStub = stub(query, 'limit');

            // @ts-ignore: access to private method
            assert.strictEqual(dao.prepareStandardQuery({}, { rangeEnd: 234 }), query);

            assert.isTrue(createQueryStub.calledOnceWithExactly('TestModel'));
            assert.isTrue(limitStub.calledOnceWithExactly(234 + 1));
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('option w/ rangeStart & rangeEnd', async (): Promise<void> => {
            const createQueryStub: SinonStub = stub(dao.datastore, 'createQuery');
            createQueryStub.withArgs('TestModel').returns(query);
            const offsetStub: SinonStub = stub(query, 'offset');
            const limitStub: SinonStub = stub(query, 'limit');

            // @ts-ignore: access to private method
            assert.strictEqual(dao.prepareStandardQuery({}, { rangeStart: 123, rangeEnd: 234 }), query);

            assert.isTrue(createQueryStub.calledOnceWithExactly('TestModel'));
            assert.isTrue(offsetStub.calledOnceWithExactly(123));
            assert.isTrue(limitStub.calledOnceWithExactly(234 - 123 + 1));
            // No need to restore stubs as the DAO instance is recreated before each test
        });
    });

    suite('query', (): void => {
        test('empty array', async (): Promise<void> => {
            // @ts-ignore: access to private method
            const prepareStandardQueryStub: SinonStub = stub(dao, 'prepareStandardQuery');
            prepareStandardQueryStub.withArgs({}, {}).returns(query);
            const runQueryStub: SinonStub = stub(dao.datastore, 'runQuery');
            runQueryStub.withArgs(query).returns(Promise.resolve([[], { moreResults: Datastore.MORE_RESULTS_AFTER_CURSOR }]));
            // @ts-ignore: access to private method
            const prepareModelInstanceStub: SinonStub = stub(dao, 'prepareModelInstance');

            const results: Array<TestModel> = await dao.query({});
            assert.lengthOf(results, 0);
            assert.isUndefined(results.totalCount);

            assert.isTrue(prepareStandardQueryStub.calledOnceWithExactly({}, {}));
            assert.isTrue(prepareModelInstanceStub.notCalled);
            assert.isTrue(runQueryStub.calledOnceWithExactly(query));
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('array w/ one results', async (): Promise<void> => {
            // @ts-ignore: access to private method
            const prepareStandardQueryStub: SinonStub = stub(dao, 'prepareStandardQuery');
            prepareStandardQueryStub.withArgs({}, {}).returns(query);
            const resultPayload: Array<object> = [{ name: '1' }];
            const runQueryStub: SinonStub = stub(dao.datastore, 'runQuery');
            runQueryStub.withArgs(query).returns(Promise.resolve([resultPayload, { moreResults: Datastore.NO_MORE_RESULTS }]));
            // @ts-ignore: access to private method
            const prepareModelInstanceStub: SinonStub = stub(dao, 'prepareModelInstance');
            const selection: Array<TestModel> = [Object.assign(new TestModel(), resultPayload[0])];
            prepareModelInstanceStub.withArgs(resultPayload[0]).returns(selection[0]);

            const results: Array<TestModel> = await dao.query({}, {});
            assert.deepEqual(results, selection);
            assert.strictEqual(results.totalCount, 1);

            assert.isTrue(prepareStandardQueryStub.calledOnceWithExactly({}, {}));
            assert.isTrue(prepareModelInstanceStub.calledOnceWithExactly(resultPayload[0]));
            assert.isTrue(runQueryStub.calledOnceWithExactly(query));
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('array w/ two results & rangeStart = 10', async (): Promise<void> => {
            // @ts-ignore: access to private method
            const prepareStandardQueryStub: SinonStub = stub(dao, 'prepareStandardQuery');
            prepareStandardQueryStub.withArgs({}, { rangeStart: 10 }).returns(query);
            const resultPayload: Array<object> = [{ name: '1' }, { name: '2' }];
            const runQueryStub: SinonStub = stub(dao.datastore, 'runQuery');
            runQueryStub.withArgs(query).returns(Promise.resolve([resultPayload, { moreResults: Datastore.NO_MORE_RESULTS }]));
            // @ts-ignore: access to private method
            const prepareModelInstanceStub: SinonStub = stub(dao, 'prepareModelInstance');
            const selection: Array<TestModel> = [Object.assign(new TestModel(), resultPayload[0]), Object.assign(new TestModel(), resultPayload[1])];
            prepareModelInstanceStub.withArgs(resultPayload[0]).returns(selection[0]);
            prepareModelInstanceStub.withArgs(resultPayload[1]).returns(selection[1]);

            const results: Array<TestModel> = await dao.query({}, { rangeStart: 10 });
            assert.deepEqual(results, selection);
            assert.strictEqual(results.totalCount, 12);

            assert.isTrue(prepareStandardQueryStub.calledOnceWithExactly({}, { rangeStart: 10 }));
            assert.isTrue(prepareModelInstanceStub.calledTwice);
            assert.isTrue(runQueryStub.calledOnceWithExactly(query));
            // No need to restore stubs as the DAO instance is recreated before each test
        });
    });

    suite('create', (): void => {
        test('success w/ straight id', async (): Promise<void> => {
            const candidate = Object.assign(new TestModel(), { id: 12345, anyAttr: 'anyVal' });
            const key: DatastoreKey = <DatastoreKey>{ kind: 'TestModel' };
            const keyStub: SinonStub = stub(dao.datastore, 'key');
            keyStub.withArgs(['TestModel']).returns(key);
            const resultPayload: CommitResult = <CommitResult>[{
                mutationResults: [{
                    key: {
                        kind: 'TestModel',
                        id: '567'
                    },
                    conflictDetected: false,
                    version: new Date().getTime()
                }],
                indexUpdates: 1
            }];
            const saveStub: SinonStub = stub(dao.datastore, 'save');
            saveStub.withArgs({ key: key, data: candidate }).returns(Promise.resolve(resultPayload));

            assert.strictEqual(await dao.create(candidate), 567);

            assert.isTrue(keyStub.calledOnceWithExactly(['TestModel']));
            assert.isTrue(saveStub.calledOnceWithExactly({ key: key, data: candidate }));
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('success w/ indirect id', async (): Promise<void> => {
            const candidate = Object.assign(new TestModel(), { id: 12345, anyAttr: 'anyVal' });
            const key: DatastoreKey = <DatastoreKey>{ kind: 'TestModel' };
            const keyStub: SinonStub = stub(dao.datastore, 'key');
            keyStub.withArgs(['TestModel']).returns(key);
            const resultPayload: CommitResult = <CommitResult>[{
                mutationResults: [{
                    key: {
                        kind: 'TestModel',
                        // @ts-ignore: the type definition differs from <PathElement>
                        path: [{ idType: 'id', id: 567, kind: 'TestModel' }]
                    },
                    conflictDetected: false,
                    version: new Date().getTime()
                }],
                indexUpdates: 1
            }];
            const saveStub: SinonStub = stub(dao.datastore, 'save');
            saveStub.withArgs({ key: key, data: candidate }).returns(Promise.resolve(resultPayload));

            assert.strictEqual(await dao.create(candidate), 567);

            assert.isTrue(keyStub.calledOnceWithExactly(['TestModel']));
            assert.isTrue(saveStub.calledOnceWithExactly({ key: key, data: candidate }));
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('failure w/ conflict', async (): Promise<void> => {
            const candidate = Object.assign(new TestModel(), { id: 12345, anyAttr: 'anyVal' });
            const key: DatastoreKey = <DatastoreKey>{ kind: 'TestModel' };
            const keyStub: SinonStub = stub(dao.datastore, 'key');
            keyStub.withArgs(['TestModel']).returns(key);
            const resultPayload: CommitResult = <CommitResult>[{
                mutationResults: [{
                    key: {
                        kind: 'TestModel',
                        id: '567'
                    },
                    conflictDetected: true,
                    version: new Date().getTime()
                }],
                indexUpdates: 1
            }];
            const saveStub: SinonStub = stub(dao.datastore, 'save');
            saveStub.withArgs({ key: key, data: candidate }).returns(Promise.resolve(resultPayload));

            try {
                await dao.create(candidate);
                throw new Error('Unexpected success!');
            }
            catch (error) {
                if (!(error instanceof ServerErrorException)) {
                    throw error;
                }
            }

            assert.isTrue(keyStub.calledOnceWithExactly(['TestModel']));
            assert.isTrue(saveStub.calledOnceWithExactly({ key: key, data: candidate }));
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('failure w/ indirect id of wrong idType', async (): Promise<void> => {
            const candidate = Object.assign(new TestModel(), { id: 12345, anyAttr: 'anyVal' });
            const key: DatastoreKey = <DatastoreKey>{ kind: 'TestModel' };
            const keyStub: SinonStub = stub(dao.datastore, 'key');
            keyStub.withArgs(['TestModel']).returns(key);
            const resultPayload: CommitResult = <CommitResult>[{
                mutationResults: [{
                    key: {
                        kind: 'TestModel',
                        // @ts-ignore: the type definition differs from <PathElement>
                        path: [{ idType: 'name', name: '567', kind: 'TestModel' }]
                    },
                    conflictDetected: false,
                    version: new Date().getTime()
                }],
                indexUpdates: 1
            }];
            const saveStub: SinonStub = stub(dao.datastore, 'save');
            saveStub.withArgs({ key: key, data: candidate }).returns(Promise.resolve(resultPayload));

            try {
                await dao.create(candidate);
                throw new Error('Unexpected success!');
            }
            catch (error) {
                if (!(error instanceof ServerErrorException)) {
                    throw error;
                }
            }

            assert.isTrue(keyStub.calledOnceWithExactly(['TestModel']));
            assert.isTrue(saveStub.calledOnceWithExactly({ key: key, data: candidate }));
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('failure w/ indirect id of wrong kind', async (): Promise<void> => {
            const candidate = Object.assign(new TestModel(), { id: 12345, anyAttr: 'anyVal' });
            const key: DatastoreKey = <DatastoreKey>{ kind: 'TestModel' };
            const keyStub: SinonStub = stub(dao.datastore, 'key');
            keyStub.withArgs(['TestModel']).returns(key);
            const resultPayload: CommitResult = <CommitResult>[{
                mutationResults: [{
                    key: {
                        kind: 'ExtraModel',
                        // @ts-ignore: the type definition differs from <PathElement>
                        path: [{ idType: 'id', id: 567, kind: 'ExtraModel' }]
                    },
                    conflictDetected: false,
                    version: new Date().getTime()
                }],
                indexUpdates: 1
            }];
            const saveStub: SinonStub = stub(dao.datastore, 'save');
            saveStub.withArgs({ key: key, data: candidate }).returns(Promise.resolve(resultPayload));

            try {
                await dao.create(candidate);
                throw new Error('Unexpected success!');
            }
            catch (error) {
                if (!(error instanceof ServerErrorException)) {
                    throw error;
                }
            }

            assert.isTrue(keyStub.calledOnceWithExactly(['TestModel']));
            assert.isTrue(saveStub.calledOnceWithExactly({ key: key, data: candidate }));
            // No need to restore stubs as the DAO instance is recreated before each test
        });
    });

    suite('update', (): void => {
        test('failure b/c missing updated date', async (): Promise<void> => {
            const candidate = Object.assign(new TestModel(), { id: 12345, anyAttr: 'anyVal' });

            try {
                await dao.update(12345, candidate);
                throw new Error('Unexpected success!');
            }
            catch (error) {
                if (!(error instanceof ClientErrorException)) {
                    throw error;
                }
            }
        });
        test('success', async (): Promise<void> => {
            const entity = Object.assign(new TestModel(), { id: 12345, anyAttr: 'oldVal', updated: 999999 });
            const candidate = Object.assign(new TestModel(), { id: 12345, anyAttr: 'newVal', updated: 999999 });
            const key: DatastoreKey = <DatastoreKey>{ kind: 'TestModel', id: '12345' };
            const keyStub: SinonStub = stub(dao.datastore, 'key');
            keyStub.withArgs(['TestModel', 12345]).returns(key);
            const transactionStub: SinonStub = stub(dao.datastore, 'transaction');
            transactionStub.withArgs().returns(transaction);
            const runStub: SinonStub = stub(transaction, 'run');
            runStub.withArgs().returns(Promise.resolve([transaction, undefined]));
            const getStub: SinonStub = stub(transaction, 'get');
            getStub.withArgs(key).returns(Promise.resolve([entity]));
            // @ts-ignore: access to a private method
            const prepareModelInstanceStub: SinonStub = stub(dao, 'prepareModelInstance');
            prepareModelInstanceStub.withArgs(entity).returns(entity);
            const saveStub: SinonStub = stub(transaction, 'save');
            const resultPayload: CommitResult = <CommitResult>[{
                mutationResults: [{
                    conflictDetected: false
                }],
                indexUpdates: 1
            }];
            const commitStub: SinonStub = stub(transaction, 'commit');
            commitStub.withArgs().returns(Promise.resolve(resultPayload));
            const rollbackStub: SinonStub = stub(transaction, 'rollback');

            assert.strictEqual(await dao.update(12345, candidate), 12345);

            assert.isTrue(keyStub.calledOnceWithExactly(['TestModel', 12345]));
            assert.isTrue(transactionStub.calledOnceWithExactly());
            assert.isTrue(runStub.calledOnceWithExactly());
            assert.isTrue(getStub.calledOnceWithExactly(key));
            assert.isTrue(prepareModelInstanceStub.calledOnceWithExactly(entity));
            assert.isTrue(saveStub.calledOnceWithExactly({ key: key, data: entity }));
            assert.isTrue(commitStub.calledOnceWithExactly());
            assert.isTrue(rollbackStub.notCalled);
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('failure b/c entity in store is more recent than candidate', async (): Promise<void> => {
            const entity = Object.assign(new TestModel(), { id: 12345, anyAttr: 'oldVal', updated: 999999 });
            const candidate = Object.assign(new TestModel(), { id: 12345, anyAttr: 'newVal', updated: 888888 });
            const key: DatastoreKey = <DatastoreKey>{ kind: 'TestModel', id: '12345' };
            const keyStub: SinonStub = stub(dao.datastore, 'key');
            keyStub.withArgs(['TestModel', 12345]).returns(key);
            const transactionStub: SinonStub = stub(dao.datastore, 'transaction');
            transactionStub.withArgs().returns(transaction);
            const runStub: SinonStub = stub(transaction, 'run');
            runStub.withArgs().returns(Promise.resolve([transaction, undefined]));
            const getStub: SinonStub = stub(transaction, 'get');
            getStub.withArgs(key).returns(Promise.resolve([entity]));
            // @ts-ignore: access to a private method
            const prepareModelInstanceStub: SinonStub = stub(dao, 'prepareModelInstance');
            prepareModelInstanceStub.withArgs(entity).returns(entity);
            const saveStub: SinonStub = stub(transaction, 'save');
            const commitStub: SinonStub = stub(transaction, 'commit');
            const rollbackStub: SinonStub = stub(transaction, 'rollback');

            try {
                await dao.update(12345, candidate);
                throw new Error('Unexpected success!');
            }
            catch (error) {
                if (!(error instanceof ClientErrorException)) {
                    throw error;
                }
            }

            assert.isTrue(keyStub.calledOnceWithExactly(['TestModel', 12345]));
            assert.isTrue(transactionStub.calledOnceWithExactly());
            assert.isTrue(runStub.calledOnceWithExactly());
            assert.isTrue(getStub.calledOnceWithExactly(key));
            assert.isTrue(prepareModelInstanceStub.calledOnceWithExactly(entity));
            assert.isTrue(saveStub.notCalled);
            assert.isTrue(commitStub.notCalled);
            assert.isTrue(rollbackStub.calledOnceWithExactly());
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('failure b/c no update', async (): Promise<void> => {
            const entity = Object.assign(new TestModel(), { id: 12345, anyAttr: 'sameVal', updated: 999999 });
            const candidate = Object.assign(new TestModel(), { id: 12345, anyAttr: 'sameVal', updated: 999999 });
            const key: DatastoreKey = <DatastoreKey>{ kind: 'TestModel', id: '12345' };
            const keyStub: SinonStub = stub(dao.datastore, 'key');
            keyStub.withArgs(['TestModel', 12345]).returns(key);
            const transactionStub: SinonStub = stub(dao.datastore, 'transaction');
            transactionStub.withArgs().returns(transaction);
            const runStub: SinonStub = stub(transaction, 'run');
            runStub.withArgs().returns(Promise.resolve([transaction, undefined]));
            const getStub: SinonStub = stub(transaction, 'get');
            getStub.withArgs(key).returns(Promise.resolve([entity]));
            // @ts-ignore: access to a private method
            const prepareModelInstanceStub: SinonStub = stub(dao, 'prepareModelInstance');
            prepareModelInstanceStub.withArgs(entity).returns(entity);
            const saveStub: SinonStub = stub(transaction, 'save');
            const commitStub: SinonStub = stub(transaction, 'commit');
            const rollbackStub: SinonStub = stub(transaction, 'rollback');

            try {
                await dao.update(12345, candidate);
                throw new Error('Unexpected success!');
            }
            catch (error) {
                if (!(error instanceof ClientErrorException)) {
                    throw error;
                }
            }

            assert.isTrue(keyStub.calledOnceWithExactly(['TestModel', 12345]));
            assert.isTrue(transactionStub.calledOnceWithExactly());
            assert.isTrue(runStub.calledOnceWithExactly());
            assert.isTrue(getStub.calledOnceWithExactly(key));
            assert.isTrue(prepareModelInstanceStub.calledOnceWithExactly(entity));
            assert.isTrue(saveStub.notCalled);
            assert.isTrue(commitStub.notCalled);
            assert.isTrue(rollbackStub.calledOnceWithExactly());
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('failure b/c conflict detected', async (): Promise<void> => {
            const entity = Object.assign(new TestModel(), { id: 12345, anyAttr: 'oldVal', updated: 999999 });
            const candidate = Object.assign(new TestModel(), { id: 12345, anyAttr: 'newVal', updated: 999999 });
            const key: DatastoreKey = <DatastoreKey>{ kind: 'TestModel', id: '12345' };
            const keyStub: SinonStub = stub(dao.datastore, 'key');
            keyStub.withArgs(['TestModel', 12345]).returns(key);
            const transactionStub: SinonStub = stub(dao.datastore, 'transaction');
            transactionStub.withArgs().returns(transaction);
            const runStub: SinonStub = stub(transaction, 'run');
            runStub.withArgs().returns(Promise.resolve([transaction, undefined]));
            const getStub: SinonStub = stub(transaction, 'get');
            getStub.withArgs(key).returns(Promise.resolve([entity]));
            // @ts-ignore: access to a private method
            const prepareModelInstanceStub: SinonStub = stub(dao, 'prepareModelInstance');
            prepareModelInstanceStub.withArgs(entity).returns(entity);
            const saveStub: SinonStub = stub(transaction, 'save');
            const resultPayload: CommitResult = <CommitResult>[{
                mutationResults: [{
                    conflictDetected: true
                }],
                indexUpdates: 1
            }];
            const commitStub: SinonStub = stub(transaction, 'commit');
            commitStub.withArgs().returns(Promise.resolve(resultPayload));
            const rollbackStub: SinonStub = stub(transaction, 'rollback');

            try {
                await dao.update(12345, candidate);
                throw new Error('Unexpected success!');
            }
            catch (error) {
                if (!(error instanceof ServerErrorException)) {
                    throw error;
                }
            }

            assert.isTrue(keyStub.calledOnceWithExactly(['TestModel', 12345]));
            assert.isTrue(transactionStub.calledOnceWithExactly());
            assert.isTrue(runStub.calledOnceWithExactly());
            assert.isTrue(getStub.calledOnceWithExactly(key));
            assert.isTrue(prepareModelInstanceStub.calledOnceWithExactly(entity));
            assert.isTrue(saveStub.calledOnceWithExactly({ key: key, data: entity }));
            assert.isTrue(commitStub.calledOnceWithExactly());
            assert.isTrue(rollbackStub.calledOnceWithExactly());
            // No need to restore stubs as the DAO instance is recreated before each test
        });
    });

    suite('delete', (): void => {
        test('success', async (): Promise<void> => {
            const id: number = 12345;
            const storeKey: DatastoreKey = dao.datastore.key(['TestModel', id]);
            const deleteStub: SinonStub = stub(dao.datastore, 'delete');
            deleteStub.withArgs(storeKey).returns(Promise.resolve([{ mutationResults: [{ conflictDetected: false }] }]));

            await dao.delete(id);

            assert.isTrue(deleteStub.calledOnceWithExactly(storeKey));
            // No need to restore stubs as the DAO instance is recreated before each test
        });
        test('failure', async (): Promise<void> => {
            const deleteStub: SinonStub = stub(dao.datastore, 'delete');
            deleteStub.returns(Promise.resolve([{ mutationResults: [{ conflictDetected: true }] }]));

            try {
                await dao.delete(111);
                throw new Error('Unexpected success!');
            }
            catch (error) {
                if (!(error instanceof ServerErrorException)) {
                    throw error;
                }
            }

            assert.isTrue(deleteStub.calledOnce);
            // No need to restore stubs as the DAO instance is recreated before each test
        });
    });
});