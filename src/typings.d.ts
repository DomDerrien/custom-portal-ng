// Valid in Typescript 2+, not supported in ES6
declare module "*.html" {
    const html: string;
    export default html;
}

declare module "*.json" {
    const json: string;
    export default json;
}

interface Window {
    gapi: any;
    onGoogleYoloLoad: (googleYolo: any) => Promise<any>;
}

interface Array<T> {
    totalCount: number;
}

interface FileSystemAccess {
    existsSync(path: string): boolean;
    readFileSync(path: string): Buffer;
    writeFileSync(path: string, data: any, options?: any): void;
}

interface CustomEventInit {
    composed: boolean;
}

interface ExtendableEvent extends Event {
    waitUntil(Promise): void;
}

interface FetchEvent extends Event {
    request: RequestInfo;
    respondWith(Promise): void;
}

interface IFrameElement extends HTMLElement {
    src: string;
}

interface Katex {
    renderToString(expression: string, options: any): string;
}

interface AppRouteElement extends HTMLElement {
    set(ket: string, value: any): void;
}

interface AppRoute {
    path: string;
    prefix: string;
    __queryParams: { [key: string]: string };
}

interface AppDrawerElement extends HTMLElement {
    persistent: boolean;
    close(): void;
}

interface PaperSpinnerElement extends HTMLElement {
    active: boolean;
}

interface PaperDialogElement extends HTMLElement {
    open(): void;
    close(): void;
}

interface PaperInputElement extends HTMLElement {
    value: string;
}

interface PaperToastElement extends HTMLElement {
    text: string;
    duration: number;
    show(properties?: object | string): void;
    toggle(): void;
}

interface IronAjaxElement extends HTMLElement {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    params: { [key: string]: any }
    headers: { [key: string]: any }
    body: { [key: string]: any };
    _form?: IronAjaxElement; // Redirection when the IronAjaxElement is embedded into a IronForm...
}

interface IronAjaxEvent extends CustomEvent {
    target: IronAjaxElement;
}

interface IronFormElement extends HTMLElement {
    headers: object;
    withCredentials: boolean;
    submit(event?: Event): void;
    reset(event?: Event): void;
    validate(): boolean;
}

interface IronFormEvent {
    target: {
        request: IronAjaxElement
    }
}
