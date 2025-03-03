"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const validator = require("@pamkirsten/html-validator");
// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
// Create a simple text document manager.
const documents = new node_1.TextDocuments(
  vscode_languageserver_textdocument_1.TextDocument
);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params) => {
  const capabilities = params.capabilities;
  // Does the client support the `workspace/configuration` request?
  // If not, we fall back using global settings.
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );
  const result = {
    capabilities: {
      textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion.
      completionProvider: {
        resolveProvider: true,
      },
    },
  };
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }
  return result;
});
connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(
      node_1.DidChangeConfigurationNotification.type,
      undefined
    );
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((_event) => {
      connection.console.log("Workspace folder change event received.");
    });
  }
});
// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings = { maxNumberOfProblems: 1000 };
let globalSettings = defaultSettings;
// Cache the settings of all open documents
const documentSettings = new Map();
connection.onDidChangeConfiguration((change) => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = change.settings.languageServerExample || defaultSettings;
  }
  // Revalidate all open text documents
  documents.all().forEach(validateTextDocument);
});
function getDocumentSettings(resource) {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: "languageServerExample",
    });
    documentSettings.set(resource, result);
  }
  return result;
}
// Only keep settings for open documents
documents.onDidClose((e) => {
  documentSettings.delete(e.document.uri);
});
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidSave((change) => {
  validateTextDocument(change.document);
});

const checkWCAG = require("./regex/wcag");
const processW3C = require("./validators/w3c");
const processWHATWG = require("./validators/whatwg");
const processContrast = require("./validators/contrast");
const countAttributes = require("./helpers/count-attributes");
const { checkDocumentContrast } = require("./helpers/color-contrast");


async function validateTextDocument(textDocument) {
  // In this simple example we get the settings for every validate run.
  const settings = await getDocumentSettings(textDocument.uri);
  const text = textDocument.getText();
  connection.sendNotification("custom/ready", []);
  // These variables are there to store and tally the number of problems found in the HTML file
  let m;
  let problems = 0;
  const diagnostics = [];
  // Regex patterns are used to identify if the HTML file does not follow a certain WCAG Success Criteria
  checkWCAG(m, text, textDocument, problems, diagnostics, settings, hasDiagnosticRelatedInformationCapability);
  // W3C Validator
  const W3C = { data: text, format: "json" };
  const W3Cresult = await validator(W3C);
  const diagnosticPromises = W3Cresult.messages.map((msg) => processW3C(msg, diagnostics, problems, settings, textDocument, hasDiagnosticRelatedInformationCapability));
  await Promise.all(diagnosticPromises);
  // WHATWG Validator
  const WHATWG = { data: text, validator: 'WHATWG', format: "json" };
  const WHATWGresult = await validator(WHATWG);
  WHATWGresult.errors.forEach((msg) => processWHATWG(msg, diagnostics, problems, settings, textDocument, hasDiagnosticRelatedInformationCapability))
  // Color Contrast
  const contrastIssues = await checkDocumentContrast(textDocument._content);

  // get color suggestion from the last added
  const scheme = contrastIssues.pop();

  // continue processing the rest of the contrast issues
  contrastIssues.forEach((msg) => processContrast(msg, diagnostics, problems, settings, textDocument, hasDiagnosticRelatedInformationCapability));
  // Sort the diagnostics by start's line number > column number > end's line number > column number > source
  diagnostics.sort((a, b) => 
    a.range.start.line - b.range.start.line ||
    a.range.start.character - b.range.start.character ||
    a.range.end.line - b.range.end.line ||
    a.range.end.character - b.range.end.character ||
    a.source.localeCompare(b.source)
  );
  // Send the computed diagnostics to VSCode (must be done first).
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
  
  // Add the color scheme to the diagnostic and send it to the client
  diagnostics.push(scheme)

  // Add the score to the diagnostics and send it to the client
  // console.log(text)
  const score = countAttributes(text);
  // console.log(score)
  diagnostics.push(score);
  connection.sendNotification("custom/loadFiles", diagnostics);
}

connection.onDidChangeWatchedFiles((_change) => {
  // Monitored files have change in VSCode
  connection.console.log("We received an file change event");
});
// This handler provides the initial list of the completion items.
connection.onCompletion((_textDocumentPosition) => {
  // The pass parameter contains the position of the text document in
  // which code complete got requested. For the example we ignore this
  // info and always provide the same completion items.
  return [
    {
      label: "TypeScript",
      kind: node_1.CompletionItemKind.Text,
      data: 1,
    },
    {
      label: "JavaScript",
      kind: node_1.CompletionItemKind.Text,
      data: 2,
    },
  ];
});
// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item) => {
  if (item.data === 1) {
    item.detail = "TypeScript details";
    item.documentation = "TypeScript documentation";
  } else if (item.data === 2) {
    item.detail = "JavaScript details";
    item.documentation = "JavaScript documentation";
  }
  return item;
});
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map