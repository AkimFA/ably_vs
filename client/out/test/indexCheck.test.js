// This is unit testing for the indexCheck function


// helper function for loading files
const { promises } = require("fs");
async function loadHTML(file) {
	try {
      	const htmlString = await promises.readFile(file, 'utf8');
      	return htmlString;
	} catch (error) {
      	console.error('Error reading the HTML file:', error);
	}
}

test('Index check - no errors', async () => {
	// Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);
    
    const htmlFilePath = 'client/out/test/base/indexNoError.html';
    const html = await loadHTML(htmlFilePath);

	// Act
	const data = await checkDocumentContrast(html);

	// Assert
	expect(data).toStrictEqual([[]]);
})

test('Index check - errors', async () => {
	// Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);

    const htmlFilePath = 'client/out/test/base/indexError.html';
	const html = await loadHTML(htmlFilePath);

	const string = "p style=\"color: #ff0000;\"";

	// Act
	const data = await checkDocumentContrast(html);

	const actualString = html.substring(data[0].start, data[0].end);

	// Assert
	expect(actualString).toBe(string);
})

test('Index check with child background - no errors ', async () => {
    // Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);

    const htmlFilePath = 'client/out/test/base/indexNoErrorWithChildBg.html'
    const html = await loadHTML(htmlFilePath);

    // Act
    const data = await checkDocumentContrast(html);

    // Assert
    expect(data).toStrictEqual([[]]);
})

test('Index check with child background - errors', async () => {
    // Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);

    const htmlFilePath = 'client/out/test/base/indexErrorWithChildBg.html';
    const html = await loadHTML(htmlFilePath);
    
    const string = "p style=\"background-color: #ff0000; color: #ff0000;\"";

    // Act
    const data = await checkDocumentContrast(html);

	const actualString = html.substring(data[0].start, data[0].end);

    // Assert
    expect(actualString).toBe(string);
})

test('Nested index check - no errors', async () => {
	// Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);

    const htmlFilePath = 'client/out/test/base/nestedIndexNoError.html';
	const html = await loadHTML(htmlFilePath);

	// Act
	const data = await checkDocumentContrast(html);

	// Assert
	expect(data).toStrictEqual([[]]);
})

test('Nested index check - errors', async () => {
	// Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);

    const htmlFilePath = 'client/out/test/base/nestedIndexError.html';
	const html = await loadHTML(htmlFilePath);

	const string = "p style=\"color: #ff0000;\"";

	// Act
	const data = await checkDocumentContrast(html);

	const actualString = html.substring(data[0].start, data[0].end);

	// Assert
	expect(actualString).toBe(string);
})

test('Nested index check with child background - no errors', async () => {
    // Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);

    const htmlFilePath = 'client/out/test/base/nestedIndexNoErrorWithChildBg.html';
    const html = await loadHTML(htmlFilePath);

    // Act
    const data = await checkDocumentContrast(html);

    // Assert
    expect(data).toStrictEqual([[]]);
})

test('Nested index check with child background - errors', async () => {
    // Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);

    const htmlFilePath = 'client/out/test/base/nestedIndexErrorWithChildBg.html';
    const html = await loadHTML(htmlFilePath);
    
    const string = "p style=\"background-color: #ff0000; color: #ff0000;\"";

    // Act
    const data = await checkDocumentContrast(html);

	const actualString = html.substring(data[0].start, data[0].end);

    // Assert
    expect(actualString).toBe(string);
})

test('Nested index check with parent background colors - no errors', async () => {
    // Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);

    const htmlFilePath = 'client/out/test/base/nestedIndexNoErrorWithParentBg.html';
    const html = await loadHTML(htmlFilePath);

    // Act
    const data = await checkDocumentContrast(html);

    // Assert
    expect(data).toStrictEqual([[]]);
})

test('Nested index check with parent background colors - errors', async () => {
    // Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);

    const htmlFilePath = 'client/out/test/base/nestedIndexErrorWithParentBg.html';
    const html = await loadHTML(htmlFilePath);
    
    const string = "p style=\"color: #ff0000;\"";

    // Act
    const data = await checkDocumentContrast(html);

    const actualString = html.substring(data[0].start, data[0].end)

    // Assert
    expect(actualString).toBe(string)
})

test('Nested index check with parent background and child background - no errors', async () => {
    // Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);

    const htmlFilePath = 'client/out/test/base/nestedIndexNoErrorWithParentAndChildBg.html';
    const html = await loadHTML(htmlFilePath);
    
    // Act
    const data = await checkDocumentContrast(html);

    // Assert
    expect(data).toStrictEqual([[]]);
})

test('Nested index check with parent background and child background - errors', async () => {
    // Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);

    const htmlFilePath = 'client/out/test/base/nestedIndexErrorWithParentAndChildBg.html';
    const html = await loadHTML(htmlFilePath);
    
    const string = "p style=\"background-color: #ff0000; color: #ff0000;\"";

    // Act
    const data = await checkDocumentContrast(html);

    const actualString = html.substring(data[0].start, data[0].end);

    // Assert
    expect(actualString).toBe(string);
})

test ('CSS styling index check - no errors', async () => {
    // Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);

    const htmlFilePath = 'client/out/test/base/cssIndexNoError.html';
    const html = await loadHTML(htmlFilePath);
    
    // Act
    const data = await checkDocumentContrast(html);

    // Assert
    expect(data).toStrictEqual([[]]);
})

test('CSS styling index check - errors', async () => {
    // Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);

    const htmlFilePath = 'client/out/test/base/cssIndexError.html';
    const html = await loadHTML(htmlFilePath);
    
    const string = "p id=\"para\"";

    // Act
    const data = await checkDocumentContrast(html);

    const actualString = html.substring(data[0].start, data[0].end);

    // Assert
    expect(actualString).toBe(string);
})

test('Stylesheet index check - no errors', async () => {
    // Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);

    const htmlFilePath = 'client/out/test/base/stylesheetNoError.html';
    const html = await loadHTML(htmlFilePath);
    
    // Act
    const data = await checkDocumentContrast(html);

    // Assert
    expect(data).toStrictEqual([[]]);
})

test('Stylesheet index check - errors', async () => {
    // Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);

    const htmlFilePath = 'client/out/test/base/stylesheetError.html';
    const html = await loadHTML(htmlFilePath);
    
    const string = "p id=\"para\"";

    // Act
    const data = await checkDocumentContrast(html);
    // console.log(html)
    const actualString = html.substring(data[0].start, data[0].end);

    // Assert
    expect(actualString).toBe(string);
})

test('Multiple Stylesheet index check - no errors', async () => {
    // Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);

    const htmlFilePath = 'client/out/test/base/multipleStylesheetNoError.html';
    const html = await loadHTML(htmlFilePath);
    
    // Act
    const data = await checkDocumentContrast(html);

    // Assert
    expect(data).toStrictEqual([[]]);
})

test('Multiple Stylesheet index check - errors', async () => {
    // Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);

    const htmlFilePath = 'client/out/test/base/multipleStylesheetError.html';
    const html = await loadHTML(htmlFilePath);
    
    const string = "p id=\"para\"";

    // Act
    const data = await checkDocumentContrast(html);
    // console.log(html)
    const actualString = html.substring(data[0].start, data[0].end);

    // Assert
    expect(actualString).toBe(string);
})

test('Index and size check - no errors', async () => {
    // Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);

    const htmlFilePath = 'client/out/test/base/indexAndSizeNoError.html';
    const html = await loadHTML(htmlFilePath);
    
    // Act
    const data = await checkDocumentContrast(html);

    // Assert
    expect(data).toStrictEqual([[]]);
})

test('Index and size check - errors', async () => {
    // Arrange 
    const functionPath = "../../../server/out/helpers/color-contrast";
    const {checkDocumentContrast} = require(functionPath);

    const htmlFilePath = 'client/out/test/base/indexAndSizeError.html';
    const html = await loadHTML(htmlFilePath);
    
    const string = "p style=\"color: #ff0000; font-size: 1em;\"";

    // Act
    const data = await checkDocumentContrast(html);
    // console.log(html)
    const actualString = html.substring(data[0].start, data[0].end);

    // Assert
    expect(actualString).toBe(string);
})