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
            height: 38px;
        }
    
        #favicon {
            height: 16px;
            width: 16px;
            margin-right: 4px;
            vertical-align: middle;
        }
    
        #editResourceDlg {
            min-width: calc(260px + 2 * 40px);
        }
    </style>
    
    <div class="toolbar">
        <div>
            <img id="favicon" src="data:image/svg+xml;UTF-8,<svg fill='#aa0000' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M0 0h24v24H0z' fill='none'/><path d='M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z'/></svg>">
            <a href="{{resource.href}}" target="_blank">{{resource.title}}</a>
        </div>
        <paper-menu-button horizontal-align="right">
            <paper-icon-button icon="more-vert" slot="dropdown-trigger"></paper-icon-button>
            <paper-listbox slot="dropdown-content">
                <paper-item id="editResource">Edit the {{resourceName}}</paper-item>
                <paper-item id="deleteResource">Delete the {{resourceName}}</paper-item>
            </paper-listbox>
        </paper-menu-button>
        </app-toolbar>
    </div>
    
    <iron-ajax id="remote" auto handle-as="json"></iron-ajax>
    
    <paper-dialog id="editResourceDlg">
        <h2>Edit the {{resourceName}}</h2>
        <iron-form id="editResourceForm">
            <form action="{{baseRepoUrl}}{{resourceName}}/{{resource.id}}" method="PUT" enctype="application/json">
                <input type="hidden" name="updated" value="{{resource.updated}}" />
                <paper-input name="title" type="text" label="Title" auto-validate pattern=".+" value="{{resource.title}}" required autofocus></paper-input>
                <paper-input name="href" type="text" label="URL" auto-validate pattern="[a-zA-Z0-9.\\-:/ _]+" value="{{resource.href}}" required></paper-input>
                <paper-input name="faviconUrl" type="text" label="Optional favicon URL override" auto-validate pattern="[a-zA-Z0-9.\\-:/ _]+"
                    value="{{resource.faviconUrl}}"></paper-input>
            </form>
        </iron-form>
        <div class="buttons">
            <paper-button id="editResourceDlgClose">Cancel</paper-button>
            <paper-button id="editResourceFormSubmit" raised>Update</paper-button>
        </div>
    </paper-dialog>
`;
