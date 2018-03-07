import { CategoryDao as DAO } from '../dao/CategoryDao';
import { BaseService } from './BaseService';

export class CategoryService extends BaseService<DAO> {
    private static instance: CategoryService;

    public static getInstance(): CategoryService {
        if (!CategoryService.instance) {
            CategoryService.instance = new CategoryService();
        }
        return CategoryService.instance;
    }

    private constructor() {
        super(DAO.getInstance());
    }
}