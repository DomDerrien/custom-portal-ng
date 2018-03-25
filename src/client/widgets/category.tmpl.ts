import { html } from '../../../node_modules/@polymer/polymer/polymer-element.js';

import '../../node_modules/@polymer/app-layout/app-header/app-header.js';
import '../../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';
import '../../node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import '../../node_modules/@polymer/iron-icons/iron-icons.js';

import '../../node_modules/@polymer/iron-ajax/iron-ajax.js';

export let tmpl: string = html`
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
            color: white;
            height: 48px;
        }
    
        .content {
            padding: 8px 16px;
        }
    </style>
    
    <app-header fixed>
        <app-toolbar class="toolbar">
            <div main-title>{{resource.title}}</div>
            <paper-icon-button id="deleteResource" icon="delete" title="Delete the Category"></paper-icon-button>
            <paper-icon-button id="addEntity" icon="add" title="Add a Link"></paper-icon-button>
        </app-toolbar>
    </app-header>
    
    <div class="content">
        <template is="dom-repeat" items="{{entityIds}}">
            <portal-category link-id$="{{item}}" class="item"></portal-category>
        </template>
    </div>
    
    <iron-ajax id="remote" auto handle-as="json"></iron-ajax>
`;