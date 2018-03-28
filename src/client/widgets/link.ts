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
            resourceId: {
                type: Number,
                notify: true,
                observer: '_resourceIdChanged'
            },
            resource: Object,
            entityIds: Object,
            repositoryUrl: String
        };
    }

    private $: { [key: string]: HTMLElement };

    private resourceId: number;
    private readonly baseRepoUrl: string = '/api/v1/';
    private readonly resourceName: string = 'Link';
    private resource: Resource;
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