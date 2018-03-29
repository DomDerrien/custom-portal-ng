import { PolymerElement } from '../../../node_modules/@polymer/polymer/polymer-element.js';

import { tmpl } from './category.tmpl.js';
import { Category as Resource } from '../model/Category.js';
import { Link as Entity } from '../model/Link.js';

export class Category extends PolymerElement {
    public static get is(): string {
        return 'portal-category';
    }

    public static get template(): HTMLTemplateElement {
        return tmpl;
    }

    public static get properties(): { [key: string]: string | object } {
        return {
            baseRepoUrl: String,
            entityIds: Object,
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
    private entityIds: Array<number>;
    private readonly entityName: string = 'Link';
    private resource: Resource;
    private resourceId: number;
    private readonly resourceName: string = 'Category';
    private sortBy: string;

    private _listenerDefs: Array<[HTMLElement, string, EventListener]>;

    public constructor() {
        super();
    }

    private _defineListeners(): Array<[HTMLElement, string, EventListener]> {
        return [
            // [this.$.editResource, 'click', (event: MouseEvent):void => {}],
            [this.$.deleteResource, 'click', (event: MouseEvent): void => {
                const ajaxElement: IronAjaxElement = <IronAjaxElement>this.$.remote;
                ajaxElement.method = 'DELETE';
                ajaxElement.url = '';
                ajaxElement.url = this.baseRepoUrl + this.resourceName + '/' + this.resourceId;
            }],
            [this.$.addEntity, 'click', (event: MouseEvent): void => {
                (<PaperDialogElement>this.$.addEntityDlg).open();
            }],
            [this.$.addEntityDlgClose, 'click', (event: MouseEvent): void => {
                (<IronFormElement>this.$.addEntityForm).reset();
                (<PaperDialogElement>this.$.addEntityDlg).close();
            }],
            [this.$.addEntityFormSubmit, 'click', (event: MouseEvent): void => {
                (<IronFormElement>this.$.addEntityForm).submit();
            }],
            [this.$.addEntityForm, 'iron-form-presubmit', function (event: MouseEvent): void {
                this.request.verbose = true;
                let body = this.request.body;
                body.categoryId = Number(body.categoryId);
            }],
            [this.$.addEntityForm, 'iron-form-response', (event: IronAjaxEvent): void => {
                (<PaperDialogElement>this.$.addEntityDlg).close();
                this._refresh();
            }],
            [this.$.addEntityForm, 'iron-form-error', (event: IronAjaxEvent): void => {
                if (event.detail.request.status === 401) {
                    (<any>this).dispatchEvent(new CustomEvent('show-dialog', { bubbles: true, composed: true, detail: { text: 'Login required!' } }));
                }
                const message: string = `Attempt to create ${this.entityName} record failed!`;
                (<any>this).dispatchEvent(new CustomEvent('show-notification', { bubbles: true, composed: true, detail: { text: message, duration: 0 } }));
            }],
            [this.$.editResource, 'click', (event: MouseEvent): void => {
                this.sortBy = this.resource.sortBy;
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
            [<any>this, 'entity-updated', (event: CustomEvent): void => { this._refresh(); }],
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

    private _refresh() {
        // TODO: place this logic in a delayed `setTimeout()` while preventing abusive refreshes...
        const ajaxElement: IronAjaxElement = <IronAjaxElement>this.$.remote;
        ajaxElement.headers['x-ids-only'] = true;
        ajaxElement.headers['x-sort-by'] = '+title';
        ajaxElement.method = 'GET';
        ajaxElement.url = '';
        ajaxElement.url = this.baseRepoUrl + this.entityName + '?' + this.resourceName.toLowerCase() + 'Id=' + this.resource.id;
    }

    private _processAjaxResponse(event: IronAjaxEvent): void {
        const requestMethod: string = (<IronAjaxElement>event.target).method;
        const requestUrl: string = (<IronAjaxElement>event.target).url;

        switch (requestMethod) {
            case 'GET': {
                if (-1 < requestUrl.indexOf(this.resourceName)) {
                    this.resource = Object.assign(new Resource(), <Resource>event.detail.response);
                    this._refresh();
                }
                else { // if (-1 < requestUrl.indexOf(this.entityName)) {
                    const entityIds: Array<number> = Array.isArray(event.detail.response) ? event.detail.response : [];
                    this.entityIds = entityIds;
                    if (entityIds.length === 0) {
                        const message: string = `No ${this.entityName} data retrieved!`;
                        (<any>this).dispatchEvent(new CustomEvent('show-notification', { bubbles: true, composed: true, detail: { text: message } }));
                    }
                }
                break;
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
                if (-1 < requestUrl.indexOf(this.resourceName)) {
                    message = `Attempt to get the ${this.resourceName} record failed!`;
                }
                else { // if (-1 < requestUrl.indexOf(this.entityName)) {
                    message = `Attempt to get the ${this.entityName} record(s) failed!`;
                }
                break;
            }
            case 'POST': {
                message = `Attempt to create the ${this.entityName} record failed!`;
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

customElements.define(Category.is, Category);