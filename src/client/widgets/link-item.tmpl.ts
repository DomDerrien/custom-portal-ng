import { html } from '../../../node_modules/@polymer/polymer/polymer-element.js';
import '../../../node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import '../../../node_modules/@polymer/iron-icons/iron-icons.js';
import '../../../node_modules/@polymer/iron-icons/editor-icons.js';

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
    
        .toolbar>.link {
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
        }
    
        .floating-buttons {
            display: none;
            position: absolute;
            right: 0;
            padding-left: 10px;
            background-color: rgba(255, 255, 255, 0.8);
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
        <div class="link">
            <img id="favicon" src="/images/link-black.svg" height="24" width="24">
            <a href="{{resource.href}}" target="_blank">{{resource.title}}</a>
        </div>
        <div class="floating-buttons">
            <paper-icon-button id="editResource" icon="editor:mode-edit" title="Edit the {{resourceName}}"></paper-icon-button>
            <paper-icon-button id="deleteResource" icon="delete" title="Delete the {{resourceName}}"></paper-icon-button>
        </div>
    </div>
`;