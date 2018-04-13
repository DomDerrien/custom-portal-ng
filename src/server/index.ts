import * as express from 'express';
import * as morgan from 'morgan';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
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
interface ExpressCookieParser {
    (secret?: string | string[], options?: cookieParser.CookieParseOptions): express.RequestHandler;
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
declare global {
    interface FileSystemAccess {
        statSync(path: string): fs.Stats;
    }
}

class Server {
    private expressApp: express.Application;
    private expressBodyParser: ExpressBodyParser;
    private expressCookieParser: ExpressCookieParser;
    private expressLogger: ExpressLogger;
    private expressStatic: ExpressStatic;
    private expressRouter: ExpressRouter;
    private fsAccess: FileSystemAccess;

    public constructor(app: express.Application = express(), bdParser: ExpressBodyParser = bodyParser,
        ckParser: ExpressCookieParser = cookieParser, logger: ExpressLogger = morgan,
        serveStatic: ExpressStatic = express.static, Router: ExpressRouter = express.Router,
        fsAccess: FileSystemAccess = fs
    ) {
        this.expressApp = app;
        this.expressBodyParser = bdParser;
        this.expressCookieParser = ckParser;
        this.expressLogger = logger;
        this.expressStatic = serveStatic;
        this.expressRouter = Router;
        this.fsAccess = fsAccess;
    }

    private clientMainPage: string;

    private loadDependencies() {
        this.clientMainPage = this.fsAccess.readFileSync(__dirname + '/../../src/client/index.html').toString('utf8');
    }

    private addMiddlewares() {
        this.expressApp.use(this.expressLogger('dev')); // See https://github.com/expressjs/morgan
        this.expressApp.use(this.expressBodyParser.json());
        this.expressApp.use(this.expressBodyParser.urlencoded({ extended: false }));
        this.expressApp.use(this.expressCookieParser());
        this.expressApp.use(function (req, res, next) {
            res.header('Vary', 'Origin');
            res.header('Access-Control-Allow-Origin', <string>req.headers.origin);
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Ids-Only, X-Sort-By');
            res.header('Access-Control-Allow-Credentials', 'true');
            next();
        });
        const staticOptions: ServeStaticOptions = {
            etag: true,
            immutable: true,
            index: false,
            lastModified: true,
            maxAge: 15 * 60 * 1000,
            redirect: false
        };
        this.expressApp.use('/app', this.expressStatic(__dirname + '/../client/app', staticOptions));
        this.expressApp.use('/model', this.expressStatic(__dirname + '/../client/model', staticOptions));
        this.expressApp.use('/widgets', this.expressStatic(__dirname + '/../client/widgets', staticOptions));
        this.expressApp.use('/fonts', this.expressStatic(__dirname + '/../../src/client/fonts', Object.assign({}, staticOptions, { maxAge: 3000000 })));
        this.expressApp.use('/images', this.expressStatic(__dirname + '/../../src/client/images', Object.assign({}, staticOptions, { maxAge: 3000000 })));
    }

    private addServerRoutes() {
        for (let resourceName in resources) {
            // Register the router provided by each concrete implementation of BaseResource
            this.expressApp.use(resources[resourceName].getInstance().getRouter());
        }
    }

    private replaceNodeImports(url: string, content: string, pattern: string): string {
        const importRE: RegExp = new RegExp(`(?:'|")${pattern}/`, 'g');
        if (importRE.test(content)) {
            // Identify the request elements
            let sourceFolder: string = url.substring('/node_modules/'.length);
            let slashIdx: number = sourceFolder.indexOf('/');
            const componentName: string = sourceFolder.substring(0, slashIdx);
            sourceFolder = sourceFolder.substring(slashIdx + 1);
            // Count how deep is the requester
            slashIdx = -1;
            let substitution: string = '';
            while ((slashIdx = sourceFolder.indexOf('/', slashIdx + 1)) !== -1) {
                substitution += '../';
            }
            // Replace the occurrence of node import statements starting with the pattern
            content = content.replace(importRE, `'${substitution + '../../node_modules/' + pattern + '/'}`);
        }
        return content;
    }

    private toLastModifiedFormat(date: Date): string {
        const weekdays: Array<string> = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months: Array<string> = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const out: Array<string> = [
            weekdays[date.getDay()], ', ',
            ('' + date.getDate()).padStart(2, '0'), ' ',
            months[date.getMonth()], ' ',
            ('' + date.getFullYear()), ' ',
            ('' + date.getHours()).padStart(2, '0'), ':',
            ('' + date.getMinutes()).padStart(2, '0'), ':',
            ('' + date.getSeconds()).padStart(2, '0'), ' GMT'
        ];
        return out.join('');
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
            let content: string = this.fsAccess.readFileSync('.' + url).toString('utf8');
            const nodeLikeModuleNames: Array<string> = ['@polymer', '@webcomponents', '@domderrien'];
            const needFiltering: boolean = nodeLikeModuleNames.reduce((accumulator: boolean, moduleName: string): boolean => accumulator || -1 < url.indexOf(moduleName), false);
            if (needFiltering) {
                for (let name of nodeLikeModuleNames) {
                    content = this.replaceNodeImports(url, content, name);
                }
            }
            const lastModified: Date = new Date(this.fsAccess.statSync('.' + url).mtime);
            response.set({ 'Cache-Control': 'public, immutable, max-age=' + (15 * 60), 'Last-Modified': this.toLastModifiedFormat(lastModified) }).send(content);
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

if (process.argv[1].endsWith('/dist/server/index.js')) {
    instanciateServer().start(Number(process.env.PORT || '8082'));
}