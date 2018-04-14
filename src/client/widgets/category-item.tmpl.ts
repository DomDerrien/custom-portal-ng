import { html } from '@polymer/polymer/polymer-element.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/iron-icons/editor-icons.js';

import './link-list.js';

export let tmpl: HTMLTemplateElement = html`
    <style is="custom-style">
        :host {
            background-color: white;
        }
    
        :host(:hover) {
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        }
    
        .toolbar {
            --app-toolbar-font-size: 14px;
            background-color: rgba(0, 0, 0, .6);
            color: #fff;
            height: 42px;
            position: relative;
        }
    
        .floating-buttons {
            display: none;
            position: absolute;
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
    </style>
    
    <app-header fixed>
        <app-toolbar class="toolbar">
            <img src="/images/category-white.svg" height="@4" width="24" style="margin-left: -5px;" />
            <div main-title>{{resource.title}}</div>
            <div class=" floating-buttons">
                <paper-icon-button id="addEntity" title="Add a {{entityName}}" src="/images/link-add-white.svg"></paper-icon-button>
                <paper-icon-button id="editResource" icon="editor:mode-edit" title="Edit the {{resourceName}}"></paper-icon-button>
                <paper-icon-button id="deleteResource" icon="delete" title="Delete the {{resourceName}}"></paper-icon-button>
            </div>
        </app-toolbar>
    
        <div class="content">
            <portal-link-list id="linkList" class="content" category-id="{{resource.id}}"></portal-link-list>
        </div>
    </app-header>
`;