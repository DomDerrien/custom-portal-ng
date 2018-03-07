import * as express from 'express';

import { BaseModel as Model } from '../model/BaseModel';
import { BaseDao as DAO } from '../dao/BaseDao';
import { BaseService as Service } from '../service/BaseService';

export type ServiceType = 'acs' | 'pmt' | 'lrn';

export class BaseResource<T extends Service<DAO<Model>>> {

    private apiVersion: number = 1; // Default version
    private service: Service<DAO<Model>>;

    // Factory method -- cannot be `abstract` because it's a public method
    public static getInstance(): BaseResource<Service<DAO<Model>>> {
        throw new Error('Must be overriden!');
    }

    protected constructor(service: Service<DAO<Model>>) {
        this.service = service;
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
        return (request: express.Request, response: express.Response): void => {
            // TODO: Range header
            // TODO: X-Sort header
            this.service.select(request.query)
                .then((entities: Model[]): void => {
                    // TODO: Cache-Control header
                    if (entities.length === 0) {
                        response.status(204).contentType('text/plain').send('No content matches the given criteria'); // HTTP status: NO CONTENT
                    } else {
                        // TODO: Content-Range header
                        // TODO: Check range to return HTTP status 206 (PARTIAL) if needed
                        response.setHeader('Content-Range', 'items: 0-' + (entities.length - 1) + ';' + entities.totalCount);
                        response.status(200).contentType('application/json').send(entities);
                    }
                })
                .catch((error: Error): void => {
                    console.log('BaseResource.select() failed with:\n', error)
                    response.status(404).contentType('text/plain').send('The corresponding request failed! -- ' + error.message);
                });
        };
    }

    private get getProcessor(): (request: express.Request, response: express.Response) => void {
        return (request: express.Request, response: express.Response): void => {
            this.service.get(Number(request.params.id), request.params[0])
                .then((entity: Model): void => {
                    // TODO: Cache-Control header
                    response.status(200).contentType('application/json').send(entity);
                })
                .catch((error: Error): void => {
                    console.log('BaseResource.get() failed with:\n', error)
                    response.status(404).contentType('text/plain').send('The corresponding request failed! -- ' + error.message);
                });
        };
    }

    private get createProcessor(): (request: express.Request, response: express.Response) => void {
        return (request: express.Request, response: express.Response): void => {
            let entity: Model = Object.assign(this.service.modelInstance, request.body);
            this.service.create(entity)
                .then((id: number): void => {
                    response.status(201).contentType('text/plain').location(request.originalUrl + '/' + id).send(id); // HTTP status: CREATED
                })
                .catch((error: Error): void => {
                    console.log('BaseResource.create() failed with:\n', error)
                    response.status(500).contentType('text/plain').send('Creation failed! -- ' + error.message);
                });
        };
    }

    private get updateProcessor(): (request: express.Request, response: express.Response) => void {
        return (request: express.Request, response: express.Response): void => {
            let entity: Model = Object.assign(this.service.modelInstance, request.body);
            this.service.update(Number(request.params.id), entity)
                .then((id: number): void => {
                    this.service.get(id).then((entity: Model) => {
                        // TODO: Cache-Control header
                        response.status(200).contentType('application/json').send(entity);
                    });
                })
                .catch((error: Error): void => {
                    // TODO: check error code (this is not 304 which is used when responding to GETs.message!)
                    console.log('BaseResource.update() failed with:\n', error)
                    response.status(403).contentType('text/plain').send('Entity not modified! -- ' + error);
                });
        };
    }

    private get deleteProcessor(): (request: express.Request, response: express.Response) => void {
        return (request: express.Request, response: express.Response): void => {
            this.service.delete(Number(request.params.id))
                .then((): void => {
                    response.status(200); // HTTP status: OK
                })
                .catch((error: Error): void => {
                    console.log('BaseResource.delete() failed with:\n', error)
                    response.status(403).contentType('text/plain').send('Entity not deleted! -- ' + error.message);
                });
        };
    }
}