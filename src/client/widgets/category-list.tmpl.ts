import { html } from '../../../node_modules/@polymer/polymer/polymer-element.js';
import '../../node_modules/@polymer/iron-icons/editor-icons.js';

import '../../node_modules/@polymer/iron-ajax/iron-ajax.js';

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
    
        #addDlg,
        #editDlg {
            min-width: calc(260px + 2 * 40px);
        }
    </style>
    
    <dom-repeat id="list" items="{{resourceIds}}">
        <template>
            <portal-category-item resource-id$="{{item}}" class="item"></portal-category-item>
        </template>
    </dom-repeat>
    
    <iron-ajax id="remote" auto handle-as="json" with-credentials="true"></iron-ajax>
    
    <paper-dialog id="addDlg">
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
    
    <paper-dialog id="editDlg">
        <h2>Edit the {{resourceName}}</h2>
        <iron-form id="editForm">
            <form action="{{baseRepoUrl}}{{resourceName}}/{{resource.id}}" method="PUT" enctype="application/json">
                <input type="hidden" name="updated" value="{{resource.updated}}" />
                <paper-input name="title" type="text" label="Title" auto-validate pattern="[A-Z][A-Za-z0-9ÀÉÈÊàéèêëôöüû :-]*" value="{{resource.title}}"
                    required autofocus></paper-input>
                <div style="display: grid; grid-gap: 20px; grid-template-columns: 60px 1fr;">
                    <paper-input name="positionIdx" type="number" label="Position" value="{{resource.positionIdx}}" required></paper-input>
                    <paper-dropdown-menu label="Ordering" required>
                        <paper-listbox slot="dropdown-content" class="dropdown-content" attr-for-selected="choice" selected="{{sortBy}}">
                            <paper-item choice="+title">By title, increasing</paper-item>
                            <paper-item choice="-title">By title, decreasing</paper-item>
                            <paper-item choice="+created">By date, increasing</paper-item>
                            <paper-item choice="-created">By date, decreasing</paper-item>
                        </paper-listbox>
                    </paper-dropdown-menu>
                    <input type="hidden" name="sortBy" value="{{resource.sortBy}}">
                </div>
            </form>
        </iron-form>
        <div class="buttons">
            <paper-button id="editDlgClose">Cancel</paper-button>
            <paper-button id="editFormSubmit" raised>Update</paper-button>
        </div>
    </paper-dialog>
`;
