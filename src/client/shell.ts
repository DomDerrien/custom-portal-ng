import { Element as PolymerElement } from '../../node_modules/@polymer/polymer/polymer-element.js';

import './widgets/category.js';
import { tmpl } from './shell.tmpl.js';
import { Category as Entity } from './model/Category.js';

export let appShell: Shell;

export class Shell extends PolymerElement {
    static get is(): string {
        return 'portal-shell';
    }

    static get template(): string {
        return tmpl;
    }

    static get properties(): { [key: string]: string | object } {
        return {
            sortBy: String,
            entities: Object,
            entityName: String,
            baseRepoUrl: String
        };
    }

    private $: { [key: string]: HTMLElement };

    private sortBy: string = '+title'; // Default attribute for sorting
    private readonly baseRepoUrl: string = '/api/v1/';
    private readonly entityName: string = 'Category';
    private entities: Array<Entity>;

    private _listenerDefs: Array<[HTMLElement, string, EventListener]>;

    constructor() {
        super();
        appShell = this;
    }

    connectedCallback(): void {
        super.connectedCallback();

        if (!this._listenerDefs) {
            this._listenerDefs = [
                [this.$.refreshShell, 'click', (event: MouseEvent): void => {
                    this.refresh();
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
                    body.positionIdx = Number(body.positionIdx);
                }],
                [this.$.addEntityForm, 'iron-form-response', (event: IronAjaxEvent): void => {
                    (<PaperDialogElement>this.$.addEntityDlg).close();
                    this.refresh();
                }],
                [this.$.addEntityForm, 'iron-form-error', (event: IronAjaxEvent): void => {
                    appShell.showToastFeedback(`Attempt to create ${this.entityName} record from ${this.baseRepoUrl + this.entityName} failed!`, 0);
                    (<PaperDialogElement>this.$.addEntityDlg).close();
                }],
                [this.$.remote, 'response', (event: IronAjaxEvent): void => {
                    // TODO: adapt to process only identifiers when the request gets the entity identifiers only
                    let entities: Array<Entity> = Array.isArray(event.detail.response) ? event.detail.response : [];
                    this.entities = entities;
                    if (entities.length === 0) {
                        appShell.showToastFeedback(`No ${this.entityName} data retrieved!`);
                    }
                }],
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

        (<IronFormElement>this.$.addEntityForm).withCredentials = true;
        this.refresh();
    }

    refresh() {
        // TODO: place this logic in a delayed `setTimeout()` while preventing abusive refreshes...
        const ajaxElement: IronAjaxElement = <IronAjaxElement>this.$.remote;
        ajaxElement.method = 'GET';
        ajaxElement.url = '';
        ajaxElement.url = this.baseRepoUrl + this.entityName;
        // TODO: issue the request to get the entity identifiers only
    }

    showToastFeedback(text: string, duration: number = 3000): void {
        let element: PaperToastElement = <PaperToastElement>this.$.toastFeedback;
        element.text = text;
        if (element.duration !== duration) {
            element.duration = duration;
            (<HTMLElement>element.children[0]).style.display = duration === 0 ? 'inline' : 'none';
        }
        element.show();
    }

    showDialogFeedback(text: string): void {
        if (text) {
            let element: PaperDialogElement = <PaperDialogElement>this.$.dialogFeedback;
            element.querySelector('.message').innerHTML = text;
            element.open();
        }
    }
}

customElements.define(Shell.is, Shell);