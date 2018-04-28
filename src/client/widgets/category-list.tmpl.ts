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
            padding: 1rem;
            grid-gap: 1rem;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            grid-auto-rows: minmax(100px, auto);
        }
    
        :host>.item {
            min-width: 260px;
        }
    </style>
    
    <dom-repeat id="list" items="{{resources}}">
        <template>
            <portal-category-item resource$="{{item}}" class="item"></portal-category-item>
        </template>
    </dom-repeat>
    
    <iron-ajax id="remote" auto handle-as="json" with-credentials="true"></iron-ajax>
    
    <paper-dialog id="addCategoryDlg" modal role="alertdialog">
        <h2>Add a {{resourceName}}</h2>
        <iron-form id="addCategoryForm">
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
            <paper-button id="addCategoryDlgClose">Cancel</paper-button>
            <paper-button id="addCategoryFormSubmit" raised>Add</paper-button>
        </div>
    </paper-dialog>
    
    <paper-dialog id="editCategoryDlg" modal role="alertdialog">
        <h2>Edit the {{resourceName}}</h2>
        <iron-form id="editCategoryForm">
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
            <paper-button id="editCategoryDlgClose">Cancel</paper-button>
            <paper-button id="editCategoryFormSubmit" raised>Update</paper-button>
        </div>
    </paper-dialog>
`;
