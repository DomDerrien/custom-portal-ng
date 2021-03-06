import { BaseModel as Model } from '../model/BaseModel';
import { ServerErrorException } from '../exception/ServerErrorException';

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
        throw new ServerErrorException('Must be overriden!');
    }

    private model: T;

    protected constructor(model: T) {
        this.model = model;
    }

    public get modelClass(): TModelConstructor<T> {
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
    public abstract async create(candidate: T): Promise<number>;
    public abstract async update(id: number, candidate: T): Promise<number>;
    public abstract async delete(id: number): Promise<void>;
}