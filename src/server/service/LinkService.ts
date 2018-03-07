import { LinkDao as DAO } from '../dao/LinkDao';
import { BaseService } from './BaseService';

export class LinkService extends BaseService<DAO> {
    private static instance: LinkService;

    public static getInstance(): LinkService {
        if (!LinkService.instance) {
            LinkService.instance = new LinkService();
        }
        return LinkService.instance;
    }

    private constructor() {
        super(DAO.getInstance());
    }
}