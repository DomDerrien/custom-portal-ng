import { Link as Model } from '../model/Link';
import { BaseDao } from './BaseDao';

export class LinkDao extends BaseDao<Model> {
    private static instance: LinkDao;

    // Factory method
    public static getInstance(): LinkDao {
        if (!LinkDao.instance) {
            LinkDao.instance = new LinkDao();
        }
        return LinkDao.instance;
    }

    private constructor() {
        super(Model.getInstance());
    }
}