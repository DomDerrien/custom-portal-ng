import { PolymerElement } from '@polymer/polymer/polymer-element.js';

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
            resource: {
                type: Object,
                notify: true,
                observer: '_resourceChanged'
            },
            resourceName: String,
        };
    }

    private resource: Resource;

    private _listenerDefs: Array<[HTMLElement, string, EventListener]>;

    private _defineListeners(): Array<[HTMLElement, string, EventListener]> {
        return [
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

    protected _resourceChanged(entity: Resource, oldEntity: Resource): void {
        // Set the favicon url
        if (this.resource.faviconDataUri) {
            (<HTMLImageElement>this.$.favicon).src = this.resource.faviconDataUri;
        }
        else if (this.resource.faviconUrl) {
            (<HTMLImageElement>this.$.favicon).src = this.resource.faviconUrl;
        }
        else if (this.resource.href) {
            let domain = this.resource.href.replace(/^https?:\/\//, '').toLowerCase();
            const slashIdx = domain.indexOf('/')
            if (-1 < slashIdx) {
                domain = domain.substring(0, slashIdx);
            }
            if (domain.indexOf('localhost') === -1 && /^[a-z\.-]+$/.test(domain)) {
                this.resource.faviconUrl = 'https://www.google.com/s2/favicons?domain=' + domain;
                (<HTMLImageElement>this.$.favicon).src = this.resource.faviconUrl;
            }
        }
    }
}

customElements.define(LinkItem.is, LinkItem);