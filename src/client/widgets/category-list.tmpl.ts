import { html } from '@polymer/polymer/polymer-element.js';
import '@polymer/iron-ajax/iron-ajax.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/iron-form/iron-form.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-button/paper-button.js';

import './category-item.js';

export let tmpl: HTMLTemplateElement = html`
    <style is="custom-style">
        :host {
            display: grid;
            padding: 20px;
            grid-gap: 20px;
            grid-template-columns: repeat(4, 1fr);
            grid-auto-rows: minmax(100px, auto);
        }
    
        :host>.item {
            min-width: 260px;
        }
    
        @media (max-width: 2200px) {
            :host {
                grid-template-columns: repeat(5, 1fr);
            }
        }
    
        @media (max-width: 1800px) {
            :host {
                grid-template-columns: repeat(4, 1fr);
            }
        }
    
        @media (max-width: 1400px) {
            :host {
                grid-template-columns: repeat(3, 1fr);
            }
        }
    
        @media (max-width: 1000px) {
            :host {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    
        @media (max-width: 600px) {
            :host {
                grid-template-columns: repeat(1, 1fr);
            }
        }
    </style>
    
    <dom-repeat id="list" items="{{resources}}">
        <template>
            <portal-category-item resource$="{{item}}" class="item"></portal-category-item>
        </template>
    </dom-repeat>
    
    <iron-ajax id="remote" auto handle-as="json" with-credentials="true"></iron-ajax>
    
    <paper-dialog id="addDlg" modal role="alertdialog">
        <h2>Add a {{resourceName}}</h2>
        <iron-form id="addForm">
            <form action="{{baseRepoUrl}}{{resourceName}}" method="POST" enctype="application/json">
                <paper-input name="title" type="text" label="Title" auto-validate pattern="[A-Z][A-Za-z0-9ÀÉÈÊàéèêëôöüû :-]*" required autofocus></paper-input>
                <div style="display: grid; grid-gap: 20px; grid-template-columns: 60px 1fr;">
                    <paper-input name="positionIdx" type="number" label="Position" value="0" required></paper-input>
                    <paper-dropdown-menu label="Ordering" required>
                        <paper-listbox slot="dropdown-content" class="dropdown-content" attr-for-selected="choice" selected="{{sortBy}}">
                            <paper-item choice="+title">By title, increasing</paper-item>
                            <paper-item choice="-title">By title, decreasing</paper-item>
                            <paper-item choice="+created">By date, increasing</paper-item>
                            <paper-item choice="-created">By date, decreasing</paper-item>
                        </paper-listbox>
                    </paper-dropdown-menu>
                    <input type="hidden" name="sortBy" value="{{sortBy}}">
                </div>
            </form>
        </iron-form>
        <div class="buttons">
            <paper-button id="addDlgClose">Cancel</paper-button>
            <paper-button id="addFormSubmit" raised>Add</paper-button>
        </div>
    </paper-dialog>
    
    <paper-dialog id="editDlg" modal role="alertdialog">
        <h2>Edit the {{resourceName}}</h2>
        <iron-form id="editForm">
            <form action="{{baseRepoUrl}}{{resourceName}}/{{activeResource.id}}" method="PUT" enctype="application/json">
                <input type="hidden" name="updated" value="{{activeResource.updated}}" />
                <paper-input name="title" type="text" label="Title" auto-validate pattern="[A-Z][A-Za-z0-9ÀÉÈÊàéèêëôöüû :-]*" value="{{activeResource.title}}"
                    required autofocus></paper-input>
                <div style="display: grid; grid-gap: 20px; grid-template-columns: 60px 1fr;">
                    <paper-input name="positionIdx" type="number" label="Position" value="{{activeResource.positionIdx}}" required></paper-input>
                    <paper-dropdown-menu label="Ordering" required>
                        <paper-listbox slot="dropdown-content" class="dropdown-content" attr-for-selected="choice" selected="{{sortBy}}">
                            <paper-item choice="+title">By title, increasing</paper-item>
                            <paper-item choice="-title">By title, decreasing</paper-item>
                            <paper-item choice="+created">By date, increasing</paper-item>
                            <paper-item choice="-created">By date, decreasing</paper-item>
                        </paper-listbox>
                    </paper-dropdown-menu>
                    <input type="hidden" name="sortBy" value="{{activeResource.sortBy}}">
                </div>
            </form>
        </iron-form>
        <div class="buttons">
            <paper-button id="editDlgClose">Cancel</paper-button>
            <paper-button id="editFormSubmit" raised>Update</paper-button>
        </div>
    </paper-dialog>
`;
