import { html } from '@polymer/polymer/polymer-element.js';
import '@polymer/iron-ajax/iron-ajax.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/iron-form/iron-form.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-button/paper-button.js';

import './link-item.js';

export let tmpl: HTMLTemplateElement = html`
    <dom-repeat id="list" items="{{resources}}">
        <template>
            <portal-link-item resource$="{{item}}" class="item"></portal-link-item>
        </template>
    </dom-repeat>
    
    <iron-ajax id="remote" auto handle-as="json" with-credentials="true"></iron-ajax>
    
    <paper-dialog id="addLinkDlg" modal role="alertdialog">
        <h2>Add a {{resourceName}}</h2>
        <iron-form id="addLinkForm">
            <form action="{{baseRepoUrl}}{{resourceName}}" method="POST" enctype="application/json">
                <input type="hidden" name="categoryId" />
                <paper-input name="title" type="text" label="Title" auto-validate pattern=".+" required autofocus></paper-input>
                <paper-input name="href" type="text" label="URL" auto-validate pattern="[a-zA-Z0-9.\\-:/ ?=_()+]+" required></paper-input>
            </form>
        </iron-form>
        <div class="buttons">
            <paper-button id="addLinkDlgClose">Cancel</paper-button>
            <paper-button id="addLinkFormSubmit" raised>Add</paper-button>
        </div>
    </paper-dialog>
    
    <paper-dialog id="editLinkDlg" modal role="alertdialog">
        <h2>Edit the {{resourceName}}</h2>
        <iron-form id="editLinkForm">
            <form action="{{baseRepoUrl}}{{resourceName}}/{{activeResource.id}}" method="PUT" enctype="application/json">
                <input type="hidden" name="updated" value="{{activeResource.updated}}" />
                <paper-input name="title" type="text" label="Title" auto-validate pattern=".+" value="{{activeResource.title}}" required
                    autofocus></paper-input>
                <paper-input name="href" type="text" label="URL" auto-validate pattern="[a-zA-Z0-9.\\-:/ ?=_()+]+" value="{{activeResource.href}}"
                    required></paper-input>
                <paper-input name="faviconUrl" type="text" label="Optional favicon URL override" auto-validate pattern="[a-zA-Z0-9.\\-:/ ?=_()+]+"
                    value="{{activeResource.faviconUrl}}"></paper-input>
                <paper-input name="faviconDataUri" type="text" label="Optional favicon Data URI" value="{{activeResource.faviconDataUri}}"></paper-input>
                <paper-input name="accessKey" type="text" label="Access Key" value="{{activeResource.accessKey}}"></paper-input>
            </form>
        </iron-form>
        <div class="buttons">
            <paper-button id="editLinkDlgClose">Cancel</paper-button>
            <paper-button id="editLinkFormSubmit" raised>Update</paper-button>
        </div>
    </paper-dialog>
`;
