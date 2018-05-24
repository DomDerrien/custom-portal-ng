import * as express from 'express';

import { BaseException } from '../exception/BaseException';
import { BaseModel as Model } from '../model/BaseModel';
import { User } from '../model/User';
import { BaseDao as DAO, QueryOptions } from '../dao/BaseDao';
import { BaseService as Service } from '../service/BaseService';
import { AuthResource } from './AuthResource';
import { ServerErrorException } from '../exception/ServerErrorException';

export class BaseResource<T extends Service<DAO<Model>>> {

    protected apiVersion: number = 1; // Default version
    protected service: T;
    protected authResource: AuthResource;

    // Factory method -- cannot be `abstract` because it's a public method
    public static getInstance(): BaseResource<Service<DAO<Model>>> {
        throw new ServerErrorException('Must be overriden!');
    }

    protected constructor(service: T) {
        this.service = service;
        this.authResource = AuthResource.getInstance();
    }

    // Generate a self contained router for use of express
    public getRouter(): express.Router {
        let basePath: string = '/api/v' + this.apiVersion + '/' + this.service.modelName;

        let router: express.Router = express.Router();
        router.get(basePath + '/', this.getSelectProcessor());
        let getProcessor = this.getGetProcessor();
        router.get(basePath + '/:id(\\d+)', getProcessor);
        // router.get(basePath + '/:id(\\d+)/*', getProcessor);
        router.post(basePath + '/', this.getCreateProcessor());
        router.put(basePath + '/:id(\\d+)', this.getUpdateProcessor());
        router.delete(basePath + '/:id(\\d+)', this.getDeleteProcessor());

        console.log('Ready to serve requests sent to:', basePath);
        return router;
    }

    private getSelectProcessor(): (request: express.Request, response: express.Response) => void {
        return async (request: express.Request, response: express.Response): Promise<void> => {
            const options: QueryOptions = {};
            if (request.headers) {
                options.idOnly = request.headers['x-ids-only'] === 'true';
                options.sortBy = (<string>request.headers['x-sort-by'] || '').split(',').filter((name: string) => name !== '');
                const range: string = <string>request.headers['range'];
                if (range) {
                    const rangeParts = /items=(\d+)\-(\d+)/.exec(range);
                    if (rangeParts !== null) {
                        options.rangeStart = Number(rangeParts[1]);
                        options.rangeEnd = Number(rangeParts[2]);
                    }
                }
            }
            return this.service.select(request.query, options, await this.authResource.getLoggedUser(request))
                .then((entities: Array<Model>): void => {
                    // TODO: Cache-Control header
                    if (entities.length === 0) {
                        response.status(204).contentType('text/plain').send('No content matches the given criteria'); // HTTP status: NO CONTENT
                    } else {
                        const status: number = entities.totalCount ? 200 : 206;
                        response.setHeader('content-range', `items ${(options.rangeStart || 0)}-${((options.rangeStart || 0) + entities.length - 1)}/${(entities.totalCount || '*')}`);
                        if (options.idOnly) {
                            response.status(status).contentType('application/json').send(entities.map((entity: Model): number => entity.id));
                        }
                        else {
                            response.status(status).contentType('application/json').send(entities);
                        }
                    }
                })
                .catch((error: Error): void => {
                    /// console.log('BaseResource.select() failed with:\n', error)
                    const errorCode: number = error instanceof BaseException ? (<BaseException>error).errorCode : 404;
                    response.status(errorCode).contentType('text/plain').send('The corresponding request failed! -- ' + error.message);
                });
        };
    }

    private getGetProcessor(): (request: express.Request, response: express.Response) => void {
        return async (request: express.Request, response: express.Response): Promise<void> => {
            const loggedUser: User = await this.authResource.getLoggedUser(request);
            return this.service.get(Number(request.params.id), loggedUser)
                .then((entity: Model): void => {
                    // TODO: Cache-Control header
                    response.status(200).contentType('application/json').send(entity);
                })
                .catch((error: Error): void => {
                    /// console.log('BaseResource.get() failed with:\n', error)
                    const errorCode: number = error instanceof BaseException ? (<BaseException>error).errorCode : 404;
                    response.status(errorCode).contentType('text/plain').send('The corresponding request failed! -- ' + error.message);
                });
        };
    }

    private getCreateProcessor(): (request: express.Request, response: express.Response) => void {
        return async (request: express.Request, response: express.Response): Promise<void> => {
            let entity: Model = Object.assign(this.service.modelInstance, request.body);
            this.service.create(entity, await this.authResource.getLoggedUser(request))
                .then((id: number): void => {
                    response.status(201).contentType('text/plain').location(request.originalUrl + '/' + id).send(id); // HTTP status: CREATED
                })
                .catch((error: Error): void => {
                    /// console.log('BaseResource.create() failed with:\n', error)
                    const errorCode: number = error instanceof BaseException ? (<BaseException>error).errorCode : 500;
                    response.status(errorCode).contentType('text/plain').send('Creation failed! -- ' + error.message);
                });
        };
    }

    private getUpdateProcessor(): (request: express.Request, response: express.Response) => void {
        return async (request: express.Request, response: express.Response): Promise<void> => {
            let entity: Model = Object.assign(this.service.modelInstance, request.body);
            const loggedUser: User = await this.authResource.getLoggedUser(request);
            return this.service.update(Number(request.params.id), entity, loggedUser)
                .then((id: number): Promise<void> => {
                    return this.service.get(id, loggedUser).then((entity: Model): void => {
                        // TODO: Cache-Control header
                        response.status(200).contentType('application/json').send(entity);
                    });
                })
                .catch((error: Error): void => {
                    // TODO: check error code (this is not 304 which is used when responding to GETs.message!)
                    /// console.log('******** BaseResource.update() failed with:\n', error)
                    const errorCode: number = error instanceof BaseException ? (<BaseException>error).errorCode : 403;
                    response.status(errorCode).contentType('text/plain').send('Entity not modified! -- ' + error);
                });
        };
    }

    private getDeleteProcessor(): (request: express.Request, response: express.Response) => void {
        return async (request: express.Request, response: express.Response): Promise<void> => {
            return this.service.delete(Number(request.params.id), await this.authResource.getLoggedUser(request))
                .then((): void => {
                    response.status(200).contentType('text/plain').send('Deletion completed'); // HTTP status: OK
                })
                .catch((error: Error): void => {
                    /// console.log('BaseResource.delete() failed with:\n', error)
                    const errorCode: number = error instanceof BaseException ? (<BaseException>error).errorCode : 403;
                    response.status(errorCode).contentType('text/plain').send('Entity not deleted! -- ' + error.message);
                });
        };
    }
}