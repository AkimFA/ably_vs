const { JSDOM } = require("jsdom");
const { type } = require("os");
const fs = require("fs")
const path = require("path")
const defaultFontColor = "#000000"; // Black
const defaultBackgroundColor = "#ffffff"; // White

// Contrast Ratio equation retrieved from https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
function getContrastRatio(color1, color2) {
  const luminance1 = getRelativeLuminance(color1);
  const luminance2 = getRelativeLuminance(color2);
  const contrastRatio =
    (Math.max(luminance1, luminance2) + 0.05) /
    (Math.min(luminance1, luminance2) + 0.05);
  return contrastRatio.toFixed(2);
}

// Relative Luminance equation retrieved from https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
function getRelativeLuminance(color) {
  // console.log("Getting relative luminance for color:", color);
  const rgb = parseColor(color);
  const [r, g, b] = rgb.map((c) => {
    let sRgb = c / 255;
    return sRgb <= 0.03928 // Should it be updated to 0.04045? Document say 0.03928 was from an older version but no practical effect on the calculations in accordance to the guidelines
      ? sRgb / 12.92
      : Math.pow((sRgb + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance;
}

function parseColor(color) {
  // console.log("Parsing color:", color);
  const hexMatch = color.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return hexMatch.slice(1).map((c) => parseInt(c, 16));
  }
  throw new Error("Invalid color format: " + color);
}

function rgbToHex(rgb, type) {
  // console.log("Converting RGB to Hex:", rgb);
  if (rgb == "rgba(0, 0, 0, 0)") {
    return defaultBackgroundColor
  }
  const match = rgb.match(/(\d+),\s*(\d+),\s*(\d+)/);
  if (!match) {
    if (type === "text") {
      return defaultFontColor;
    } else if (type === "background") {
      return defaultBackgroundColor;
    } else {
      throw new Error("Invalid color type: " + type);
    }
  }
  const [r, g, b] = match.slice(1);
  const hexR = parseInt(r, 10).toString(16).padStart(2, "0");
  const hexG = parseInt(g, 10).toString(16).padStart(2, "0");
  const hexB = parseInt(b, 10).toString(16).padStart(2, "0");
  return `#${hexR}${hexG}${hexB}`;
}

function getFontSize(element, window) {
  const computedStyle = window.getComputedStyle(element);
  let size = computedStyle.getPropertyValue("font-size");


  // Convert to pixels if necessary
  if (size.endsWith('em')) {
      const parentFontSize = getFontSize(element.parentElement, window);
      size = parseFloat(size) * parentFontSize;
  } else if (size.endsWith('rem')) {
      const rootFontSize = getFontSize(document.documentElement, window);
      size = parseFloat(size) * rootFontSize;
  } else if (size.endsWith('px')) {
      size = parseFloat(size);
  } else if (size.endsWith('%')) {
      const parentFontSize = getFontSize(element.parentElement, window);
      size = (parseFloat(size) / 100) * parentFontSize;
  } else {
      // Handle other units or default case
      size = parseFloat(size);
  }
  if (isNaN(size)) {
      return 16; // Default font size
  }
  return size;
} 
  
function appendElement(level, contrast, element, document) {
  if (element.textContent != "Process selected images") {
    const colorChecked = document.createElement("div");
    colorChecked.id = "ably-colorChecked";
    if (level == 11) {
      colorChecked.textContent =
        "The text '" +
        element.textContent +
        "' has a color contrast ratio of " +
        contrast +
        ", which is below the WCAG minimum for Level AA - Normal Text of 4.5";
    } else if (level == 12) {
      colorChecked.textContent =
        "The text '" +
        element.textContent +
        "' has a color contrast ratio of " +
        contrast +
        ", which is below the WCAG minimum for Level AAA - Normal Text of 7";
    } else if (level == 21) {
      colorChecked.textContent =
        "The text '" +
        element.textContent +
        "' has a color contrast ratio of " +
        contrast +
        ", which is below the WCAG minimum for Level AA - Large Text of 3";
    } else if (level == 22) {
      colorChecked.textContent =
        "The text '" +
        element.textContent +
        "' has a color contrast ratio of " +
        contrast +
        ", which is below the WCAG minimum for Level AAA - Large Text of 4.5";
    }
    // console.log(colorChecked.textContent);
    return colorChecked.textContent;
  }
}

// Helper function for checkDocumentContrast to find the indexes of the element
function getIndexes(element, html) {
  var indexes = []
  reg = new RegExp(element.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s+/g, '\\s+'), 'g');
  finding = [...html.matchAll(reg)];
  finding.forEach(data => {
    indexes.push(data.index);
  })
  return indexes
}

// Helper function for checkDocumentContrast to find text in an element
function isThereNoText (element) {
  for (let i = 0; i < element.childNodes.length; i++) {
    if (element.childNodes[i].nodeName == "#text" && !(element.childNodes[i].textContent).match(/^\s*$/)) return false;
  }
  return true
}

// Get color scheme given a color
async function getColorScheme(window, document) {
  var bgColor = window.getComputedStyle(document.body).backgroundColor
  bgColor = rgbToHex(bgColor, "background").replace("#","")

  try {
    const response = await fetch (
      "https://www.thecolorapi.com/scheme?hex=" + bgColor + "&mode=complement"
    );
    const data = await response.json()
    var colorData = data.colors

    // Filter out duplicates
    const names = colorData.map((item) => item.name.value)
    colorData = colorData.filter((item, index) => !names.includes(item.name.value, index + 1))

    // reformat data being passed
    const colorScheme = (colorData).map(color => ({
      hex: color.hex.value, 
      textColor: getTextColorSuggestion(color.hex.value)}))

    return colorScheme
  } catch (error) {
    console.log(error)
    return [];
  }
}
  
// Gives either white or black text color as the suggestion
function getTextColorSuggestion(bgColor, isBig) {
  let color = ""
  let result = ""
  whiteValue = parseFloat(getContrastRatio(bgColor, "#ffffff"));
  blackValue = parseFloat(getContrastRatio(bgColor, "#000000"));
  
  if (whiteValue > blackValue) {
    color = "#ffffff"
    result = "white"
  } else {
    color = "#000000"
    result = "black"
  }

  const suggestedContrast = getContrastRatio(color, bgColor)
  console.log(suggestedContrast)
  if ((suggestedContrast < 4.5 && isBig) || (suggestedContrast < 7 && !isBig)) {
    result = "cannot suggest"
  }
  console.log(result)
  return result
}

function checkContrast(element, window, document, html, index) {
  let contrastIssue = "";
  // console.log("Checking contrast for element:", element);
  // Get the text and background colors of an element
  let textColor = rgbToHex(window.getComputedStyle(element).color, "text");
  // console.log("Text color:", textColor);

  // Retrieves the backgroundcolor of the element, if none goes to the parent element
  let actualBg = element
  while (actualBg.localName != "body" && window.getComputedStyle(actualBg).backgroundColor == "rgba(0, 0, 0, 0)") {
    actualBg = actualBg.parentElement
  }  

  let bgColor = rgbToHex(window.getComputedStyle(actualBg).backgroundColor,"background");
  // console.log("Background color:", bgColor);

  const contrastRatio = getContrastRatio(textColor, bgColor);
  // console.log("Contrast ratio:", contrastRatio);

  // WCAG AA : 4.5 - Normal, 3 - Large
  // WCAG AAA : 7 - Normal, 4.5 - Large
  
  // console.log("Font Size: ", getFontSize(element, window));
  
  var isBig = false;
  if (getFontSize(element, window) < 24) {
    // Normal Size
    if (contrastRatio < 4.5) {
      // Level AA
      contrastIssue += appendElement("11", contrastRatio, element, document);
      contrastIssue += "\n";
    } else if (contrastRatio < 7) {
      // Level AAA
      contrastIssue += appendElement("12", contrastRatio, element, document);
      contrastIssue += "\n";
    }
  } else {
    isBig = true;
    // Large Size
    if (contrastRatio < 3) {
      // Level AA
      contrastIssue += appendElement("21", contrastRatio, element, document);
      contrastIssue += "\n";
    } else if (contrastRatio < 4.5) {
      // Level AAA
      contrastIssue += appendElement("22", contrastRatio, element, document);
      contrastIssue += "\n";
    }
  }

  const color = getTextColorSuggestion(bgColor, isBig);
  var suggestion;
  if (color == "cannot suggest") {
    suggestion = `Use a color with higher contrast for the text.`;
  } else {
    suggestion = `Use the color ${color} for the text.`;
  }
  
  

  // Find the index of the element's HTML within the document's HTML
  // const elementStartIndex = index + (element.outerHTML).lastIndexOf(">" + element.textContent) + 1;
  // const elementEndIndex = elementStartIndex + element.textContent.length;
  const elementStartIndex = index + 1;
  const elementEndIndex = elementStartIndex + (element.outerHTML).indexOf(">") - 1;
  
  // Only return the element if it has a color contrast issue
  if (elementStartIndex < 1 || elementEndIndex < 1) {
    return {
      contrastIssue: "",
      start: -1,
      end: -1,
      suggestion: ""
    };
  } else {
    return {
      contrastIssue: contrastIssue,
      start: elementStartIndex,
      end: elementEndIndex,
      suggestion: suggestion
    };
  }
}

async function checkDocumentContrast(html) {
	// List of all the color contrast issues
	const colorContrastIssues = [];

	// Find all the elements with text content on the page
	const dom = new JSDOM(html, {resources: 'usable'});
	const document = dom.window.document;
	const window = dom.window;


  // Checks for external css file
  const styleSheet = document.querySelector("link")
  if (styleSheet != null) {
    urlReg = /^(https?:\/\/)/;
    var cssContent
    if (urlReg.test(styleSheet.href)) {
      const cssResponse = await fetch(styleSheet.href);
      cssContent = await cssResponse.text();
    } else {
      const cssPath = path.resolve("./", styleSheet.href)
      if (fs.existsSync(cssPath)) {
        cssContent = await fs.promises.readFile(cssPath, 'utf8')
      }
    }
    // Add Css to document
    const styleElement = dom.window.document.createElement('style');
    styleElement.textContent = cssContent;
    dom.window.document.head.appendChild(styleElement);
  }
  // console.log(document)
  // console.log(dom.window.document)

	// Find all the elements with text content on the page
	const elements = document.querySelectorAll(
	  "p, span, h1, h2, h3, h4, h5, h6, li, a, button, label, small, strong, em, div, td, th, caption"
	);
	
  let indexMap = {} // hashmap for duplicate elements
  
  // Check the color contrast of each element
  for (let i = 0; i < elements.length; i++) {
    // Checks if there is a text under the element, if not skips the process
    if (isThereNoText(elements[i])) continue;

    // Finds all indexes of the element
    let indexes = getIndexes(elements[i].outerHTML, html)
    let index = 0

    // checks if theres a duplicate and goes to the next one if it has been used
    if (indexMap[indexes] != null) {
      indexMap[indexes] += 1
      index = indexMap[indexes]
    } else if (indexes.length > 1) {
      indexMap[indexes] = 0
    }

    colorContrastIssues.push(checkContrast(elements[i], window, document, html, indexes[index]))
  }

  // Remove element if there is no contrast issue
  for (let i = colorContrastIssues.length - 1; i >= 0; i--) {
    if (colorContrastIssues[i].contrastIssue === "") {
      colorContrastIssues.splice(i, 1);
    }
  }

  // Check if there is issues before getting color scheme
  if (colorContrastIssues.length != 0) {
    // Getting color scheme
    var colorScheme = await getColorScheme(window, document)
    // Adding color scheme to colorContractIssues to be passed to the server
    colorContrastIssues.push(colorScheme);
  } else {
    colorContrastIssues.push([])
  }
  
	return colorContrastIssues;
}

module.exports = {checkDocumentContrast };
