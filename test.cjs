// Mocking browser environment
const { JSDOM } = require("jsdom");
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.window = dom.window;
global.document = dom.window.document;
global.navigator = {
  userAgent: 'node.js',
};

// Load all the scripts in the correct order
const fs = require('fs');
const path = require('path');

const scripts = [
  'js/utils/EventBus.js',
  'js/utils/DOMUtils.js',
  'js/core/ErrorHandler.js',
  'js/core/FallbackManager.js',
  'js/core/PanelManager.js',
  'js/core/ElementLibrary.js',
  'js/core/DragDropEngine.js',
  'js/core/CanvasManager.js',
  'js/core/PropertyEditor.js',
  'js/core/PreviewManager.js',
  'js/core/StorageManager.js',
  'js/core/ExportEngine.js',
  'js/core/ResponsiveManager.js',
  'js/core/AdvancedManipulation.js',
  'js/core/UXEnhancement-simple.js',
  'js/core/VisualWebBuilder.js',
  'js/main.js'
];

scripts.forEach(scriptPath => {
  const scriptContent = fs.readFileSync(path.resolve(scriptPath), 'utf-8');
  eval(scriptContent);
});
