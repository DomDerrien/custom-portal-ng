import { PolymerElement } from '@polymer/polymer/polymer-element.js';

import { tmpl } from './category-item.tmpl.js';
import { LinkList } from './link-list.js';
import { Category as Resource } from '../model/Category.js';

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
            resource: {
                type: Object,
                notify: true,
                observer: '_resourceChanged'
            },
            resourceName: String,
            sortBy: String,
        };
    }

    private resource: Resource;

    private _listenerDefs: Array<[HTMLElement, string, EventListener]>;

    private _defineListeners(): Array<[HTMLElement, string, EventListener]> {
        return [
            [this.$.addEntity, 'click', (event: MouseEvent): void => {
                (<LinkList>(<any>this.$.linkList)).openAddDlg();
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

    protected _resourceChanged(entity: Resource, oldEntity: Resource): void {
        (<LinkList>(<any>this.$.linkList)).refresh();
    }
}

customElements.define(CategoryItem.is, CategoryItem);