import { Category as Parent, Category } from '../model/Category';
import { Link as Model } from '../model/Link';
import { User } from '../model/User';
import { QueryOptions } from '../dao/BaseDao';
import { LinkDao as DAO } from '../dao/LinkDao';
import { BaseService } from './BaseService';
import { CategoryService as ParentService } from './CategoryService';
import { NotFoundException } from '../exceptions/NotFoundException';

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

    private getParentService(): ParentService {
        return ParentService.getInstance();
    }

    public async select(params: { [key: string]: string }, options: QueryOptions, loggedUser: User): Promise<Array<Model>> {
        if (params.categoryId) {
            // To be sure the entity exists and the logged user can access it
            await this.getParentService().get(Number(params.categoryId), loggedUser);
        }
        return <Promise<Array<Model>>>super.select(params, options, loggedUser);
    }

    public async create(candidate: Model, loggedUser: User): Promise<number> {
        if (candidate.categoryId) {
            // To be sure the entity exists and the logged user can access it
            await this.getParentService().get(Number(candidate.categoryId), loggedUser);
        }
        return super.create(candidate, loggedUser);
    }

    public async update(id: number, candidate: Model, loggedUser: User): Promise<number> {
        delete candidate.categoryId; // Prevent any update of the parent identifier
        return super.update(id, candidate, loggedUser);
    }
}