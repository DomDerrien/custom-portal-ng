import * as express from 'express';

import { BaseException } from '../exceptions/BaseException';
import { BaseModel as Model } from '../model/BaseModel';
import { User } from '../model/User';
import { BaseDao as DAO, QueryOptions } from '../dao/BaseDao';
import { BaseService as Service } from '../service/BaseService';
import { AuthResource } from './AuthResource';

export class BaseResource<T extends Service<DAO<Model>>> {

    protected apiVersion: number = 1; // Default version
    protected service: Service<DAO<Model>>;
    protected authResource: AuthResource;

    // Factory method -- cannot be `abstract` because it's a public method
    public static getInstance(): BaseResource<Service<DAO<Model>>> {
        throw new Error('Must be overriden!');
    }

    protected constructor(service: Service<DAO<Model>>) {
        this.service = service;
        this.authResource = AuthResource.getInstance();
    }

    // Generate a self contained router for use of express
    public getRouter(): express.Router {
        let basePath: string = '/api/v' + this.apiVersion + '/' + this.service.modelName;

        let router: express.Router = express.Router();
        router.get(basePath + '/', this.selectProcessor);
        let getProcessor = this.getProcessor;
        router.get(basePath + '/:id', getProcessor);
        router.get(basePath + '/:id/*', getProcessor);
        router.post(basePath + '/', this.createProcessor);
        router.put(basePath + '/', this.updateProcessor);
        router.delete(basePath + '/:id', this.deleteProcessor);

        console.log('Ready to serve requests sent to:', basePath);
        return router;
    }

    private get selectProcessor(): (request: express.Request, response: express.Response) => void {
        return async (request: express.Request, response: express.Response): Promise<void> => {
            const range: string = <string>request.headers['range'];
            const rangeParts = /items=(\d+)\-(\d+)/.exec(range);
            const options: QueryOptions = {
                idOnly: request.headers['x-ids-only'] === 'true',
                sortBy: (<string>request.headers['x-sort-by'] || '').split(','),
                rangeStart: rangeParts !== null ? Number(rangeParts[1]) : undefined,
                rangeEnd: rangeParts !== null ? Number(rangeParts[2]) : undefined
            };
            this.service.select(request.query, options, await this.authResource.getLoggedUser(request))
                .then((entities: Array<Model>): void => {
                    // TODO: Cache-Control header
                    if (entities.length === 0) {
                        response.status(204).contentType('text/plain').send('No content matches the given criteria'); // HTTP status: NO CONTENT
                    } else {
                        const status: number = entities.totalCount ? 200 : 206;
                        response.setHeader('content-range', `items ${(options.rangeStart || 0)}-${(entities.length - 1)}/${(entities.totalCount || '*')}`);
                        if (options.idOnly) {
                            response.status(status).contentType('application/json').send(entities.map((entity: Model): number => entity.id));
                        }
                        else {
                            response.status(status).contentType('application/json').send(entities);
                        }
                    }
                })
                .catch((error: Error): void => {
                    console.log('BaseResource.select() failed with:\n', error)
                    const errorCode: number = error instanceof BaseException ? (<BaseException>error).errorCode : 404;
                    response.status(errorCode).contentType('text/plain').send('The corresponding request failed! -- ' + error.message);
                });
        };
    }

    private get getProcessor(): (request: express.Request, response: express.Response) => void {
        return async (request: express.Request, response: express.Response): Promise<void> => {
            const loggedUser: User = await this.authResource.getLoggedUser(request);
            this.service.get(Number(request.params.id), loggedUser)
                .then((entity: Model): void => {
                    // TODO: Cache-Control header
                    response.status(200).contentType('application/json').send(entity);
                })
                .catch((error: Error): void => {
                    console.log('BaseResource.get() failed with:\n', error)
                    const errorCode: number = error instanceof BaseException ? (<BaseException>error).errorCode : 404;
                    response.status(errorCode).contentType('text/plain').send('The corresponding request failed! -- ' + error.message);
                });
        };
    }

    private get createProcessor(): (request: express.Request, response: express.Response) => void {
        return async (request: express.Request, response: express.Response): Promise<void> => {
            let entity: Model = Object.assign(this.service.modelInstance, request.body);
            this.service.create(entity, await this.authResource.getLoggedUser(request))
                .then((id: number): void => {
                    response.contentType('text/plain').location(request.originalUrl + '/' + id).sendStatus(201); // HTTP status: CREATED
                })
                .catch((error: Error): void => {
                    console.log('BaseResource.create() failed with:\n', error)
                    const errorCode: number = error instanceof BaseException ? (<BaseException>error).errorCode : 500;
                    response.status(errorCode).contentType('text/plain').send('Creation failed! -- ' + error.message);
                });
        };
    }

    private get updateProcessor(): (request: express.Request, response: express.Response) => void {
        return async (request: express.Request, response: express.Response): Promise<void> => {
            let entity: Model = Object.assign(this.service.modelInstance, request.body);
            const loggedUser: User = await this.authResource.getLoggedUser(request);
            this.service.update(Number(request.params.id), entity, loggedUser)
                .then((id: number): void => {
                    this.service.get(id, loggedUser).then((entity: Model) => {
                        // TODO: Cache-Control header
                        response.status(200).contentType('application/json').send(entity);
                    });
                })
                .catch((error: Error): void => {
                    // TODO: check error code (this is not 304 which is used when responding to GETs.message!)
                    console.log('BaseResource.update() failed with:\n', error)
                    const errorCode: number = error instanceof BaseException ? (<BaseException>error).errorCode : 403;
                    response.status(errorCode).contentType('text/plain').send('Entity not modified! -- ' + error);
                });
        };
    }

    private get deleteProcessor(): (request: express.Request, response: express.Response) => void {
        return async (request: express.Request, response: express.Response): Promise<void> => {
            this.service.delete(Number(request.params.id), await this.authResource.getLoggedUser(request))
                .then((): void => {
                    response.sendStatus(200); // HTTP status: OK
                })
                .catch((error: Error): void => {
                    console.log('BaseResource.delete() failed with:\n', error)
                    const errorCode: number = error instanceof BaseException ? (<BaseException>error).errorCode : 403;
                    response.status(errorCode).contentType('text/plain').send('Entity not deleted! -- ' + error.message);
                });
        };
    }
}