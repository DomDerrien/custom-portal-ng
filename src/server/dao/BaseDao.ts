import * as fs from 'fs';
import * as Datastore from '@google-cloud/datastore';
import { CommitResponse, CommitResult, MutationResult } from '@google-cloud/datastore/request';
import { QueryResult, Query, MoreResultsAfterCursor, MoreResultsAfterLimit, NoMoreResults, QueryFilterOperator, QueryInfo } from '@google-cloud/datastore/query';
import { DatastoreKey } from '@google-cloud/datastore/entity';
import { DatastoreTransaction, TransactionResult } from '@google-cloud/datastore/transaction';

import { BaseModel as Model } from '../model/BaseModel';

interface TModelConstructor<T extends Model> {
    new(): T;
    getInstance(): T;
}

export interface QueryOptions {
    idOnly?: boolean;
    sortBy?: Array<string>,
    rangeStart?: number;
    rangeEnd?: number;
    endCursor?: string;
}

export abstract class BaseDao<T extends Model> {
    // Factory method -- cannot be `abstract` because it's a public method
    public static getInstance(): BaseDao<Model> {
        throw new Error('Must be overriden!');
    }

    protected model: T;

    public constructor(model: T, Store: any = Datastore, fsAccess: FileSystemAccess = fs) {
        this.model = model;
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

    public abstract async get(id: number): Promise<T>;
    public abstract async query(filters: { [key: string]: any }, options: QueryOptions): Promise<Array<T>>;
    public abstract async create(candidate: Model): Promise<number>;
    public abstract async update(id: number, candidate: Model): Promise<number>;
    public abstract async delete(id: number): Promise<void>;
}