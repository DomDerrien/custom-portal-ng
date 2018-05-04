import fetch, { Request, RequestInit, Response } from 'node-fetch';

import { Link as Model } from '../model/Link';
import { User } from '../model/User';
import { QueryOptions } from '../dao/BaseDao';
import { LinkDao as DAO } from '../dao/LinkDao';
import { BaseService } from './BaseService';
import { CategoryService as ParentService } from './CategoryService';
import { ClientErrorException } from '../exception/ClientErrorException';

export class LinkService extends BaseService<DAO> {
    private static instance: LinkService;

    public static getInstance(): LinkService {
        if (!LinkService.instance) {
            LinkService.instance = new LinkService();
        }
        return LinkService.instance;
    }

    private fetch: (url: string | Request, init?: RequestInit) => Promise<Response>;

    private constructor(fetchFctn: (url: string | Request, init?: RequestInit) => Promise<Response> = fetch) {
        super(DAO.getInstance());
        this.fetch = fetchFctn;
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

    private async getFaviconDataURI(candidate: Model): Promise<Model> {
        if (candidate.faviconUrl && !candidate.faviconDataUri) {
            let imageType: string;
            await this.fetch(candidate.faviconUrl)
                .then(res => {
                    imageType = res.headers.get('content-type');
                    return res.buffer();
                })
                .then((buffer: Buffer): void => {
                    const prefix: string = `data:${imageType};base64,`;
                    const data: string = buffer.toString('base64');
                    if (prefix.length + data.length < 1500) {
                        candidate.faviconDataUri = prefix + data;
                    }
                    else {
                        console.log('Favicon size w/ URL', candidate.faviconUrl, 'is too large!', (prefix.length + data.length), 'bytes...');
                    }
                });
        }
        return candidate;
    }

    public async create(candidate: Model, loggedUser: User): Promise<number> {
        if (!candidate.categoryId) {
            throw new ClientErrorException(`Attribute 'categoryId' required!`);
        }
        candidate.categoryId = Number(candidate.categoryId);
        this.getFaviconDataURI(candidate);
        // To be sure the entity exists and the logged user can access it
        await this.getParentService().get(candidate.categoryId, loggedUser);

        return super.create(candidate, loggedUser);
    }

    public async update(id: number, candidate: Model, loggedUser: User): Promise<number> {
        delete candidate.categoryId; // Prevent any update of the parent identifier
        this.getFaviconDataURI(candidate);
        return super.update(id, candidate, loggedUser);
    }
}