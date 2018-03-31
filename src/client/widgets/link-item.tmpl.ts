import { html } from '../../../node_modules/@polymer/polymer/polymer-element.js';
import '../../node_modules/@polymer/iron-icons/editor-icons.js';

import '../../node_modules/@polymer/iron-ajax/iron-ajax.js';

export let tmpl: HTMLTemplateElement = html`
    <style is="custom-style">
        .toolbar {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            align-items: center;
            padding-left: 16px;
            padding-right: 8px;
            height: 38px;
            position: relative;
        }
    
        .floating-buttons {
            display: none;
            position: absolute;
            z-index: 104;
            right: 0;
        }
    
        .toolbar:hover .floating-buttons {
            display: block;
        }
    
        paper-icon-button {
            width: 28px;
            height: 28px;
            padding: 4px;
        }
    
        #favicon {
            height: 16px;
            width: 16px;
            margin-right: 4px;
            vertical-align: middle;
        }
    </style>
    
    <div class="toolbar">
        <div>
            <img id="favicon" src="/images/link-black.svg" height="24" width="24">
            <a href="{{resource.href}}" target="_blank">{{resource.title}}</a>
        </div>
        <div class="floating-buttons">
            <paper-icon-button id="editResource" icon="editor:mode-edit" title="Edit the {{resourceName}}"></paper-icon-button>
            <paper-icon-button id="deleteResource" icon="delete" title="Delete the {{resourceName}}"></paper-icon-button>
        </div>
    </div>
    
    <iron-ajax id="remote" auto handle-as="json" with-credentials="true"></iron-ajax>
`;