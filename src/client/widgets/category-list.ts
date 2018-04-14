import { PolymerElement } from '@polymer/polymer/polymer-element.js';

import { tmpl } from './category-list.tmpl.js';
import { Category as Resource } from '../model/Category.js';

export class CategoryList extends PolymerElement {
    public static get is(): string {
        return 'portal-category-list';
    }

    public static get template(): HTMLTemplateElement {
        return tmpl;
    }

    public static get properties(): { [key: string]: string | object } {
        return {
            resources: Array,
            resourceName: String,
            sortBy: String,
        };
    }

    private readonly baseRepoUrl: string = '/api/v1/';
    private activeResource: Resource;
    private resources: Array<Resource>;
    private readonly resourceName: string = 'Category';

    private _listenerDefs: Array<[HTMLElement, string, EventListener]>;
    private _addDialogStillLocal: boolean = true;
    private _editDialogStillLocal: boolean = true;

    private _defineListeners(): Array<[HTMLElement, string, EventListener]> {
        const ajaxSuccessHandler = this._processAjaxResponse.bind(this);
        const ajaxErrorHandler = this._processAjaxError.bind(this);
        return [
            [this.$.remote, 'response', ajaxSuccessHandler],
            [this.$.remote, 'error', ajaxErrorHandler],
            [this.$.addDlgClose, 'click', (event: MouseEvent): void => {
                (<IronFormElement>this.$.addForm).reset();
                (<PaperDialogElement>this.$.addDlg).close();
            }],
            [this.$.addFormSubmit, 'click', (event: MouseEvent): void => {
                (<IronFormElement>this.$.addForm).submit();
            }],
            [this.$.addForm, 'iron-form-presubmit', (event: IronFormEvent): void => {
                const request: IronAjaxElement = event.target.request;
                request.method = 'POST';
                request.body.positionIdx = Number(request.body.positionIdx);
            }],
            [this.$.addForm, 'iron-form-response', ajaxSuccessHandler],
            [this.$.addForm, 'iron-form-error', ajaxErrorHandler],
            [<any>this, 'edit-resource', (event: CustomEvent): void => {
                event.stopPropagation();
                this.activeResource = event.detail.resource;
                if (this._editDialogStillLocal) {
                    document.querySelector('body').appendChild(this.$.editDlg);
                    this._editDialogStillLocal = false;
                }
                (<PaperDialogElement>this.$.editDlg).open();
            }],
            [this.$.editDlgClose, 'click', (event: MouseEvent): void => {
                (<IronFormElement>this.$.editForm).reset();
                (<PaperDialogElement>this.$.editDlg).close();
            }],
            [this.$.editFormSubmit, 'click', (event: MouseEvent): void => {
                (<IronFormElement>this.$.editForm).submit();
            }],
            [this.$.editForm, 'iron-form-presubmit', (event: IronFormEvent): void => {
                const request: IronAjaxElement = event.target.request;
                request.method = 'PUT';
                request.body = request.params;
                request.body.positionIdx = Number(request.body.positionIdx);
                request.body.updated = this.activeResource.updated;
                request.params = {};
            }],
            [this.$.editForm, 'iron-form-response', ajaxSuccessHandler],
            [this.$.editForm, 'iron-form-error', ajaxErrorHandler],
            [<any>this, 'delete-resource', (event: CustomEvent): void => {
                event.stopPropagation();
                this.activeResource = event.detail.resource;
                const ajaxElement: IronAjaxElement = <IronAjaxElement>this.$.remote;
                ajaxElement.method = 'DELETE';
                ajaxElement.url = '';
                ajaxElement.url = this.baseRepoUrl + this.resourceName + '/' + this.activeResource.id;
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

    public refresh() {
        // TODO: place this logic in a delayed `setTimeout()` while preventing abusive refreshes...
        const ajaxElement: IronAjaxElement = <IronAjaxElement>this.$.remote;
        ajaxElement.headers['x-sort-by'] = '+positionIdx';
        ajaxElement.method = 'GET';
        ajaxElement.url = '';
        ajaxElement.url = this.baseRepoUrl + this.resourceName;
    }

    public openAddDlg(): void {
        if (this._addDialogStillLocal) {
            document.querySelector('body').appendChild(this.$.addDlg);
            this._addDialogStillLocal = false;
        }
        (<PaperDialogElement>this.$.addDlg).open();
    }

    private _processAjaxResponse(event: IronAjaxEvent): void {
        let requestMethod: string = event.target.method;
        if (event.type === 'iron-form-response') {
            requestMethod = event.target._form.method.toUpperCase() === 'GET' ? 'PUT' : 'POST';
        }

        switch (requestMethod) {
            case 'GET': {
                this.resources = Array.isArray(event.detail.response) ? event.detail.response : [];
                if (this.resources.length === 0) {
                    const message: string = `No ${this.resourceName} data retrieved!`;
                    (<any>this).dispatchEvent(new CustomEvent('show-notification', { bubbles: true, composed: true, detail: { text: message } }));
                }
                break;
            }
            case 'POST': {
                (<PaperDialogElement>this.$.addDlg).close();
                this.refresh();
                break;
            }
            case 'PUT': {
                (<PaperDialogElement>this.$.editDlg).close();
                const list: { items: Array<Resource> } = <any>this.$.list;
                const idx: number = list.items.indexOf(this.activeResource);
                list.items.splice(idx, 1, this.activeResource);
                list.items = list.items.slice();
                break;
            }
            case 'DELETE': {
                const list: { items: Array<Resource> } = <any>this.$.list;
                const idx: number = list.items.indexOf(this.activeResource);
                list.items.splice(idx, 1);
                list.items = list.items.slice();
                break;
            }
        }
    }

    private _processAjaxError(event: IronAjaxEvent): void {
        if (event.detail.request.status === 401) {
            (<any>this).dispatchEvent(new CustomEvent('show-dialog', { bubbles: true, composed: true, detail: { text: 'Login required!' } }));
            return;
        }

        let requestMethod: string = (<IronAjaxElement>event.target).method;
        if (event.type === 'iron-form-error') {
            requestMethod = event.target._form.method.toUpperCase() === 'GET' ? 'PUT' : 'POST';
        }
        const verbs: { [key: string]: string } = { GET: 'get', POST: 'create', PUT: 'update', DELETE: 'delete' };
        const message = `Attempt to ${verbs[requestMethod.toLowerCase()]} the ${this.resourceName} record(s) failed!`;
        (<any>this).dispatchEvent(new CustomEvent('show-notification', { bubbles: true, composed: true, detail: { text: message, duration: 0 } }));
    }
}

customElements.define(CategoryList.is, CategoryList);