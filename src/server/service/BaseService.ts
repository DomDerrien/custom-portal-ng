import { BaseModel as Model } from '../model/BaseModel';
import { BaseDao as DAO, QueryOptions } from '../dao/BaseDao';
import { User } from '../model/User';
import { NotFoundException } from '../exceptions/NotFoundException';
import { NotAuthorizedException } from '../exceptions/NotAuthorizedException';

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

    public async select(params: { [key: string]: string }, options: QueryOptions, loggedUser: User): Promise<Array<Model>> {
        if (loggedUser === null) {
            throw new NotAuthorizedException(`Limited access to ${this.modelName}.select()!`);
        }
        if (loggedUser !== User.Internal) {
            params.ownerId = '' + loggedUser.id;
        }
        return this.dao.query(params, options);
    }

    public async get(id: number, loggedUser: User): Promise<Model> {
        if (loggedUser === null) {
            throw new NotAuthorizedException(`Limited access to ${this.modelName}.get()!`);
        }
        const entity: Model = await this.dao.get(id);
        if (!entity) {
            throw new NotFoundException(`Entity ${this.modelName} w/ id ${id} not found!`);
        }
        if (loggedUser.id !== entity.ownerId && loggedUser !== User.Internal) {
            throw new NotAuthorizedException(`Operation ${this.modelName}.get() reserved to entity owner!`);
        }
        return entity;
    }

    public async create(candidate: Model, loggedUser: User): Promise<number> {
        if (loggedUser === null) {
            throw new NotAuthorizedException(`Limited access to ${this.modelName}.create()!`);
        }
        candidate.ownerId = loggedUser.id;
        return this.dao.create(candidate);
    }

    public async update(id: number, candidate: Model, loggedUser: User): Promise<number> {
        if (loggedUser === null) {
            throw new NotAuthorizedException(`Limited access to ${this.modelName}.update()!`);
        }
        const entity: Model = await this.dao.get(id);
        if (!entity) {
            throw new NotFoundException(`Entity ${this.modelName} w/ id ${id} not found!`);
        }
        if (loggedUser.id !== entity.ownerId && loggedUser !== User.Internal) {
            throw new NotAuthorizedException(`Operation ${this.modelName}.update() reserved to entity owner!`);
        }
        return this.dao.update(id, candidate);
    }

    public async delete(id: number, loggedUser: User): Promise<void> {
        if (loggedUser === null) {
            throw new NotAuthorizedException(`Limited access to ${this.modelName}.delete()!`);
        }
        const entity: Model = await this.dao.get(id);
        if (!entity) {
            throw new NotFoundException(`Entity ${this.modelName} w/ id ${id} not found!`);
        }
        if (loggedUser.id !== entity.ownerId && loggedUser !== User.Internal) {
            throw new NotAuthorizedException(`Operation ${this.modelName}.delete() reserved to entity owner!`);
        }
        return this.dao.delete(id);
    }
}