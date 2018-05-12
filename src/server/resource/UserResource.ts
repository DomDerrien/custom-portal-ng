import * as express from 'express';

import { User as Model } from '../model/User';
import { UserService as Service } from '../service/UserService';
import { BaseResource } from './BaseResource';

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

    // Add a custom route
    public getRouter(): express.Router {
        let basePath: string = '/api/v' + this.apiVersion + '/' + this.service.modelName;
        const router: express.Router = super.getRouter();

        router.get(basePath + '/me', this.getGetMeProcessor());

        return router;
    }

    private getGetMeProcessor(): (request: express.Request, response: express.Response) => void {
        return async (request: express.Request, response: express.Response): Promise<void> => {
            const loggedUser: Model = await this.authResource.getLoggedUser(request);
            if (loggedUser) {
                response.status(200).contentType('application/json').send(loggedUser);
            }
            else {
                response.status(401).contentType('text/plain').send('Not authenticated!');
            }
        };
    }
}