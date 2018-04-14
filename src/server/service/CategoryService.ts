import { Link as Child } from '../model/Link';
import { User } from '../model/User';
import { CategoryDao as DAO } from '../dao/CategoryDao';
import { BaseService } from './BaseService';
import { LinkService as ChildService } from './LinkService';
import { Category as Model } from '../model/Category';

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

    private getChildService(): ChildService {
        return ChildService.getInstance();
    }

    public async create(candidate: Model, loggedUser: User): Promise<number> {
        candidate.positionIdx = Number(candidate.positionIdx || 0);
        return super.create(candidate, loggedUser);
    }

    public async update(id: number, candidate: Model, loggedUser: User): Promise<number> {
        if (candidate.positionIdx) {
            candidate.positionIdx = Number(candidate.positionIdx);
        }
        return super.update(id, candidate, loggedUser);
    }

    public async delete(id: number, loggedUser: User): Promise<void> {
        // To be sure the entity exists and the logged user can access it
        await super.get(id, loggedUser);

        // Get children identifiers
        const childService: ChildService = this.getChildService();
        const children: Array<Child> = <Array<Child>>await childService.select({ categoryId: '' + id }, { idOnly: true, sortBy: ['+title'] }, loggedUser);

        // Order the deletion of children
        const deletionOrders: Array<Promise<void>> = [];
        for (const child of children) {
            deletionOrders.push(childService.delete(child.id, loggedUser));
        }

        // Wait for all deletion to complete
        await Promise.all(deletionOrders).then((): void => { console.log(`Deletion of category w/ ${children.length} link(s) completed.`) });

        // Then delete parent itself
        await super.delete(id, loggedUser);
    }
}