import { PolymerElement } from '../../../node_modules/@polymer/polymer/polymer-element.js';

import { tmpl } from './link-item.tmpl.js';
import { Link as Resource } from '../model/Link.js';

export class LinkItem extends PolymerElement {
    public static get is(): string {
        return 'portal-link-item';
    }

    public static get template(): HTMLTemplateElement {
        return tmpl;
    }

    public static get properties(): { [key: string]: string | object } {
        return {
            resource: Object,
            resourceId: {
                type: Number,
                notify: true,
                observer: '_resourceIdChanged'
            },
            resourceName: String,
        };
    }

    private $: { [key: string]: HTMLElement };

    private readonly baseRepoUrl: string = '/api/v1/';
    private resource: Resource;
    private resourceId: number;
    private readonly resourceName: string = 'Link';

    private _listenerDefs: Array<[HTMLElement, string, EventListener]>;

    private _defineListeners(): Array<[HTMLElement, string, EventListener]> {
        return [
            [this.$.remote, 'response', this._processAjaxResponse.bind(this)],
            [this.$.remote, 'error', this._processAjaxError.bind(this)],
            [this.$.editResource, 'click', (event: MouseEvent): void => {
                (<EventTarget>(<any>this)).dispatchEvent(new CustomEvent('edit-resource', { bubbles: true, composed: true, detail: { resource: this.resource } }));
            }],
            [this.$.deleteResource, 'click', (event: MouseEvent): void => {
                (<EventTarget>(<any>this)).dispatchEvent(new CustomEvent('delete-resource', { bubbles: true, composed: true, detail: { resource: this.resource } }));
            }],
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

    private _resourceIdChanged(id: number, oldId: number): void {
        if (id === 0) {
            return;
        }
        const ajaxElement: IronAjaxElement = <IronAjaxElement>this.$.remote;
        ajaxElement.headers['x-ids-only'] = false;
        ajaxElement.method = 'GET';
        ajaxElement.url = '';
        ajaxElement.url = this.baseRepoUrl + this.resourceName + '/' + id;
    }

    private _processAjaxResponse(event: IronAjaxEvent): void {
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

    private _processAjaxError(event: IronAjaxEvent): void {
        if (event.detail.request.status === 401) {
            (<any>this).dispatchEvent(new CustomEvent('show-dialog', { bubbles: true, composed: true, detail: { text: 'Login required!' } }));
            return;
        }

        const message: string = `Attempt to get the ${this.resourceName} record failed!`;
        (<any>this).dispatchEvent(new CustomEvent('show-notification', { bubbles: true, composed: true, detail: { text: message, duration: 0 } }));
    }
}

customElements.define(LinkItem.is, LinkItem);