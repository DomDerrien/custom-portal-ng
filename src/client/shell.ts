import { PolymerElement } from '../../node_modules/@polymer/polymer/polymer-element.js';

import './widgets/category.js';
import { tmpl } from './shell.tmpl.js';
import { User } from './model/User.js';
import { Category as Entity } from './model/Category.js';
import { getLoggedUser, signOut } from './widgets/auth.js';

export class Shell extends PolymerElement {
    public static get is(): string {
        return 'portal-shell';
    }

    public static get template(): HTMLTemplateElement {
        return tmpl;
    }

    public static get properties(): { [key: string]: string | object } {
        return {
            entityIds: Object,
            entityName: String,
            baseRepoUrl: String
        };
    }

    private $: { [key: string]: HTMLElement };

    private entityIds: Array<number>;
    private readonly baseRepoUrl: string = '/api/v1/';
    private readonly entityName: string = 'Category';

    private _listenerDefs: Array<[HTMLElement, string, EventListener]>;
    private _specialListenerDefs: Array<[HTMLElement, string, EventListener]>;

    public constructor() {
        super();
    }

    private _defineListeners(): Array<[HTMLElement, string, EventListener]> {
        return [
            [this.$.signOut, 'click', (event: MouseEvent): void => {
                signOut();
            }],
            [this.$.refreshShell, 'click', (event: MouseEvent): void => {
                this._refresh();
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
                this._refresh();
            }],
            [this.$.addEntityForm, 'iron-form-error', (event: IronAjaxEvent): void => {
                if (event.detail.request.status === 401) {
                    this._showDialogFeedback('Login required!');
                    return;
                }
                this._showToastFeedback(`Attempt to create ${this.entityName} record failed!`, 0);
            }],
            [this.$.remote, 'response', (event: IronAjaxEvent): void => {
                let entityIds: Array<number> = Array.isArray(event.detail.response) ? event.detail.response : [];
                this.entityIds = entityIds;
                if (entityIds.length === 0) {
                    this._showToastFeedback(`No ${this.entityName} data retrieved!`);
                }
            }],
            [this.$.remote, 'error', (event: IronAjaxEvent): void => {
                if (event.detail.request.status === 401) {
                    this._showDialogFeedback('Login required!');
                    return;
                }
                this._showToastFeedback(`Attempt to get ${this.entityName} record failed!`, 0);
            }],
            [<any>this, 'entity-updated', (event: CustomEvent): void => { this._refresh(); }],
            [<any>this, 'show-dialog', (event: CustomEvent): void => { this._showDialogFeedback(event.detail.text); }],
            [<any>this, 'show-notification', (event: CustomEvent): void => { this._showToastFeedback(event.detail.text, event.detail.duration); }],
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
        for (let listenerDef of this._specialListenerDefs) {
            listenerDef[0].removeEventListener(listenerDef[1], listenerDef[2]);
        }
    }

    public connectedCallback(): void {
        super.connectedCallback();

        // Most of event listeners attachment delayed until the user successful login

        // Simple attachement of the special event listeners
        if (!this._specialListenerDefs) {
            this._specialListenerDefs = [
                [<any>this, 'show-dialog', (event: CustomEvent): void => { this._showDialogFeedback(event.detail.text); }],
                [<any>this, 'show-notification', (event: CustomEvent): void => { this._showToastFeedback(event.detail.text, event.detail.duration); }],
            ];
        }

        for (let listenerDef of this._specialListenerDefs) {
            console.log('*****', listenerDef[1]);
            listenerDef[0].addEventListener(listenerDef[1], listenerDef[2]);
        }
    }

    public disconnectedCallback(): void {
        super.disconnectedCallback();

        this._removeEventListeners();
    }

    public ready(): void {
        super.ready();

        getLoggedUser().then((loggedUser: User): void => {
            this._addEventListeners();

            (<IronFormElement>this.$.addEntityForm).withCredentials = true;
            this.$.initialMessage.style.display = 'none';
            this.$.entityGrid.style.display = 'grid';

            this._refresh();
        });
    }

    private _refresh() {
        // TODO: place this logic in a delayed `setTimeout()` while preventing abusive refreshes...
        const ajaxElement: IronAjaxElement = <IronAjaxElement>this.$.remote;
        ajaxElement.headers['x-ids-only'] = true;
        ajaxElement.method = 'GET';
        ajaxElement.url = '';
        ajaxElement.url = this.baseRepoUrl + this.entityName;
    }

    private _showToastFeedback(text: string, duration: number = 3000): void {
        let element: PaperToastElement = <PaperToastElement>this.$.toastFeedback;
        element.text = text;
        if (element.duration !== duration) {
            element.duration = duration;
            (<HTMLElement>element.children[0]).style.display = duration === 0 ? 'inline' : 'none';
        }
        element.show();
    }

    private _showDialogFeedback(text: string): void {
        if (text) {
            let element: PaperDialogElement = <PaperDialogElement>this.$.dialogFeedback;
            element.querySelector('.message').innerHTML = text;
            element.open();
        }
    }
}

customElements.define(Shell.is, Shell);