import * as fs from 'fs';
import * as Datastore from '@google-cloud/datastore';
import { CommitResponse, CommitResult, MutationResult } from '@google-cloud/datastore/request';
import { QueryResult, Query, MoreResultsAfterCursor, MoreResultsAfterLimit, NoMoreResults, QueryFilterOperator } from '@google-cloud/datastore/query';
import { DatastoreKey } from '@google-cloud/datastore/entity';
import { DatastoreTransaction, TransactionResult } from '@google-cloud/datastore/transaction';

import { BaseModel as Model } from '../model/BaseModel';

interface TModelConstructor<T extends Model> {
    new(): T;
    getInstance(): T;

    // Http related
    fromHttp(rootPath: string, rootTag: string, id: string, input: any): T
    toHttp(): { [key: string]: any }

    // DynamoDB related
    getDdbTypes(): { [key: string]: string }
    getDdbSecondaryIndexes(): Array<{ [key: string]: any }>
    fromDdb(content: { [key: string]: any }): T;
    toDdb(): { [key: string]: any }
}

function getDatastoreCredentialsFilename(fsAccess: FileSystemAccess): string | undefined {
    const filename: string = '../custom-portal-datastore-access.json';
    if (fsAccess.existsSync(filename)) {
        return filename;
    }
    return undefined;
}

export class BaseDao<T extends Model> {
    // Factory method -- cannot be `abstract` because it's a public method
    public static getInstance(): BaseDao<Model> {
        throw new Error('Must be overriden!');
    }

    protected model: T;
    protected store: Datastore;

    public constructor(model: T, Store: any = Datastore, fsAccess: FileSystemAccess = fs) {
        this.model = model;
        this.store = new Store({
            keyFilename: getDatastoreCredentialsFilename(fsAccess)
        });
    }

    protected get modelClass(): TModelConstructor<T> {
        return <TModelConstructor<T>>this.model.constructor;
    }

    public get modelName(): string {
        return this.modelClass.name;
    }

    public get modelInstance(): T {
        return this.modelClass.getInstance();
    }

    public prepareModelInstance(attributes: object = undefined): T {
        const instance = this.modelInstance;
        if (attributes) {
            const keyName: symbol = this.store.KEY;
            const key: DatastoreKey = (<any>attributes)[keyName];
            const id: number = key ? Number(key.id) : undefined;
            delete attributes[keyName];
            delete (<any>attributes).id;
            Object.assign(instance, attributes, {
                id: id
            });
        }
        return instance;
    }

    public async get(id: number, selector?: string): Promise<T> {
        return this.store.get(this.store.key([this.modelName, id])).then((result: object) => this.prepareModelInstance(result));
    }

    private prepareStandardQuery(filters: { [key: string]: string }): Query {
        const query: Query = this.store.createQuery(this.modelName);
        for (let key in filters) {
            if (Array.isArray(filters[key])) {
                throw new Error(`Selection of many entities from a collection of ${key} is not yet supported!`);
            }
            if (key === '_order_') {
                const order: string = filters[key];
                if (1 < order.length) {
                    const directionChar: string = order.charAt(0);
                    if (directionChar !== '+' && directionChar !== '-') {
                        throw new Error(`Value ${order} of filter \'_order\` must start by \`+\` or \`-\``);
                    }
                    query.order(order.substring(1), { descending: directionChar === '-' });
                }
            }
            else if (key === '_offset_') {
                query.offset(Number(filters[key]));
            }
            else if (key === '_limit_') {
                query.limit(Number(filters[key]));
            }
            else if (key === 'id') {
                query.filter('__key__', this.store.key([this.modelName, Number(filters[key])]));
            }
            else {
                let operator: QueryFilterOperator = '=';
                let value: string = filters[key];
                const operatorlDef: RegExpExecArray = /^(=|<=?|>=?)(.+)/.exec(value);
                if (operatorlDef !== null) {
                    operator = <QueryFilterOperator>operatorlDef[1];
                    value = operatorlDef[2];
                }
                query.filter(key, operator, /\d+/.test(value) ? Number(value) : value === 'true' ? true : value === 'false' ? false : value);
            }
        }
        return query;
    }

    public async query(filters: { [key: string]: any }): Promise<Array<T>> {
        // Add filters
        const query: Query = this.prepareStandardQuery(filters);
        // Get the data
        return this.store.runQuery(query).then((results: QueryResult): Array<T> => {
            //-- const endCursor: string = results[1].endCursor;
            const entities: Array<T> = results[0].map((result: object): T => this.prepareModelInstance(result));
            const moreResults: MoreResultsAfterCursor | MoreResultsAfterLimit | NoMoreResults = results[1].moreResults;
            if (moreResults === Datastore.NO_MORE_RESULTS) {
                entities.totalCount = entities.length;
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
                throw new Error(`Entity ${this.modelName} not created, conflict detected...`);
            }
            const key: DatastoreKey = mutationResults[0].key;
            return Number(key.id);
        });
    }

    public async update(id: number, candidate: Model): Promise<number> {
        // Clean up the candidate
        delete candidate.id; // Only the value of the parameter `id` is used
        delete candidate.created; // No override possible
        if (!candidate.updated) {
            throw new Error(`\`updated\` attribute for entity ${this.modelName} of key ${id} is required to avoid changes overrides!`)
        }
        // Initiate a transaction
        const transaction: DatastoreTransaction = this.store.transaction();
        const key: DatastoreKey = this.store.key([this.modelName, id]);
        return transaction.run().
            // Get the identified entity
            then((result: TransactionResult): Promise<Array<object>> => result[0].get(key)).
            // Check if the entity match
            then((results: Array<object>): Promise<CommitResult> => {
                // Compare the `updated` attribute value with the one just retreived to detect possible overrides
                const entity: T = this.prepareModelInstance(results[0]);
                if (entity.updated !== candidate.updated) {
                    throw new Error(`\'updated\' attributes for entity ${this.modelName} of key ${id} does not match with the one on the server!`);
                }
                // Integrate proposed updates, and throw an error if none is accepted/detected
                if (!entity.merge(candidate)) {
                    throw new Error(`No attribute to update for entity ${this.modelName} of key ${id}`);
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
                    throw new Error(`Entity ${this.modelName} of key ${id} not updated, conflict detected...`);
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
                throw new Error(`Entity ${this.modelName} of key ${id} not deleted, conflict detected...`);
            }
        });
    }

}