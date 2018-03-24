import { Category as Model } from '../model/Category';
import { GoogleDatastoreDao } from './GoogleDatastoreDao';

export class CategoryDao extends GoogleDatastoreDao<Model> {
    private static instance: CategoryDao;

    // Factory method
    public static getInstance(): CategoryDao {
        if (!CategoryDao.instance) {
            CategoryDao.instance = new CategoryDao();
        }
        return CategoryDao.instance;
    }

    private constructor() {
        super(Model.getInstance());
    }
}