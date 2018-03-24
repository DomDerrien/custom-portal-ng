import { PolymerElement } from '../../../node_modules/@polymer/polymer/polymer-element.js';

import { tmpl } from './category.tmpl.js';
import { appShell } from '../shell.js';
import { Category as Resource } from '../model/Category.js';
import { Link as Entity } from '../model/Link.js';

export class Category extends PolymerElement {
    static get is(): string {
        return 'portal-category';
    }

    static get template(): string {
        return tmpl;
    }

    static get properties(): { [key: string]: string | object } {
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
    private readonly resourceName: string = 'Category';
    private resource: Resource;
    private readonly entityName: string = 'Link';
    private entityIds: Array<number>;
    private _listenerDefs: Array<[HTMLElement, string, EventListener]>;

    constructor() {
        super();
    }

    connectedCallback(): void {
        super.connectedCallback();

        if (!this._listenerDefs) {
            this._listenerDefs = [
                [this.$.deleteResource, 'click', (event: MouseEvent): void => {
                    const ajaxElement: IronAjaxElement = <IronAjaxElement>this.$.remote;
                    ajaxElement.method = 'DELETE';
                    ajaxElement.url = '';
                    ajaxElement.url = this.baseRepoUrl + this.resourceName + '/' + this.resourceId;
                }],
                // [this.$.addEntity, 'click', (event: MouseEvent): void => { event.preventDefault(); appShell.setRoute('/acs-item-add'); }],
                // [this.$.addEntity, 'click', this._showItem.bind(this)],
                [this.$.remote, 'response', this._processAjaxResponse.bind(this)],
                [this.$.remote, 'error', (event: MouseEvent): void => {
                    appShell.showToastFeedback(`Attempt to get ${this.entityName} record from ${this.baseRepoUrl + this.entityName} failed!`, 0);
                    (<PaperDialogElement>this.$.addEntityDlg).close();
                }],
            ];
        }

        for (let listenerDef of this._listenerDefs) {
            listenerDef[0].addEventListener(listenerDef[1], listenerDef[2]);
        }
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();

        for (let listenerDef of this._listenerDefs) {
            listenerDef[0].removeEventListener(listenerDef[1], listenerDef[2]);
        }
    }

    ready(): void {
        super.ready();
    }

    _resourceIdChanged(newResourceId: number, oldResourceId: number): void {
        const ajaxElement: IronAjaxElement = <IronAjaxElement>this.$.remote;
        ajaxElement.headers['x-ids-only'] = true;
        ajaxElement.method = 'GET';
        ajaxElement.url = '';
        ajaxElement.url = this.baseRepoUrl + this.resourceName + '/' + newResourceId;
    }

    _processAjaxResponse(event: IronAjaxEvent): void {
        const requestMethod: string = (<IronAjaxElement>event.target).method;
        const requestUrl: string = (<IronAjaxElement>event.target).url;

        switch (requestMethod) {
            case 'GET': {
                if (-1 < requestUrl.indexOf(this.resourceName)) {
                    this.resource = Object.assign(new Resource(), <Resource>event.detail.response);
                }
                else { // if (-1 < requestUrl.indexOf(this.entityName)) {
                    const entityIds: Array<number> = Array.isArray(event.detail.response) ? event.detail.response : [];
                    this.entityIds = entityIds;
                    if (entityIds.length === 0) {
                        appShell.showToastFeedback(`No ${this.entityName} data retrieved!`);
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
                appShell.refresh();
                break;
            }
        }
    }
}

customElements.define(Category.is, Category);