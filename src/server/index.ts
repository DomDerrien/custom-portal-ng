import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';

import * as resources from './resource/index'; // List of all concrete BaseResource classes implementions

import { RequestHandler } from 'express';
import { OptionsJson, OptionsUrlencoded } from 'body-parser';
import { ServeStaticOptions } from 'serve-static';
import { Router } from 'express-serve-static-core';
import { BaseResource } from './resource/BaseResource';

interface ExpressBodyParser {
    json(options?: OptionsJson): RequestHandler;
    urlencoded(options?: OptionsUrlencoded): RequestHandler;
}
interface ExpressCookieParser {
    (secret?: string | string[], options?: cookieParser.CookieParseOptions): express.RequestHandler;
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

export class Server {
    private expressApp: express.Application;
    private expressBodyParser: ExpressBodyParser;
    private expressCookieParser: ExpressCookieParser;
    private expressStatic: ExpressStatic;
    private expressRouter: ExpressRouter;
    private fsAccess: FileSystemAccess;

    public constructor(app: express.Application = express(), bdParser: ExpressBodyParser = bodyParser,
        ckParser: ExpressCookieParser = cookieParser, serveStatic: ExpressStatic = express.static,
        Router: ExpressRouter = express.Router, fsAccess: FileSystemAccess = fs
    ) {
        this.expressApp = app;
        this.expressBodyParser = bdParser;
        this.expressCookieParser = ckParser;
        this.expressStatic = serveStatic;
        this.expressRouter = Router;
        this.fsAccess = fsAccess;
    }

    private clientMainPage: string;

    private getServerDirectory(): string {
        return __dirname;
    }

    private loadDependencies() {
        this.clientMainPage = this.fsAccess.readFileSync(this.getServerDirectory() + '/../../src/client/index.html').toString('utf8');
    }

    private handleCORS(request: express.Request, response: express.Response, next: express.NextFunction): any {
        response
            .header('Vary', 'Origin')
            .header('Access-Control-Allow-Origin', request.header('origin'))
            .header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Ids-Only, X-Sort-By')
            .header('Access-Control-Allow-Credentials', 'true');
        next();
    }

    private addMiddlewares() {
        this.expressApp.use(this.expressBodyParser.json());
        this.expressApp.use(this.expressBodyParser.urlencoded({ extended: false }));
        this.expressApp.use(this.expressCookieParser());
        this.expressApp.use(this.handleCORS);
        const staticOptions: ServeStaticOptions = {
            etag: true,
            immutable: true,
            index: false,
            lastModified: true,
            maxAge: 15 * 60 * 1000,
            redirect: false
        };
        const dir: string = this.getServerDirectory();
        // this.expressApp.use('/app', this.expressStatic(dir + '/../client/app', staticOptions));
        this.expressApp.use('/exception', this.expressStatic(dir + '/../client/exception', staticOptions));
        this.expressApp.use('/fonts', this.expressStatic(dir + '/../../src/client/fonts', Object.assign({}, staticOptions, { maxAge: 30000000 })));
        this.expressApp.use('/images', this.expressStatic(dir + '/../../src/client/images', Object.assign({}, staticOptions, { maxAge: 30000000 })));
        this.expressApp.use('/model', this.expressStatic(dir + '/../client/model', staticOptions));
        // this.expressApp.use('/widgets', this.expressStatic(dir + '/../client/widgets', staticOptions));
    }

    private addServerRoutes(resourceClasses: { [key: string]: typeof BaseResource } = <any>resources) {
        for (let resourceName in resourceClasses) {
            // Register the router provided by each concrete implementation of BaseResource
            this.expressApp.use(resourceClasses[resourceName].getInstance().getRouter());
        }
    }

    private replaceNodeImports(url: string, content: string, pattern: string): string {
        const importRE: RegExp = new RegExp(`(?:'|")${pattern}/`, 'g');
        if (importRE.test(content)) {
            // Identify the request elements
            // TODO: for the app files which url doesn't start by /node_modules/, count the number of folder from the root
            // TODO: the following piece of code produce paths that can go too way up which is correctly handled by browser -- however it's inelegant and must be fixed!
            let sourceFolder: string = url.substring('/node_modules/'.length);
            let slashIdx: number = sourceFolder.indexOf('/');
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

    private processNodeImportsInApp(request: express.Request, response: express.Response): void {
        const url: string = request.url;
        const filePath: string = './dist/client' + url;
        const extension: string = url.substring(url.lastIndexOf('.') + 1);
        switch (extension) {
            case 'js': response.set('Content-Type', 'application/javascript'); break;
            case 'map': response.set('Content-Type', 'application/octet-stream'); break;
            default: console.log('******* Unsupported extension', extension, 'for', url);
        }
        let content: string = this.fsAccess.readFileSync(filePath).toString('utf8');
        if (extension === 'js') {
            content = this.replaceNodeImports(url, content, '@polymer'); // Just one shortcut to process in the application files
        }
        const lastModified: Date = new Date(this.fsAccess.statSync(filePath).mtime);
        response.set({ 'Cache-Control': 'public, immutable, max-age=' + (15 * 60), 'Last-Modified': this.toLastModifiedFormat(lastModified) }).send(content);
    }

    private processNodeImportsInPolymer(request: express.Request, response: express.Response): void {
        const url: string = request.url;
        const extension: string = url.substring(url.lastIndexOf('.') + 1);
        switch (extension) {
            case 'js': response.set('Content-Type', 'application/javascript'); break;
            case 'map': response.set('Content-Type', 'application/octet-stream'); break;
            default: console.log('******* Unsupported extension', extension, 'for', url);
        }
        const filePath: string = '.' + url;
        let content: string = this.fsAccess.readFileSync(filePath).toString('utf8');
        const nodeLikeModuleNames: Array<string> = ['@polymer', '@webcomponents', '@domderrien'];
        const needFiltering: boolean = nodeLikeModuleNames.reduce((accumulator: boolean, moduleName: string): boolean => accumulator || -1 < url.indexOf(moduleName), false);
        if (needFiltering) {
            for (let name of nodeLikeModuleNames) {
                content = this.replaceNodeImports(url, content, name);
            }
        }
        const lastModified: Date = new Date(this.fsAccess.statSync(filePath).mtime);
        response.set({ 'Cache-Control': 'public, immutable, max-age=' + (15 * 60), 'Last-Modified': this.toLastModifiedFormat(lastModified) }).send(content);
    }

    private handleAnyRemainingRequest(request: express.Request, response: express.Response): void {
        response.set('Content-Type', 'text/html').send(this.clientMainPage);
    }

    private addClientRoutes() {
        const expressRouter: Router = this.expressRouter();
        const bindApp: (request: express.Request, response: express.Response) => void = this.processNodeImportsInApp.bind(this);
        const bindPolymer: (request: express.Request, response: express.Response) => void = this.processNodeImportsInPolymer.bind(this);
        this.expressApp.use(expressRouter.get(/^\/(?:app|widgets)\//, bindApp));
        this.expressApp.use(expressRouter.get('/node_modules/*', bindPolymer));
        this.expressApp.use(expressRouter.get('/*', this.handleAnyRemainingRequest.bind(this)));
    }

    public start(port: number) {
        this.loadDependencies();
        this.addMiddlewares();
        this.addServerRoutes();
        this.addClientRoutes();

        this.expressApp.listen(port);
    }
}

/* istanbul ignore if */
if (process.argv[1].endsWith('/dist/server/index.js')) {
    new Server().start(Number(process.env.PORT || '8082'));
}