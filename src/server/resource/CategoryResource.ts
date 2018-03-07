import { CategoryService as Service } from '../service/CategoryService';
import { BaseResource, ServiceType } from './BaseResource';

export class CategoryResource extends BaseResource<Service> {
    private static instance: CategoryResource;

    // Factory method
    public static getInstance(): CategoryResource {
        if (!CategoryResource.instance) {
            CategoryResource.instance = new CategoryResource();
        }
        return CategoryResource.instance;
    }

    private constructor() {
        super(Service.getInstance());
    }
}