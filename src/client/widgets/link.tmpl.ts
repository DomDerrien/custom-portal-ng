import { html } from '../../../node_modules/@polymer/polymer/polymer-element.js';

import '../../node_modules/@polymer/iron-ajax/iron-ajax.js';

export let tmpl: HTMLTemplateElement = html`
    <style is="custom-style">
        .toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-left: 16px;
            padding-right: 8px;
        }
    </style>
    
    <div class="toolbar">
        <a href="{{resource.href}}" target="_blank">{{resource.title}}</a>
        <paper-menu-button horizontal-align="right">
            <paper-icon-button icon="more-vert" slot="dropdown-trigger"></paper-icon-button>
            <paper-listbox slot="dropdown-content">
                <paper-item id="editResource">Edit the {{resourceName}}</paper-item>
                <paper-item id="deleteResource">Delete the {{resourceName}}</paper-item>
            </paper-listbox>
        </paper-menu-button>
        </app-toolbar>
    
    </div>
    
    <iron-ajax id="remote" auto handle-as="json"> </iron-ajax>
    
    <paper-dialog id="editResourceDlg">
        <h2>Edit the {{resourceName}}</h2>
        <iron-form id="editResourceForm">
            <form action="{{baseRepoUrl}}{{resourceName}}/{{resource.id}}" method="PUT" enctype="application/json">
                <input type="hidden" name="updated" value="{{resource.updated}}" />
                <paper-input name="title" type="text" label="Title" auto-validate pattern=".+" value="{{resource.title}}" required autofocus></paper-input>
                <paper-input name="href" type="text" label="URL" auto-validate pattern="[a-zA-Z0-9.\\-:/ ]+" value="{{resource.href}}" required></paper-input>
            </form>
        </iron-form>
        <div class="buttons">
            <paper-button id="editResourceDlgClose">Cancel</paper-button>
            <paper-button id="editResourceFormSubmit" raised>Update</paper-button>
        </div>
    </paper-dialog>
`;
