import { Link as Model } from '../model/Link';
import { GoogleDatastoreDao } from './GoogleDatastoreDao';

export class LinkDao extends GoogleDatastoreDao<Model> {
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