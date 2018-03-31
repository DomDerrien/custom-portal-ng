import { PolymerElement } from '../../../node_modules/@polymer/polymer/polymer-element.js';

import { tmpl } from './category-item.tmpl.js';
import { LinkList } from './link-list.js';
import { Category as Resource } from '../model/Category.js';
import { Link as Entity } from '../model/Link.js';

export class CategoryItem extends PolymerElement {
    public static get is(): string {
        return 'portal-category-item';
    }

    public static get template(): HTMLTemplateElement {
        return tmpl;
    }

    public static get properties(): { [key: string]: string | object } {
        return {
            entityName: String,
            resource: Object,
            resourceId: {
                type: Number,
                notify: true,
                observer: '_resourceIdChanged'
            },
            resourceName: String,
            sortBy: String,
        };
    }

    private $: { [key: string]: HTMLElement };

    private readonly baseRepoUrl: string = '/api/v1/';
    private readonly entityName: string = 'Link';
    private resource: Resource;
    private resourceId: number;
    private readonly resourceName: string = 'Category';
    private sortBy: string;

    private _listenerDefs: Array<[HTMLElement, string, EventListener]>;

    private _defineListeners(): Array<[HTMLElement, string, EventListener]> {
        return [
            [this.$.remote, 'response', this._processAjaxResponse.bind(this)],
            [this.$.remote, 'error', this._processAjaxError.bind(this)],
            [this.$.addEntity, 'click', (event: MouseEvent): void => {
                (<LinkList>(<PolymerElement>this.$.linkList)).openAddDlg();
            }],
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
        (<LinkList>(<PolymerElement>this.$.linkList)).refresh();
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

customElements.define(CategoryItem.is, CategoryItem);