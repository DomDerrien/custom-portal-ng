import { NotAuthorizedException } from '../exception/NotAuthorizedException';
import { UserDao as DAO } from '../dao/UserDao';
import { BaseService } from './BaseService';
import { User } from '../model/User';

export class UserService extends BaseService<DAO> {
    private static instance: UserService;

    public static getInstance(): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }

    private constructor() {
        super(DAO.getInstance());
    }

    public async get(id: number, loggedUser: User): Promise<User> {
        if (loggedUser === null) {
            throw new NotAuthorizedException(`Limited access to ${this.modelName}.get()!`);
        }
        if (loggedUser.id !== id && loggedUser !== User.Internal) {
            throw new NotAuthorizedException(`Limited access to ${this.modelName}.get()!`);
        }
        return <User>await super.get(id, User.Internal);
    }

    public async create(candidate: User, loggedUser: User): Promise<number> {
        if (loggedUser !== User.Internal) {
            throw new NotAuthorizedException(`Limited access to ${this.modelName}.create()!`);
        }
        return super.create(candidate, loggedUser);
    }

    public async update(id: number, candidate: User, loggedUser: User): Promise<number> {
        if (loggedUser === null) {
            throw new NotAuthorizedException(`Limited access to ${this.modelName}.update()!`);
        }
        if (loggedUser.id !== id && loggedUser !== User.Internal) { // Only the owner can modify her profile
            throw new NotAuthorizedException(`Limited access to ${this.modelName}.update()!`);
        }
        return super.update(id, candidate, User.Internal);
    }

    public async delete(id: number, loggedUser: User): Promise<void> {
        throw new NotAuthorizedException(`Limited access to ${this.modelName}.delete()!`);
    }
}