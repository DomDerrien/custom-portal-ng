import { html } from '@polymer/polymer/polymer-element.js';
import '@polymer/app-layout/app-header-layout/app-header-layout.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-toast/paper-toast.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-button/paper-button.js';

import '../widgets/auth.js';
// import '../widgets/category-list.js'; // import dynamically once the user is logged in

export let tmpl: HTMLTemplateElement = html`
    <style is="custom-style">
        .toolbar {
            background-color: black;
            color: white;
        }
    
        #avatar {
            height: 48px;
        }
    
        #avatar>img {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            margin-left: 8px;
        }
    
        #splashScreen {
            display: flex;
            height: 100vh;
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
            text-align: center;
        }
    </style>
    
    <app-header-layout has-scrolling-region fullbleed>
        <app-header fixed>
            <app-toolbar class="toolbar">
                <div main-title>Custom Portal v2</div>
                <paper-icon-button id="addCategory" src="/images/category-add-white.svg" title="Add a {{entityName}}"></paper-icon-button>
                <paper-icon-button id="signOut" src="/images/logout-white.svg" title="Sign out"></paper-icon-button>
                <div id="avatar"></div>
            </app-toolbar>
        </app-header>
    
        <div class="content">
            <div id="splashScreen">
                <div>
                    <div>The Portal waits for your successful login.</div>
                    <portal-auth></portal-auth>
                </div>
            </div>
            <portal-category-list id="categoryList" style="display: none;"></portal-category-list>
        </div>
        <div style="font-size:12px; position: fixed; bottom: 2px; right: 10px;">
            [bookmarklet:
            <a title="Will add the link of the current page in the 'Read later' category." href="javascript:(function later(){const uBase='https://fav-list-ng.appspot.com/api/v1/';const options={method:'get',headers:{'x-ids-only':true},credentials:'include'};fetch(uBase+'Category?title=Read%20later',options).then((response)=>response.json()).then((categories)=>{options.method='post';options.headers['content-type']='application/x-www-form-urlencoded';options.body='categoryId='+categories[0]+'&amp;title='+window.document.title+'&amp;href='+window.location.href;return fetch(uBase+'Link',options);}).catch((reason)=>{console.log('Cannot save this page...',reason);});}())">Read later</a> ]
        </div>
    </app-header-layout>
    
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
`;