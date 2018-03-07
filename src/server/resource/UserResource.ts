import { UserService as Service } from '../service/UserService';
import { BaseResource, ServiceType } from './BaseResource';

export class UserResource extends BaseResource<Service> {
    private static instance: UserResource;

    // Factory method
    public static getInstance(): UserResource {
        if (!UserResource.instance) {
            UserResource.instance = new UserResource();
        }
        return UserResource.instance;
    }

    private constructor() {
        super(Service.getInstance());
    }
}