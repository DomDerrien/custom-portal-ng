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
`;
