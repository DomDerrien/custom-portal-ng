// Valid in Typescript 2+, not supported in ES6
declare module "*.html" {
    const html: string;
    export default html;
}

declare module "*.json" {
    const json: string;
    export default json;
}

interface Array<T> {
    totalCount: number;
}

interface Array<T> {
    totalCount: number;
}

interface FileSystemAccess {
    existsSync(path: string): boolean;
    readFileSync(path: string): Buffer;
    writeFileSync(path: string, data: any, options?: any): void;
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

interface IronFormElement extends HTMLElement {
    submit(): void;
}
interface IronAjaxElement extends HTMLElement {
    url: string;
}

interface IronAjaxEvent extends Event {
    detail: any;
}