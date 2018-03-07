import { BaseModel as Model } from '../model/BaseModel';
import { BaseDao as DAO } from '../dao/BaseDao';

export class BaseService<T extends DAO<Model>> {
    protected dao: DAO<Model>;

    // Factory method -- cannot be `abstract` because it's a public method
    public static getInstance(): BaseService<DAO<Model>> {
        throw new Error('Must be overriden!');
    }

    protected constructor(dao: DAO<Model>) {
        this.dao = dao;
    }

    // Helper hiding the DAO nature
    public get modelName(): string {
        return this.dao.modelName;
    }

    // Helper hiding the DAO nature
    public get modelInstance(): Model {
        return this.dao.modelInstance;
    }

    public async select(params: { [key: string]: string }): Promise<Model[]> {
        return this.dao.query(params);
    }

    public async get(id: number, selector?: string): Promise<Model> {
        return this.dao.get(id, selector);
    }

    public async create(candidate: Model): Promise<number> {
        return this.dao.create(candidate);
    }

    public async update(id: number, candidate: Model): Promise<number> {
        return this.dao.update(id, candidate);
    }

    public async delete(id: number): Promise<void> {
        return this.dao.delete(id);
    }
}