import { UserDao as DAO } from '../dao/UserDao';
import { BaseService } from './BaseService';

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
}