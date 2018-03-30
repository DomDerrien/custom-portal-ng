import { html } from '../../../node_modules/@polymer/polymer/polymer-element.js';

import '../../node_modules/@polymer/app-layout/app-header/app-header.js';
import '../../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';
import '../../node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import '../../node_modules/@polymer/iron-icons/iron-icons.js';
import '../../node_modules/@polymer/iron-icons/editor-icons.js';

import '../../node_modules/@polymer/iron-ajax/iron-ajax.js';

import './link.js';

export let tmpl: HTMLTemplateElement = html`
    <style is="custom-style">
        :host {
            background-color: white;
        }
    
        :host(:hover) {
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        }
    
        .toolbar {
            @apply --layout-horizontal;
            @apply --layout-end-justified;
            --app-toolbar-font-size: 14px;
            background-color: rgba(0, 0, 0, .6);
            color: #fff;
            height: 42px;
            position: relative;
        }
    
        .floating-buttons {
            display: block;
            position: absolute;
            z-index: 104;
            right: 8px;
        }
    
        app-header:hover .floating-buttons {
            display: block;
        }
    
        paper-icon-button {
            width: 28px;
            height: 28px;
            padding: 4px;
        }
    
        #addEntityDlg,
        #editResourceDlg {
            min-width: calc(260px + 2 * 40px);
        }
    </style>
    
    <app-header fixed>
        <app-toolbar class="toolbar">
            <img src="/images/category-white.svg" height="@4" width="24" style="margin-left: -5px;" />
            <div main-title>{{resource.title}}</div>
            <div class=" floating-buttons">
                <paper-icon-button id="addEntity" title="Add a {{entityName}}" src="/images/link-add-white.svg"></paper-icon-button>
                <paper-icon-button id="openAll" icon="open-in-new" title="Open all {{entityName}}s"></paper-icon-button>
                <paper-icon-button id="editResource" icon="editor:mode-edit" title="Edit the {{resourceName}}"></paper-icon-button>
                <paper-icon-button id="deleteResource" icon="delete" title="Delete the {{resourceName}}"></paper-icon-button>
            </div>
        </app-toolbar>
    </app-header>
    
    <div class="content">
        <template is="dom-repeat" items="{{entityIds}}">
            <portal-link resource-id$="{{item}}" class="item"></portal-link>
        </template>
    </div>
    
    <iron-ajax id="remote" auto handle-as="json"></iron-ajax>
    
    <paper-dialog id="addEntityDlg">
        <h2>Add a {{entityName}}</h2>
        <iron-form id="addEntityForm">
            <form action="{{baseRepoUrl}}{{entityName}}" method="POST" enctype="application/json">
                <input type="hidden" name="categoryId" value="{{resource.id}}" />
                <paper-input name="title" type="text" label="Title" auto-validate pattern=".+" required autofocus></paper-input>
                <paper-input name="href" type="text" label="URL" auto-validate pattern="[a-zA-Z0-9.\\-:/ _]+" required></paper-input>
            </form>
        </iron-form>
        <div class="buttons">
            <paper-button id="addEntityDlgClose">Cancel</paper-button>
            <paper-button id="addEntityFormSubmit" raised>Add</paper-button>
        </div>
    </paper-dialog>
    
    <paper-dialog id="editResourceDlg">
        <h2>Edit the {{resourceName}}</h2>
        <iron-form id="editResourceForm">
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
            <paper-button id="editResourceDlgClose">Cancel</paper-button>
            <paper-button id="editResourceFormSubmit" raised>Update</paper-button>
        </div>
    </paper-dialog>
`;