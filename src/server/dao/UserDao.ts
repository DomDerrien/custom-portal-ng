import { User as Model } from '../model/User';
import { BaseDao } from './BaseDao';

export class UserDao extends BaseDao<Model> {
    private static instance: UserDao;

    // Factory method
    public static getInstance(): UserDao {
        if (!UserDao.instance) {
            UserDao.instance = new UserDao();
        }
        return UserDao.instance;
    }

    private constructor() {
        super(Model.getInstance());
    }
}