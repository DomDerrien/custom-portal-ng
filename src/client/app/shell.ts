import { PolymerElement } from '@polymer/polymer/polymer-element.js';

import { tmpl } from './shell.tmpl.js';
import { CategoryList } from '../widgets/category-list.js'; // Just imported for the type definition, used by the Typescript compiler. File will be loaded dynamically once the user is logged in.
import { User } from '../model/User.js';
import { getLoggedUser, signOut } from '../widgets/auth.js';

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

    private _listenerDefs: Array<[HTMLElement, string, EventListener]>;

    private _defineListeners(): Array<[HTMLElement, string, EventListener]> {
        return [
            [this.$.signOut, 'click', (event: MouseEvent): void => {
                signOut();
            }],
            [this.$.addEntity, 'click', (event: MouseEvent): void => {
                (<CategoryList>(<any>this.$.categoryList)).openAddDlg();
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

        getLoggedUser().
            then((loggedUser: User): any => {
                this._addEventListeners();

                if (loggedUser.picture) {
                    const image = document.createElement('img');
                    image.src = loggedUser.picture;
                    this.$.avatar.appendChild(image);
                }

                // Delayed import of the category list widget (and category item, link list, link item, etc.)
                return import('../widgets/category-list.js');
            }).
            then((module: any): void => {
                this.$.splashScreen.style.display = 'none';
                this.$.categoryList.style.display = 'grid';
                (<CategoryList>(<any>this.$.categoryList)).refresh();
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