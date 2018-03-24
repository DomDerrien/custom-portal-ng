import { User as Model } from '../model/User';
import { GoogleDatastoreDao } from './GoogleDatastoreDao';

export class UserDao extends GoogleDatastoreDao<Model> {
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