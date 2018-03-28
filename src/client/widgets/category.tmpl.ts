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
            --app-toolbar-font-size: 16px;
            background-color: rgba(0, 0, 0, .6);
            color: #fff;
            padding-right: 8px;
        }
    </style>
    
    <app-header fixed>
        <app-toolbar class="toolbar">
            <div main-title>{{resource.title}}</div>
            <paper-menu-button horizontal-align="right">
                <paper-icon-button icon="more-vert" slot="dropdown-trigger"></paper-icon-button>
                <paper-listbox slot="dropdown-content">
                    <paper-item id="addEntity">Add a {{entityName}}</paper-item>
                    <paper-item id="editResource">Edit the {{resourceName}}</paper-item>
                    <paper-item id="deleteResource">Delete the {{resourceName}}</paper-item>
                </paper-listbox>
            </paper-menu-button>
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
                <paper-input name="href" type="text" label="URL" auto-validate pattern="[a-zA-Z0-9.\\-:/ ]+" required></paper-input>
            </form>
        </iron-form>
        <div class="buttons">
            <paper-button id="addEntityDlgClose">Cancel</paper-button>
            <paper-button id="addEntityFormSubmit" raised>Add</paper-button>
        </div>
    </paper-dialog>
`;