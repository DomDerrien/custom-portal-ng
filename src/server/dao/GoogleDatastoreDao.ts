import * as Datastore from '@google-cloud/datastore';
import { CommitResponse, CommitResult, MutationResult } from '@google-cloud/datastore/request';
import { QueryResult, Query, MoreResultsAfterCursor, MoreResultsAfterLimit, NoMoreResults, QueryFilterOperator, QueryInfo } from '@google-cloud/datastore/query';
import { DatastoreKey } from '@google-cloud/datastore/entity';
import { DatastoreTransaction, TransactionResult } from '@google-cloud/datastore/transaction';

import { BaseDao, QueryOptions } from './BaseDao';
import { BaseModel as Model } from '../model/BaseModel';
import { ClientErrorException } from '../exceptions/ClientErrorException';
import { ServerErrorException } from '../exceptions/ServerErrorException';

export class GoogleDatastoreDao<T extends Model> extends BaseDao<T> {
    private store: Datastore;

    protected constructor(model: T, Store: any = Datastore) {
        super(model);
        this.store = new Store({}); // Initialization relies on the environment variable GOOGLE_APPLICATION_CREDENTIALS to locate the service account file
    }

    private prepareModelInstance(attributes: object = undefined): T {
        const instance: T = this.modelInstance;
        if (attributes) {
            const keyName: symbol = this.store.KEY;
            const key: DatastoreKey = (<any>attributes)[keyName];
            const id: number = key ? Number(key.id) : undefined;
            delete (<any>attributes)[keyName];
            delete (<any>attributes).id;
            Object.assign(instance, attributes, {
                id: id
            });
        }
        return instance;
    }

    public async get(id: number): Promise<T> {
        return this.store.get(this.store.key([this.modelName, id])).then((result: object) => this.prepareModelInstance((<QueryResult>result)[0]));
    }

    private prepareStandardQuery(filters: { [key: string]: string }, options: QueryOptions): Query {
        const query: Query = this.store.createQuery(this.modelName);
        let inequalityKey: string = null;
        for (let key in filters) {
            if (Array.isArray(filters[key])) {
                throw new ServerErrorException(`Selection of many entities from a collection of ${key} is not yet supported!`);
            }
            if (key === 'id') {
                query.filter('__key__', this.store.key([this.modelName, Number(filters[key])]));
            }
            else {
                let operator: QueryFilterOperator = '=';
                let value: string = filters[key];
                const operatorlDef: RegExpExecArray = /^(=|<=?|>=?)(.*)/.exec(value);
                if (operatorlDef !== null) {
                    operator = <QueryFilterOperator>operatorlDef[1];
                    value = operatorlDef[2];
                    if (operator.charAt(0) !== '=') {
                        if (inequalityKey !== null) {
                            throw new ClientErrorException(`Only one inequality is allowed!`);
                        }
                        inequalityKey = key;
                    }
                }
                query.filter(key, operator, /^\d+$/.test(value) ? Number(value) : value === 'true' ? true : value === 'false' ? false : value);
                if (inequalityKey === key) {
                    // TODO: check the `sortBy` list
                    // TODO: remove the key from this list
                    // TODO: use the sort order (first character) used in that list or default on `ascending` order
                    query.order(inequalityKey, { descending: false });
                }
            }
        }
        if (Array.isArray(options.sortBy)) {
            for (const order of options.sortBy) {
                if (1 < order.length) {
                    const directionChar: string = order.charAt(0);
                    if (directionChar !== '+' && directionChar !== '-') {
                        throw new ClientErrorException(`Value ${order} of option 'sortBy' must start by '+' or '-'`);
                    }
                    query.order(order.substring(1), { descending: directionChar === '-' });
                }
            }
        }
        if (options.idOnly === true) {
            query.select('__key__');
        }
        if (options.rangeStart) {
            query.offset(options.rangeStart);
        }
        if (options.rangeEnd) {
            query.limit(options.rangeEnd - (options.rangeStart || 0) + 1);
        }
        return query;
    }

    public async query(filters: { [key: string]: any }, options: QueryOptions = {}): Promise<Array<T>> {
        // Add filters
        const query: Query = this.prepareStandardQuery(filters, options);
        // Get the data
        return this.store.runQuery(query).then((results: QueryResult): Array<T> => {
            //-- const endCursor: string = results[1].endCursor;
            const entities: Array<T> = results[0].map((result: object): T => this.prepareModelInstance(result));
            const moreResults: MoreResultsAfterCursor | MoreResultsAfterLimit | NoMoreResults = (<QueryInfo>results[1]).moreResults;
            if (moreResults === Datastore.NO_MORE_RESULTS) {
                entities.totalCount = (options.rangeStart || 0) + entities.length;
            }
            return entities;
        });
    }

    public async create(candidate: Model): Promise<number> {
        // Clean up the candidate
        delete candidate.id; // Will be generated by the store
        candidate.created = new Date().toJSON();
        candidate.updated = candidate.created;
        // Create the entity
        return this.store.save({
            key: this.store.key([this.modelName]),
            data: candidate
        }).then((result: CommitResult): number => {
            // Response processing
            const response: CommitResponse = result[0];
            const mutationResults: Array<MutationResult> = response.mutationResults;
            const conflictDetected: boolean = mutationResults[0].conflictDetected;
            if (conflictDetected) {
                throw new ServerErrorException(`Entity ${this.modelName} not created, conflict detected...`);
            }
            const key: DatastoreKey = mutationResults[0].key;
            if (key.id) {
                return Number(key.id);
            }
            const pathElement: { idType: 'id' | 'name', id: number, kind: string } = <any>key.path[0];
            if (pathElement.idType !== 'id') {
                throw new ServerErrorException(`Entity ${this.modelName} just created is not identified with 'id', with '${pathElement.idType}' instead...`);
            }
            if (pathElement.kind !== this.modelName) {
                throw new ServerErrorException(`Entity ${this.modelName} just created is identified with first path element not with the '${this.modelName}' kind, with '${pathElement.kind}' instead...`);
            }
            return Number(pathElement.id);
        });
    }

    public async update(id: number, candidate: Model): Promise<number> {
        if (!candidate.updated) {
            throw new ClientErrorException(`\`updated\` attribute for entity ${this.modelName} of key ${id} is required to avoid changes overrides!`)
        }
        // Initiate a transaction
        const key: DatastoreKey = this.store.key([this.modelName, id]);
        const transaction: DatastoreTransaction = this.store.transaction();
        return transaction.run().
            // Get the identified entity
            then((result: TransactionResult): Promise<Array<object>> => result[0].get(key)).
            // Check if the entity match
            then((results: Array<object>): Promise<CommitResult> => {
                // Compare the `updated` attribute value with the one just retreived to detect possible overrides
                const entity: T = this.prepareModelInstance(results[0]);
                if (entity.updated !== candidate.updated) {
                    throw new ClientErrorException(`\'updated\' attributes for entity ${this.modelName} of key ${id} does not match with the one on the server!`);
                }
                // Integrate proposed updates, and throw an error if none is accepted/detected
                if (!entity.merge(candidate)) {
                    throw new ClientErrorException(`No attribute to update for entity ${this.modelName} of key ${id}`);
                }
                // Clean up the entity
                delete entity.id;
                entity.updated = new Date().toJSON();
                transaction.save({
                    key: key,
                    data: entity
                });
                return transaction.commit();
            }).
            then((result: CommitResult): number => {
                // Response processing
                const response: CommitResponse = result[0];
                const mutationResults: Array<MutationResult> = response.mutationResults;
                const conflictDetected: boolean = mutationResults[0].conflictDetected;
                if (conflictDetected) {
                    throw new ServerErrorException(`Entity ${this.modelName} of key ${id} not updated, conflict detected...`);
                }
                return id;
            }).
            catch(async (error: Error): Promise<never> => {
                await transaction.rollback();
                throw error;
            });
    }

    public async delete(id: number): Promise<void> {
        return this.store.delete(this.store.key([this.modelName, id])).then((result: CommitResult): void => {
            // Response processing
            const response: CommitResponse = result[0];
            const mutationResults: Array<MutationResult> = response.mutationResults;
            const conflictDetected: boolean = mutationResults[0].conflictDetected;
            if (conflictDetected) {
                throw new ServerErrorException(`Entity ${this.modelName} of key ${id} not deleted, conflict detected...`);
            }
        });
    }
}