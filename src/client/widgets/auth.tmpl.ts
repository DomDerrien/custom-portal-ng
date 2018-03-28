import { html } from '../../../node_modules/@polymer/polymer/polymer-element.js';

export let tmpl: HTMLTemplateElement = html`
    <style is="custom-style">
        .loginButtonWrapper {
            display: flex;
            justify-content: space-around;
        }
    
        #googleLoginBtn {
            display: none;
            background: #fff;
            color: #757575;
            border-radius: 1px;
            box-shadow: 0 2px 4px 0 rgba(0, 0, 0, .25);
            transition: background-color .218s, border-color .218s, box-shadow .218s;
            cursor: pointer;
            height: 36px;
            width: 120px;
            text-align: center;
        }
    
        #googleLoginBtn:hover {
            box-shadow: 0 0 3px 3px rgba(66, 133, 244, .3);
        }
    
        .googleLogo {
            width: 18px;
            height: 18px;
            float: left;
            padding: 8px;
        }
    
        .loginCall {
            font-size: 13px;
            line-height: 36px;
            font-weight: 500;
            letter-spacing: .21px;
            margin-left: 6px;
            margin-right: 6px;
            vertical-align: top;
        }
    </style>
    
    <div class="loginButtonWrapper">
        <div id="googleLoginBtn">
            <div class="googleLogo">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 48 48">
                    <g>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                    </g>
                </svg>
            </div>
            <span class="loginCall">Sign in</span>
        </div>
    </div>
    
    <paper-dialog id="dialogFeedback">
        <h2>Information</h2>
        <p class="message"></p>
        <div class="buttons">
            <paper-button dialog-confirm autofocus>OK</paper-button>
        </div>
    </paper-dialog>
`;