import { PolymerElement } from '../../../node_modules/@polymer/polymer/polymer-element.js';

import { tmpl } from './link.tmpl.js';
import { Link as Resource } from '../model/Link.js';

export class Link extends PolymerElement {
    public static get is(): string {
        return 'portal-link';
    }

    public static get template(): HTMLTemplateElement {
        return tmpl;
    }

    public static get properties(): { [key: string]: string | object } {
        return {
            baseRepoUrl: String,
            resource: Object,
            resourceId: {
                type: Number,
                notify: true,
                observer: '_resourceIdChanged'
            },
        };
    }

    private $: { [key: string]: HTMLElement };

    private readonly baseRepoUrl: string = '/api/v1/';
    private resource: Resource;
    private resourceId: number;
    private readonly resourceName: string = 'Link';

    private _listenerDefs: Array<[HTMLElement, string, EventListener]>;

    public constructor() {
        super();
    }

    private _defineListeners(): Array<[HTMLElement, string, EventListener]> {
        return [
            [this.$.deleteResource, 'click', (event: MouseEvent): void => {
                const ajaxElement: IronAjaxElement = <IronAjaxElement>this.$.remote;
                ajaxElement.method = 'DELETE';
                ajaxElement.url = '';
                ajaxElement.url = this.baseRepoUrl + this.resourceName + '/' + this.resourceId;
            }],
            [this.$.editResource, 'click', (event: MouseEvent): void => {
                (<PaperDialogElement>this.$.editResourceDlg).open();
            }],
            [this.$.editResourceDlgClose, 'click', (event: MouseEvent): void => {
                (<IronFormElement>this.$.editResourceForm).reset();
                (<PaperDialogElement>this.$.editResourceDlg).close();
            }],
            [this.$.editResourceFormSubmit, 'click', (event: MouseEvent): void => {
                (<IronFormElement>this.$.editResourceForm).submit();
            }],
            [this.$.editResourceForm, 'iron-form-presubmit', function (event: MouseEvent): void {
                this.request.verbose = true;
                this.request.method = 'PUT';
                this.request.body = this.request.params;
                // No need to convert `categoryId` into a number as it will be skipped server-side (read-only field)
                if (this.request.body.faviconUrl === '') {
                    delete this.request.body.faviconUrl;
                }
                this.request.params = {};
            }],
            [this.$.editResourceForm, 'iron-form-response', (event: IronAjaxEvent): void => {
                (<PaperDialogElement>this.$.editResourceDlg).close();
            }],
            [this.$.editResourceForm, 'iron-form-error', (event: IronAjaxEvent): void => {
                if (event.detail.request.status === 401) {
                    (<any>this).dispatchEvent(new CustomEvent('show-dialog', { bubbles: true, composed: true, detail: { text: 'Login required!' } }));
                }
                const message: string = `Attempt to create ${this.resourceName} record failed!`;
                (<any>this).dispatchEvent(new CustomEvent('show-notification', { bubbles: true, composed: true, detail: { text: message, duration: 0 } }));
            }],
            [this.$.remote, 'response', this._processAjaxResponse.bind(this)],
            [this.$.remote, 'error', this._processAjaxError.bind(this)],
        ];
    }

    private _addEventListeners(): void {
        if (!this._listenerDefs) {
            this._listenerDefs = this._defineListeners();
        }

        for (let listenerDef of this._listenerDefs) {
            listenerDef[0].addEventListener(listenerDef[1], listenerDef[2]);
        }
    }

    private _removeEventListeners(): void {
        if (this._listenerDefs) {
            for (let listenerDef of this._listenerDefs) {
                listenerDef[0].removeEventListener(listenerDef[1], listenerDef[2]);
            }
        }
    }


    public connectedCallback(): void {
        super.connectedCallback();

        this._addEventListeners();
    }

    public disconnectedCallback(): void {
        super.disconnectedCallback();

        this._removeEventListeners();
    }

    public ready(): void {
        super.ready();
    }

    private _resourceIdChanged(newResourceId: number, oldResourceId: number): void {
        const ajaxElement: IronAjaxElement = <IronAjaxElement>this.$.remote;
        ajaxElement.headers['x-ids-only'] = false;
        ajaxElement.method = 'GET';
        ajaxElement.url = '';
        ajaxElement.url = this.baseRepoUrl + this.resourceName + '/' + newResourceId;
    }

    private _processAjaxResponse(event: IronAjaxEvent): void {
        const requestMethod: string = (<IronAjaxElement>event.target).method;
        const requestUrl: string = (<IronAjaxElement>event.target).url;

        switch (requestMethod) {
            case 'GET': {
                this.resource = Object.assign(new Resource(), <Resource>event.detail.response);

                // Set the favicon url
                if (this.resource.faviconUrl) {
                    (<HTMLImageElement>this.$.favicon).src = this.resource.faviconUrl;
                }
                else {
                    let domain = this.resource.href.replace(/^https?:\/\//, '').toLowerCase();
                    const slashIdx = domain.indexOf('/')
                    if (-1 < slashIdx) {
                        domain = domain.substring(0, slashIdx);
                    }
                    if (domain.indexOf('localhost') === -1 && /^[a-z\.-]+$/.test(domain)) {
                        (<HTMLImageElement>this.$.favicon).src = 'https://www.google.com/s2/favicons?domain=' + domain;
                    }
                }
            }
            case 'POST': {
                break;
            }
            case 'PUT': {
                break;
            }
            case 'DELETE': {
                (<any>this).dispatchEvent(new CustomEvent('entity-updated', { bubbles: true, composed: true }));
                break;
            }
        }
    }

    private _processAjaxError(event: IronAjaxEvent): void {
        if (event.detail.request.status === 401) {
            (<any>this).dispatchEvent(new CustomEvent('show-dialog', { bubbles: true, composed: true, detail: { text: 'Login required!' } }));
            return;
        }

        const requestMethod: string = (<IronAjaxElement>event.target).method;
        const requestUrl: string = (<IronAjaxElement>event.target).url;

        let message = null;
        switch (requestMethod) {
            case 'GET': {
                message = `Attempt to get the ${this.resourceName} record failed!`;
                break;
            }
            case 'POST': {
                break;
            }
            case 'PUT': {
                break;
            }
            case 'DELETE': {
                message = `Attempt to delete the ${this.resourceName} record failed!`;
                break;
            }
        }
        if (message) {
            (<any>this).dispatchEvent(new CustomEvent('show-notification', { bubbles: true, composed: true, detail: { text: message, duration: 0 } }));
        }
    }
}

customElements.define(Link.is, Link);