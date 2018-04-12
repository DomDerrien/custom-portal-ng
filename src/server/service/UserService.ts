import * as express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { LoginTicket, TokenPayload } from 'google-auth-library/build/src/auth/loginticket';

import { NotAuthorizedException } from '../exceptions/NotAuthorizedException';
import { UserDao as DAO } from '../dao/UserDao';
import { BaseService } from './BaseService';
import { User } from '../model/User';

const loggedUserCache: { [key: string]: User } = {};

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

    // TODO: use the user cache for get(id), select(id) and select(email)

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