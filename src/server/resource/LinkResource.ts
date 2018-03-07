import { LinkService as Service } from '../service/LinkService';
import { BaseResource, ServiceType } from './BaseResource';

export class LinkResource extends BaseResource<Service> {
    private static instance: LinkResource;

    // Factory method
    public static getInstance(): LinkResource {
        if (!LinkResource.instance) {
            LinkResource.instance = new LinkResource();
        }
        return LinkResource.instance;
    }

    private constructor() {
        super(Service.getInstance());
    }
}