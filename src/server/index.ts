import * as express from 'express';
import * as morgan from 'morgan';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';

import * as resources from './resource/index'; // List of all concrete BaseResource classes implementions

import { RequestHandler } from 'express';
import { OptionsJson, OptionsUrlencoded } from 'body-parser';
import { ServeStaticOptions } from 'serve-static';
import { Router } from 'express-serve-static-core';
interface ExpressBodyParser {
    json(options?: OptionsJson): RequestHandler;
    urlencoded(options?: OptionsUrlencoded): RequestHandler;
}
interface ExpressLogger {
    (format: string | Function, options?: object): RequestHandler;
}
interface ExpressStatic {
    (root: string, options?: ServeStaticOptions): express.Handler
}
interface ExpressRouter {
    (options?: express.RouterOptions): Router
}

class Server {
    private static CLIENT_MAIN_PAGE_PATH: string = './src/client/index.html';
    private static CLIENT_JS_DEPS_FOLDER: string = './dist/client';

    private clientMainPage: string;
    private fsAccess: FileSystemAccess;
    private expressApp: express.Application;
    private expressParser: ExpressBodyParser;
    private expressLogger: ExpressLogger;
    private expressStatic: ExpressStatic;
    private expressRouter: ExpressRouter;

    public constructor(app: express.Application = express(), parser: ExpressBodyParser = bodyParser, logger: ExpressLogger = morgan,
        serveStatic: ExpressStatic = express.static, Router: ExpressRouter = express.Router, fsAccess: FileSystemAccess = fs
    ) {
        this.expressApp = app;
        this.expressParser = parser;
        this.expressLogger = logger;
        this.expressStatic = serveStatic;
        this.expressRouter = Router;
        this.fsAccess = fsAccess;
    }

    private loadDependencies() {
        this.clientMainPage = this.fsAccess.readFileSync(Server.CLIENT_MAIN_PAGE_PATH).toString('utf8');
    }

    private addMiddlewares() {
        this.expressApp.use(this.expressLogger('dev')); // See https://github.com/expressjs/morgan
        this.expressApp.use(this.expressParser.json());
        this.expressApp.use(this.expressParser.urlencoded({ extended: false }));
        this.expressApp.use(function (req, res, next) {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
        this.expressApp.use(this.expressStatic(Server.CLIENT_JS_DEPS_FOLDER));
    }

    private addServerRoutes() {
        for (let resourceName in resources) {
            // Register the router provided by each concrete implementation of BaseResource
            this.expressApp.use(resources[resourceName].getInstance().getRouter());
        }
    }

    private addClientRoutes() {
        this.expressApp.use(this.expressRouter().get('/node_modules/*', (request: express.Request, response: express.Response): void => {
            const url: string = request.url;
            const extension: string = url.substring(url.lastIndexOf('.') + 1);
            switch (extension) {
                case 'js': response.set('Content-Type', 'application/javascript'); break;
                case 'map': response.set('Content-Type', 'application/octet-stream'); break;
                default: console.log('******* Unsupported extension', extension, 'for', url);
            }
            const content: string = this.fsAccess.readFileSync('.' + url).toString('utf8');
            // TODO:
            // 1 compute the url without the current filename
            // 2 compute a prefix with the short url appended with '/node_modules/'
            // 3 while there's a match to /import '[^.\/].+?';/
            // 3.1 insert the computed prefix before the module name to import
            response.send(content);
        }));
        this.expressApp.use(this.expressRouter().get('/*', (request: express.Request, response: express.Response): void => {
            response.set('Content-Type', 'text/html');
            response.send(this.clientMainPage);
        }));
    }

    public start(port: number) {
        this.loadDependencies();
        this.addMiddlewares();
        this.addServerRoutes();
        this.addClientRoutes();

        this.expressApp.listen(port);
    }
}

export const instanciateServer = function (): Server {
    return new Server();
}