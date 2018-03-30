import { html } from '../../node_modules/@polymer/polymer/polymer-element.js';

import '../../node_modules/@polymer/app-layout/app-header-layout/app-header-layout.js';
import '../../node_modules/@polymer/app-layout/app-header/app-header.js';
import '../../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';
import '../../node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import '../../node_modules/@polymer/paper-input/paper-input.js';
import '../../node_modules/@polymer/paper-button/paper-button.js';
import '../../node_modules/@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '../../node_modules/@polymer/paper-listbox/paper-listbox.js';
import '../../node_modules/@polymer/paper-item/paper-item.js';
import '../../node_modules/@polymer/neon-animation/neon-animations.js';
import '../../node_modules/@polymer/iron-form/iron-form.js';
import '../../node_modules/@polymer/iron-icons/iron-icons.js';

import '../../node_modules/@polymer/iron-ajax/iron-ajax.js';

import '../node_modules/@polymer/paper-toast/paper-toast.js';
import '../node_modules/@polymer/paper-dialog/paper-dialog.js';

import './widgets/auth.js';
import './widgets/category.js';

export let tmpl: HTMLTemplateElement = html`
    <style is="custom-style">
        .toolbar {
            @apply --layout-horizontal;
            @apply --layout-end-justified;
            background-color: black;
            color: white;
        }
    
        #avatar>img {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-left: 8px;
        }
    
        #initialMessage {
            display: flex;
            height: 100vh;
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
            text-align: center;
        }
    
        .grid {
            display: grid;
            padding: 20px;
            grid-gap: 20px;
            grid-template-columns: repeat(4, 1fr);
            grid-auto-rows: minmax(100px, auto);
        }
    
        .grid>.item {
            min-width: 260px;
        }
    
        @media (max-width: 2200px) {
            .grid {
                grid-template-columns: repeat(5, 1fr);
            }
        }
    
        @media (max-width: 1800px) {
            .grid {
                grid-template-columns: repeat(4, 1fr);
            }
        }
    
        @media (max-width: 1400px) {
            .grid {
                grid-template-columns: repeat(3, 1fr);
            }
        }
    
        @media (max-width: 1000px) {
            .grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    
        @media (max-width: 600px) {
            .grid {
                grid-template-columns: repeat(1, 1fr);
            }
        }
    
        #addEntityDlg {
            min-width: calc(260px + 2 * 40px);
        }
    </style>
    
    <app-header-layout has-scrolling-region fullbleed>
        <app-header fixed>
            <app-toolbar class="toolbar">
                <div main-title>Custom Portal v2</div>
                <paper-icon-button id="addEntity" src="/images/category-add-white.svg" title="Add a {{entityName}}"></paper-icon-button>
                <paper-icon-button id="signOut" src="/images/logout-white.svg" title="Sign out"></paper-icon-button>
                <div id="avatar"></div>
            </app-toolbar>
        </app-header>
    
    
        <div id="initialMessage">
            <div>
                <div>The Portal waits for your successful login.</div>
                <portal-auth></portal-auth>
            </div>
        </div>
        <div id="entityGrid" class="grid" style="display: none;">
            <template is="dom-repeat" items="{{entityIds}}">
                <portal-category resource-id$="{{item}}" class="item"></portal-category>
            </template>
        </div>
    </app-header-layout>
    
    <iron-ajax id="remote" auto handle-as="json"></iron-ajax>
    
    <paper-toast id="toastFeedback">
        <paper-button id="toastFeedbackClose" style="color: white; display: none">Close now!</paper-button>
    </paper-toast>
    
    <paper-dialog id="dialogFeedback">
        <h2>Information</h2>
        <p class="message"></p>
        <div class="buttons">
            <paper-button dialog-confirm autofocus>OK</paper-button>
        </div>
    </paper-dialog>
    
    <paper-dialog id="addEntityDlg">
        <h2>Add a {{entityName}}</h2>
        <iron-form id="addEntityForm">
            <form action="{{baseRepoUrl}}{{entityName}}" method="POST" enctype="application/json">
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
            <paper-button id="addEntityDlgClose">Cancel</paper-button>
            <paper-button id="addEntityFormSubmit" raised>Add</paper-button>
        </div>
    </paper-dialog>
`;