import { html } from '../../../node_modules/@polymer/polymer/polymer-element.js';
import '../../../node_modules/@polymer/iron-ajax/iron-ajax.js';
import '../../../node_modules/@polymer/paper-dialog/paper-dialog.js';
import '../../../node_modules/@polymer/iron-form/iron-form.js';
import '../../../node_modules/@polymer/paper-input/paper-input.js';
import '../../../node_modules/@polymer/paper-button/paper-button.js';

import './link-item.js';

export let tmpl: HTMLTemplateElement = html`
    <style is="custom-style">
        #addDlg,
        #editDlg {
            min-width: calc(260px + 2 * 40px);
        }
    </style>
    
    <dom-repeat id="list" items="{{resources}}">
        <template>
            <portal-link-item resource$="{{item}}" class="item"></portal-link-item>
        </template>
    </dom-repeat>
    
    <iron-ajax id="remote" auto handle-as="json" with-credentials="true"></iron-ajax>
    
    <paper-dialog id="addDlg">
        <h2>Add a {{resourceName}}</h2>
        <iron-form id="addForm">
            <form action="{{baseRepoUrl}}{{resourceName}}" method="POST" enctype="application/json">
                <input type="hidden" name="categoryId" />
                <paper-input name="title" type="text" label="Title" auto-validate pattern=".+" required autofocus></paper-input>
                <paper-input name="href" type="text" label="URL" auto-validate pattern="[a-zA-Z0-9.\\-:/ ?=_()+]+" required></paper-input>
            </form>
        </iron-form>
        <div class="buttons">
            <paper-button id="addDlgClose">Cancel</paper-button>
            <paper-button id="addFormSubmit" raised>Add</paper-button>
        </div>
    </paper-dialog>
    
    <paper-dialog id="editDlg">
        <h2>Edit the {{resourceName}}</h2>
        <iron-form id="editForm">
            <form action="{{baseRepoUrl}}{{resourceName}}/{{activeResource.id}}" method="PUT" enctype="application/json">
                <input type="hidden" name="updated" value="{{activeResource.updated}}" />
                <paper-input name="title" type="text" label="Title" auto-validate pattern=".+" value="{{activeResource.title}}" required
                    autofocus></paper-input>
                <paper-input name="href" type="text" label="URL" auto-validate pattern="[a-zA-Z0-9.\\-:/ ?=_()+]+" value="{{activeResource.href}}"
                    required></paper-input>
                <paper-input name="faviconUrl" type="text" label="Optional favicon URL override" auto-validate pattern="[a-zA-Z0-9.\\-:/ ?=_()+]+"
                    value="{{activeResource.faviconUrl}}"></paper-input>
                <paper-input name="accessKey" type="text" label="Access Key"></paper-input>
            </form>
        </iron-form>
        <div class="buttons">
            <paper-button id="editDlgClose">Cancel</paper-button>
            <paper-button id="editFormSubmit" raised>Update</paper-button>
        </div>
    </paper-dialog>
`;
