import { PolymerElement } from '../../node_modules/@polymer/polymer/polymer-element.js';

import { CategoryList } from './widgets/category-list.js';
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
        };
    }

    private $: { [key: string]: HTMLElement };

    private _listenerDefs: Array<[HTMLElement, string, EventListener]>;

    private _defineListeners(): Array<[HTMLElement, string, EventListener]> {
        return [
            [this.$.signOut, 'click', (event: MouseEvent): void => {
                signOut();
            }],
            [this.$.addEntity, 'click', (event: MouseEvent): void => {
                (<CategoryList>(<PolymerElement>this.$.categoryList)).openAddDlg();
            }],
            [<any>this, 'show-dialog', (event: CustomEvent): void => { event.stopPropagation(); this._showDialogFeedback(event.detail.text); }],
            [<any>this, 'show-notification', (event: CustomEvent): void => { event.stopPropagation(); this._showToastFeedback(event.detail.text, event.detail.duration); }],
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
        for (let listenerDef of this._listenerDefs) {
            listenerDef[0].removeEventListener(listenerDef[1], listenerDef[2]);
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

        getLoggedUser().then((loggedUser: User): void => {
            this._addEventListeners();

            this.$.splashScreen.style.display = 'none';
            this.$.categoryList.style.display = 'grid';
            (<CategoryList>(<PolymerElement>this.$.categoryList)).refresh();

            if (loggedUser.picture) {
                const image = document.createElement('img');
                image.src = loggedUser.picture;
                this.$.avatar.appendChild(image);
            }
        });
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