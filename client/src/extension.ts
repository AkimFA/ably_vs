/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;
let receivedData;

export async function activate(context: vscode.ExtensionContext) {

    const provider = new ColorsViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(ColorsViewProvider.viewType, provider));
    // The server is implemented in node
    const serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: debugOptions,
        },
    };
    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for javascript documents
        documentSelector: [{ scheme: 'file', language: 'html' },
        { scheme: 'file', language: 'javascript' }],
        synchronize: {
            // Notify the server about file changes to 'all' files contained in the workspace
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*'),
        },
    };
    // Create the language client and start the client.
    client = new LanguageClient(
        'languageServerExample',
        'Language Server Example',
        serverOptions,
        clientOptions
    );

    client.start();
    client.onReady().then(() => {
        vscode.window.showInformationMessage('AB.LY is now active!');
        provider.callView("initial");
        client.onNotification("custom/ready", () => {
            provider.callView("loading");
        });
        client.onNotification("custom/loadFiles", (files: Array<string>) => {
            receivedData = files;
            // console.log(receivedData);
            provider.callView("loaded");
        });
    });
}

let score = 0;
let dataLength = 0;
let scheme = []

class ColorsViewProvider implements vscode.WebviewViewProvider {

    public static readonly viewType = 'calicoColors.colorsView';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) { }

    public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
        
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [ this._extensionUri ]
        };


        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'colorSelected':
                    {
                        vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
                        break;
                    }
            }
        });
    }

    public callView(status: string) { this.updateView(this._view, status); }

    public updateView(webviewView: vscode.WebviewView, status: string) {
        //console.log("here");
        this._view = webviewView;
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, status);
    }

    private _getHtmlForWebview(webview: vscode.Webview, status: string) {
        try {
            const activeEditor = vscode.window.activeTextEditor;
            let htmlChecked;
            if (activeEditor) {
                htmlChecked = path.basename(activeEditor.document.fileName);
            }

            if (status == "loaded") {
                score = receivedData.pop();
                scheme = receivedData.pop()
                

                let messageArray = [];
                messageArray = receivedData.map(item => item.relatedInformation[0].message);
                let lineArray = [];
                lineArray = receivedData.map(item => item.range.start.line + 1);
                let wcagArray = [];
                wcagArray = (receivedData.map(item => item.source));
                let lineLinks = [];
                lineLinks = receivedData.map((item, index) => {
                    const line = item.range.start.line + 1;
                    const column = item.range.start.character + 1;
                    let lineLink = `vscode://file/${activeEditor.document.uri.fsPath}:${line}:${column}`;
                    lineLink = lineLink.replace(/\\/g, '/');
                    return lineLink;
                });

                let extractedValues = [];
                extractedValues = wcagArray.map(item => {
                    const [, value] = item.split(" | ");
                    return value;
                });

                let stringArray = "";
                stringArray = messageArray.join(' + ');
                let guidelinesString = "";
                guidelinesString = extractedValues.join(' + ');
                let linesString = "";
                linesString = lineArray.join(' + ');
                let lineLinksString = "";
                lineLinksString = lineLinks.join(' + ');
                
                dataLength = receivedData.length;

                const htmlFilePath = path.join(__dirname, '..', 'src', 'templates', 'webview.html');
                let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
                const cssFilePath = path.join(__dirname, '..', 'src', 'templates', 'styles.css');
                const cssContent = fs.readFileSync(cssFilePath, 'utf8');

                const hexs = scheme.map(color => color.hex).join("_");
                const textColors = scheme.map(color => color.textColor).join("_")

                htmlContent = htmlContent
                    .replace('{{score}}', score.toString())
                    .replace('{{dataLength}}', dataLength.toString())
                    .replace('{guidelinesString}', guidelinesString)
                    .replace('{{lineLinks}}', lineLinksString)
                    .replace('{{lineArray}}', linesString)
                    .replace('{{stringArray}}', stringArray)
                    .replace('{{styles}}', `<style>${cssContent}</style>`)
                    .replace('{{htmlChecked}}', htmlChecked)
                    .replace('{{schemeHex}}', hexs)
                    .replace('{{schemeTextColors}}', textColors)
                

                return htmlContent;
            } else if (status == "loading") {
                const htmlFilePath = path.join(__dirname, '..', 'src', 'templates', 'loading.html');
                let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
                const cssFilePath = path.join(__dirname, '..', 'src', 'templates', 'styles.css');
                const cssContent = fs.readFileSync(cssFilePath, 'utf8');

                htmlContent = htmlContent
                    .replace('{{styles}}', `<style>${cssContent}</style>`)
                    .replace('{{htmlChecked}}', htmlChecked);

                return htmlContent;
            } else if (status == "initial") {
                const htmlFilePath = path.join(__dirname, '..', 'src', 'templates', 'index.html');
                let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
                const cssFilePath = path.join(__dirname, '..', 'src', 'templates', 'styles.css');
                const cssContent = fs.readFileSync(cssFilePath, 'utf8');

                htmlContent = htmlContent
                    .replace('{{styles}}', `<style>${cssContent}</style>`);
                    
                return htmlContent;
            }
        } catch (error) {
            console.log(error);
        }
    }
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}