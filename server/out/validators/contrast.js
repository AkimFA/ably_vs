/**
 * @summary Processes the Color COntrast results to the format for AB.LY 
 */
const { DiagnosticSeverity } = require("vscode-languageserver/node");

// Process an error in the Color Contrast results
function processContrast(msg, diagnostics, problems, settings, textDocument, hasDiagnosticRelatedInformationCapability) {
	if (problems >= settings.maxNumberOfProblems) { return; }
    problems++;
	const diagnostic = {
		severity: DiagnosticSeverity.Warning,
		range: {
			start: textDocument.positionAt(msg.start),
			end: textDocument.positionAt(msg.end),
		},
		message: msg.contrastIssue,
		source: "WCAG 2.1 | Color Contrast (1.4.3, 1.4.6)"
	};
	if (hasDiagnosticRelatedInformationCapability) {
		diagnostic.relatedInformation = [
			{
				location: {
					uri: textDocument.uri,
					range: Object.assign({}, diagnostic.range),
				},
				message: msg.suggestion,
			},
		];
	}
	diagnostics.push(diagnostic);
}

module.exports = processContrast;