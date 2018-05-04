import { PolymerElement } from '@polymer/polymer/polymer-element.js';

import { tmpl } from './link-list.tmpl.js';
import { Link as Resource } from '../model/Link.js';

export class LinkList extends PolymerElement {
    public static get is(): string {
        return 'portal-link-list';
    }

    public static get template(): HTMLTemplateElement {
        return tmpl;
    }

    public static get properties(): { [key: string]: string | object } {
        return {
            categoryId: String,
            resources: Array,
            resourceName: String,
        };
    }

    private readonly baseRepoUrl: string = '/api/v1/';
    private categoryId: string;
    private activeResource: Resource;
    private resources: Array<Resource>;
    private readonly resourceName: string = 'Link';

    private _listenerDefs: Array<[HTMLElement, string, EventListener]>;
    private _addDialogStillLocal: boolean = true;
    private _editDialogStillLocal: boolean = true;

    private _defineListeners(): Array<[HTMLElement, string, EventListener]> {
        const ajaxSuccessHandler = this._processAjaxResponse.bind(this);
        const ajaxErrorHandler = this._processAjaxError.bind(this);
        return [
            [this.$.remote, 'response', ajaxSuccessHandler],
            [this.$.remote, 'error', ajaxErrorHandler],
            [this.$.addLinkDlgClose, 'click', (event: MouseEvent): void => {
                (<IronFormElement>this.$.addLinkForm).reset();
                (<PaperDialogElement>this.$.addLinkDlg).close();
            }],
            [this.$.addLinkFormSubmit, 'click', (event: MouseEvent): void => {
                (<IronFormElement>this.$.addLinkForm).submit();
            }],
            [this.$.addLinkForm, 'iron-form-presubmit', (event: IronFormEvent): void => {
                const request: IronAjaxElement = event.target.request;
                request.method = 'POST';
                request.body.categoryId = this.categoryId;
            }],
            [this.$.addLinkForm, 'iron-form-response', ajaxSuccessHandler],
            [this.$.addLinkForm, 'iron-form-error', ajaxErrorHandler],
            [<any>this, 'edit-resource', (event: CustomEvent): void => {
                event.stopPropagation();
                this.activeResource = event.detail.resource;
                if (this._editDialogStillLocal) {
                    document.querySelector('body').appendChild(this.$.editLinkDlg);
                    this._editDialogStillLocal = false;
                }
                (<PaperDialogElement>this.$.editLinkDlg).open();
            }],
            [this.$.editLinkDlgClose, 'click', (event: MouseEvent): void => {
                (<IronFormElement>this.$.editLinkForm).reset();
                (<PaperDialogElement>this.$.editLinkDlg).close();
            }],
            [this.$.editLinkFormSubmit, 'click', (event: MouseEvent): void => {
                (<IronFormElement>this.$.editLinkForm).submit();
            }],
            [this.$.editLinkForm, 'iron-form-presubmit', (event: IronFormEvent): void => {
                const request: IronAjaxElement = event.target.request;
                request.method = 'PUT';
                request.body = request.params;
                request.body.categoryId = this.categoryId;
                request.body.updated = this.activeResource.updated;
                if (request.body.faviconUrl === '') {
                    delete request.body.faviconUrl;
                }
                request.params = {};
            }],
            [this.$.editLinkForm, 'iron-form-response', ajaxSuccessHandler],
            [this.$.editLinkForm, 'iron-form-error', ajaxErrorHandler],
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

    public refresh(): void {
        // TODO: place this logic in a delayed `setTimeout()` while preventing abusive refreshes...
        const ajaxElement: IronAjaxElement = <IronAjaxElement>this.$.remote;
        ajaxElement.headers['x-sort-by'] = '+title'; // TODO: get that information from the parent category
        ajaxElement.method = 'GET';
        ajaxElement.url = '';
        ajaxElement.url = this.baseRepoUrl + this.resourceName + '?categoryId=' + this.categoryId;
    }

    public openAddDlg(): void {
        if (this._addDialogStillLocal) {
            document.querySelector('body').appendChild(this.$.addLinkDlg);
            this._addDialogStillLocal = false;
        }
        (<PaperDialogElement>this.$.addLinkDlg).open();
    }

    private _processAjaxResponse(event: IronAjaxEvent): void {
        let requestMethod: string = event.target.method;
        if (event.type === 'iron-form-response') {
            requestMethod = event.target._form.method.toUpperCase() === 'GET' ? 'PUT' : 'POST';
        }

        switch (requestMethod) {
            case 'GET': {
                const resources: Array<Resource> = Array.isArray(event.detail.response) ? event.detail.response : [];
                if (resources.length === 0) {
                    const message: string = `No ${this.resourceName} data retrieved!`;
                    (<any>this).dispatchEvent(new CustomEvent('show-notification', { bubbles: true, composed: true, detail: { text: message } }));
                }
                this.resources = resources;
                break;
            }
            case 'POST': {
                (<PaperDialogElement>this.$.addLinkDlg).close();
                this.refresh();
                break;
            }
            case 'PUT': {
                (<PaperDialogElement>this.$.editLinkDlg).close();
                this.refresh();
                break;
            }
            case 'DELETE': {
                this.refresh();
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

customElements.define(LinkList.is, LinkList);