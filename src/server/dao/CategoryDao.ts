import { Category as Model } from '../model/Category';
import { BaseDao } from './BaseDao';

export class CategoryDao extends BaseDao<Model> {
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