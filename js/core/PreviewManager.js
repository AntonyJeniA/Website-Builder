/**
 * PreviewManager - Live Preview and Demo Mode Controller
 * 
 * Manages preview mode functionality including hiding editing interfaces,
 * full-screen preview, and opening preview in new windows/tabs.
 */

function PreviewManager(app, eventBus) {
    this.app = app;
    this.eventBus = eventBus;
    this.initialized = false;
    
    // Preview state
    this.state = {
        isPreviewMode: false,
        isFullscreen: false,
        previewWindow: null
    };
    
    // DOM references
    this.elements = {
        container: null,
        header: null,
        leftPanel: null,
        rightPanel: null,
        centerPanel: null,
        canvas: null,
        canvasToolbar: null,
        demoBtn: null
    };
    
    // Original styles for restoration
    this.originalStyles = {
        container: {},
        header: {},
        leftPanel: {},
        rightPanel: {},
        centerPanel: {},
        canvasToolbar: {}
    };
}

/**
 * Initialize the preview manager
 */
PreviewManager.prototype.init = function() {
    if (this.initialized) {
        console.warn('PreviewManager already initialized');
        return;
    }

    try {
        console.log('Initializing PreviewManager...');
        
        // Get DOM references
        this.getDOMReferences();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Store original styles
        this.storeOriginalStyles();
        
        // Mark as initialized
        this.initialized = true;
        
        console.log('PreviewManager initialization complete');
        
    } catch (error) {
        console.error('Failed to initialize PreviewManager:', error);
        throw error;
    }
};

/**
 * Get references to key DOM elements
 */
PreviewManager.prototype.getDOMReferences = function() {
    this.elements.container = document.querySelector('.app-container');
    this.elements.header = document.querySelector('.app-header');
    this.elements.leftPanel = document.querySelector('.left-panel');
    this.elements.rightPanel = document.querySelector('.right-panel');
    this.elements.centerPanel = document.querySelector('.center-panel');
    this.elements.canvas = document.querySelector('#main-canvas');
    this.elements.canvasToolbar = document.querySelector('.canvas-toolbar');
    this.elements.demoBtn = document.querySelector('#demo-btn');

    // Validate required elements
    var requiredElements = ['container', 'header', 'leftPanel', 'rightPanel', 'centerPanel', 'canvas'];
    var missingElements = [];
    
    for (var i = 0; i < requiredElements.length; i++) {
        if (!this.elements[requiredElements[i]]) {
            missingElements.push(requiredElements[i]);
        }
    }
    
    if (missingElements.length > 0) {
        throw new Error('PreviewManager: Missing required DOM elements: ' + missingElements.join(', '));
    }
};

/**
 * Set up event listeners
 */
PreviewManager.prototype.setupEventListeners = function() {
    var self = this;
    
    // Listen for demo button clicks
    this.eventBus.on('demo:toggled', function(data) {
        self.handleDemoToggle(data);
    });
    
    // Listen for keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        self.handleKeyboardShortcuts(event);
    });
    
    // Listen for window close events to clean up preview windows
    window.addEventListener('beforeunload', function() {
        self.closePreviewWindow();
    });
    
    // Listen for fullscreen change events
    document.addEventListener('fullscreenchange', function() {
        self.handleFullscreenChange();
    });
    document.addEventListener('webkitfullscreenchange', function() {
        self.handleFullscreenChange();
    });
    document.addEventListener('mozfullscreenchange', function() {
        self.handleFullscreenChange();
    });
    document.addEventListener('MSFullscreenChange', function() {
        self.handleFullscreenChange();
    });
    
    // Listen for canvas updates to sync preview
    this.eventBus.on('canvas:updated', function() {
        if (self.state.previewWindow && !self.state.previewWindow.closed) {
            self.updatePreviewWindow();
        }
    });
};

/**
 * Store original styles for restoration
 */
PreviewManager.prototype.storeOriginalStyles = function() {
    var elements = ['container', 'header', 'leftPanel', 'rightPanel', 'centerPanel', 'canvasToolbar'];
    
    for (var i = 0; i < elements.length; i++) {
        var elementName = elements[i];
        var element = this.elements[elementName];
        
        if (element) {
            this.originalStyles[elementName] = {
                display: element.style.display || '',
                gridTemplateColumns: element.style.gridTemplateColumns || '',
                gridTemplateAreas: element.style.gridTemplateAreas || '',
                padding: element.style.padding || '',
                margin: element.style.margin || '',
                position: element.style.position || '',
                top: element.style.top || '',
                left: element.style.left || '',
                right: element.style.right || '',
                bottom: element.style.bottom || '',
                width: element.style.width || '',
                height: element.style.height || '',
                zIndex: element.style.zIndex || '',
                background: element.style.background || '',
                overflow: element.style.overflow || ''
            };
        }
    }
};

/**
 * Handle demo mode toggle
 */
PreviewManager.prototype.handleDemoToggle = function(data) {
    if (data.isDemoMode) {
        this.enterPreviewMode();
    } else {
        this.exitPreviewMode();
    }
};

/**
 * Handle keyboard shortcuts
 */
PreviewManager.prototype.handleKeyboardShortcuts = function(event) {
    // Escape key to exit preview mode
    if (event.key === 'Escape' && this.state.isPreviewMode) {
        this.exitPreviewMode();
        this.app.state.isDemoMode = false;
        this.updateDemoButton();
    }
    
    // F11 or Ctrl/Cmd + Shift + F for fullscreen toggle
    if ((event.key === 'F11' || 
         ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'F')) && 
        this.state.isPreviewMode) {
        event.preventDefault();
        this.toggleFullscreen();
    }
    
    // Ctrl/Cmd + Shift + P for preview in new window
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        this.openPreviewWindow();
    }
};

/**
 * Enter preview mode
 */
PreviewManager.prototype.enterPreviewMode = function() {
    if (this.state.isPreviewMode) return;
    
    console.log('Entering preview mode...');
    
    this.state.isPreviewMode = true;
    
    // Hide editing interfaces
    this.hideEditingInterfaces();
    
    // Update canvas for preview
    this.updateCanvasForPreview();
    
    // Enable interactive elements
    this.enableInteractiveElements();
    
    // Update demo button
    this.updateDemoButton();
    
    // Add preview mode class to body
    document.body.classList.add('vwb-preview-mode');
    
    // Emit preview mode entered event
    this.eventBus.emit('preview:entered');
    
    console.log('Preview mode activated');
};

/**
 * Exit preview mode
 */
PreviewManager.prototype.exitPreviewMode = function() {
    if (!this.state.isPreviewMode) return;
    
    console.log('Exiting preview mode...');
    
    this.state.isPreviewMode = false;
    
    // Exit fullscreen if active
    if (this.state.isFullscreen) {
        this.exitFullscreen();
    }
    
    // Show editing interfaces
    this.showEditingInterfaces();
    
    // Restore canvas for editing
    this.restoreCanvasForEditing();
    
    // Disable interactive elements
    this.disableInteractiveElements();
    
    // Update demo button
    this.updateDemoButton();
    
    // Remove preview mode class from body
    document.body.classList.remove('vwb-preview-mode');
    
    // Emit preview mode exited event
    this.eventBus.emit('preview:exited');
    
    console.log('Preview mode deactivated');
};

/**
 * Hide editing interfaces
 */
PreviewManager.prototype.hideEditingInterfaces = function() {
    // Hide header
    if (this.elements.header) {
        this.elements.header.style.display = 'none';
    }
    
    // Hide left panel
    if (this.elements.leftPanel) {
        this.elements.leftPanel.style.display = 'none';
    }
    
    // Hide right panel
    if (this.elements.rightPanel) {
        this.elements.rightPanel.style.display = 'none';
    }
    
    // Hide canvas toolbar
    if (this.elements.canvasToolbar) {
        this.elements.canvasToolbar.style.display = 'none';
    }
    
    // Update main content layout
    if (this.elements.container) {
        this.elements.container.style.gridTemplateRows = '1fr';
        this.elements.container.style.gridTemplateAreas = '"main"';
    }
    
    // Update center panel to fill entire space
    if (this.elements.centerPanel) {
        this.elements.centerPanel.style.gridArea = 'main';
        this.elements.centerPanel.style.padding = '0';
        this.elements.centerPanel.style.background = '#ffffff';
    }
    
    // Hide selection indicators and other editing UI
    this.hideEditingUI();
};

/**
 * Show editing interfaces
 */
PreviewManager.prototype.showEditingInterfaces = function() {
    // Restore header
    if (this.elements.header) {
        this.elements.header.style.display = this.originalStyles.header.display || '';
    }
    
    // Restore left panel
    if (this.elements.leftPanel) {
        this.elements.leftPanel.style.display = this.originalStyles.leftPanel.display || '';
    }
    
    // Restore right panel
    if (this.elements.rightPanel) {
        this.elements.rightPanel.style.display = this.originalStyles.rightPanel.display || '';
    }
    
    // Restore canvas toolbar
    if (this.elements.canvasToolbar) {
        this.elements.canvasToolbar.style.display = this.originalStyles.canvasToolbar.display || '';
    }
    
    // Restore main content layout
    if (this.elements.container) {
        this.elements.container.style.gridTemplateRows = this.originalStyles.container.gridTemplateRows || '';
        this.elements.container.style.gridTemplateAreas = this.originalStyles.container.gridTemplateAreas || '';
    }
    
    // Restore center panel
    if (this.elements.centerPanel) {
        this.elements.centerPanel.style.gridArea = '';
        this.elements.centerPanel.style.padding = this.originalStyles.centerPanel.padding || '';
        this.elements.centerPanel.style.background = this.originalStyles.centerPanel.background || '';
    }
    
    // Show editing UI
    this.showEditingUI();
};

/**
 * Hide editing UI elements (selection indicators, breadcrumbs, etc.)
 */
PreviewManager.prototype.hideEditingUI = function() {
    // Hide selection indicators
    var selectionIndicators = document.querySelectorAll('.vwb-selection-indicator, .vwb-selection-handle');
    for (var i = 0; i < selectionIndicators.length; i++) {
        selectionIndicators[i].style.display = 'none';
    }
    
    // Hide breadcrumb navigation
    var breadcrumbs = document.querySelectorAll('.vwb-breadcrumb-container');
    for (var i = 0; i < breadcrumbs.length; i++) {
        breadcrumbs[i].style.display = 'none';
    }
    
    // Hide element type labels
    var elements = document.querySelectorAll('.vwb-canvas-element');
    for (var i = 0; i < elements.length; i++) {
        elements[i].classList.add('vwb-preview-mode-element');
    }
};

/**
 * Show editing UI elements
 */
PreviewManager.prototype.showEditingUI = function() {
    // Show selection indicators (if there was a selected element)
    var selectionIndicators = document.querySelectorAll('.vwb-selection-indicator, .vwb-selection-handle');
    for (var i = 0; i < selectionIndicators.length; i++) {
        selectionIndicators[i].style.display = '';
    }
    
    // Show breadcrumb navigation
    var breadcrumbs = document.querySelectorAll('.vwb-breadcrumb-container');
    for (var i = 0; i < breadcrumbs.length; i++) {
        breadcrumbs[i].style.display = '';
    }
    
    // Show element type labels
    var elements = document.querySelectorAll('.vwb-canvas-element');
    for (var i = 0; i < elements.length; i++) {
        elements[i].classList.remove('vwb-preview-mode-element');
    }
};

/**
 * Update canvas for preview mode
 */
PreviewManager.prototype.updateCanvasForPreview = function() {
    if (!this.elements.canvas) return;
    
    // Remove canvas styling constraints
    this.elements.canvas.style.maxWidth = 'none';
    this.elements.canvas.style.width = '100%';
    this.elements.canvas.style.height = '100vh';
    this.elements.canvas.style.borderRadius = '0';
    this.elements.canvas.style.boxShadow = 'none';
    this.elements.canvas.style.margin = '0';
    this.elements.canvas.style.overflow = 'auto';
    
    // Update canvas container
    var canvasContainer = this.elements.canvas.parentElement;
    if (canvasContainer) {
        canvasContainer.style.padding = '0';
        canvasContainer.style.overflow = 'hidden';
        canvasContainer.style.display = 'block';
        canvasContainer.style.height = '100vh';
    }
    
    // Add preview mode class
    this.elements.canvas.classList.add('vwb-preview-canvas');
};

/**
 * Restore canvas for editing mode
 */
PreviewManager.prototype.restoreCanvasForEditing = function() {
    if (!this.elements.canvas) return;
    
    // Restore canvas styling
    this.elements.canvas.style.maxWidth = '';
    this.elements.canvas.style.width = '';
    this.elements.canvas.style.height = '';
    this.elements.canvas.style.borderRadius = '';
    this.elements.canvas.style.boxShadow = '';
    this.elements.canvas.style.margin = '';
    this.elements.canvas.style.overflow = '';
    
    // Restore canvas container
    var canvasContainer = this.elements.canvas.parentElement;
    if (canvasContainer) {
        canvasContainer.style.padding = '';
        canvasContainer.style.overflow = '';
        canvasContainer.style.display = '';
        canvasContainer.style.height = '';
    }
    
    // Remove preview mode class
    this.elements.canvas.classList.remove('vwb-preview-canvas');
};

/**
 * Enable interactive elements in preview mode
 */
PreviewManager.prototype.enableInteractiveElements = function() {
    // Enable buttons
    var buttons = this.elements.canvas.querySelectorAll('button, .vwb-canvas-element[data-vwb-type="button"]');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].style.pointerEvents = 'auto';
        buttons[i].style.cursor = 'pointer';
    }
    
    // Enable links
    var links = this.elements.canvas.querySelectorAll('a, .vwb-canvas-element[data-vwb-type="link"]');
    for (var i = 0; i < links.length; i++) {
        links[i].style.pointerEvents = 'auto';
        links[i].style.cursor = 'pointer';
    }
    
    // Enable form elements
    var formElements = this.elements.canvas.querySelectorAll('input, textarea, select, .vwb-canvas-element[data-vwb-type="input"], .vwb-canvas-element[data-vwb-type="textarea"]');
    for (var i = 0; i < formElements.length; i++) {
        formElements[i].style.pointerEvents = 'auto';
        formElements[i].disabled = false;
    }
};

/**
 * Disable interactive elements in editing mode
 */
PreviewManager.prototype.disableInteractiveElements = function() {
    // Disable buttons (except for editing purposes)
    var buttons = this.elements.canvas.querySelectorAll('button, .vwb-canvas-element[data-vwb-type="button"]');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].style.pointerEvents = '';
        buttons[i].style.cursor = '';
    }
    
    // Disable links
    var links = this.elements.canvas.querySelectorAll('a, .vwb-canvas-element[data-vwb-type="link"]');
    for (var i = 0; i < links.length; i++) {
        links[i].style.pointerEvents = '';
        links[i].style.cursor = '';
    }
    
    // Disable form elements
    var formElements = this.elements.canvas.querySelectorAll('input, textarea, select, .vwb-canvas-element[data-vwb-type="input"], .vwb-canvas-element[data-vwb-type="textarea"]');
    for (var i = 0; i < formElements.length; i++) {
        formElements[i].style.pointerEvents = '';
        // Don't disable form elements in editing mode as they might be needed for property editing
    }
};

/**
 * Toggle fullscreen mode
 */
PreviewManager.prototype.toggleFullscreen = function() {
    if (this.state.isFullscreen) {
        this.exitFullscreen();
    } else {
        this.enterFullscreen();
    }
};

/**
 * Enter fullscreen mode
 */
PreviewManager.prototype.enterFullscreen = function() {
    if (!this.state.isPreviewMode) {
        console.warn('Cannot enter fullscreen outside of preview mode');
        return;
    }
    
    var element = this.elements.container;
    
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
    
    this.state.isFullscreen = true;
    document.body.classList.add('vwb-fullscreen-preview');
    
    console.log('Entered fullscreen preview mode');
};

/**
 * Exit fullscreen mode
 */
PreviewManager.prototype.exitFullscreen = function() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
    
    this.state.isFullscreen = false;
    document.body.classList.remove('vwb-fullscreen-preview');
    
    console.log('Exited fullscreen preview mode');
};

/**
 * Open preview in new window/tab
 */
PreviewManager.prototype.openPreviewWindow = function() {
    // Close existing preview window if open
    this.closePreviewWindow();
    
    // Generate preview HTML
    var previewHTML = this.generatePreviewHTML();
    
    // Open new window
    this.state.previewWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    if (this.state.previewWindow) {
        this.state.previewWindow.document.write(previewHTML);
        this.state.previewWindow.document.close();
        this.state.previewWindow.focus();
        
        console.log('Preview opened in new window');
        this.eventBus.emit('preview:window-opened');
    } else {
        console.error('Failed to open preview window - popup blocked?');
        this.app.showNotification('Failed to open preview window. Please allow popups for this site.', 'error');
    }
};

/**
 * Close preview window
 */
PreviewManager.prototype.closePreviewWindow = function() {
    if (this.state.previewWindow && !this.state.previewWindow.closed) {
        this.state.previewWindow.close();
        this.state.previewWindow = null;
        console.log('Preview window closed');
        this.eventBus.emit('preview:window-closed');
    }
};

/**
 * Update preview window content
 */
PreviewManager.prototype.updatePreviewWindow = function() {
    if (!this.state.previewWindow || this.state.previewWindow.closed) {
        return;
    }
    
    try {
        var previewHTML = this.generatePreviewHTML();
        this.state.previewWindow.document.open();
        this.state.previewWindow.document.write(previewHTML);
        this.state.previewWindow.document.close();
    } catch (error) {
        console.error('Failed to update preview window:', error);
    }
};

/**
 * Generate HTML for preview window
 */
PreviewManager.prototype.generatePreviewHTML = function() {
    var canvasContent = this.cleanCanvasContentForPreview();
    
    // Extract styles from the main document
    var styles = this.extractRelevantStyles();
    
    var html = '<!DOCTYPE html>\n' +
               '<html lang="en">\n' +
               '<head>\n' +
               '    <meta charset="UTF-8">\n' +
               '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
               '    <title>Preview - Visual Web Builder</title>\n' +
               '    <style>\n' + styles + '\n    </style>\n' +
               '</head>\n' +
               '<body>\n' +
               '    <div class="preview-container">\n' +
               canvasContent + '\n' +
               '    </div>\n' +
               '    <script>\n' +
               '        // Enable interactive elements\n' +
               '        document.addEventListener("DOMContentLoaded", function() {\n' +
               '            console.log("Preview loaded successfully");\n' +
               '        });\n' +
               '    </script>\n' +
               '</body>\n' +
               '</html>';
    
    return html;
};

/**
 * Clean canvas content for preview (remove editing-specific classes and attributes)
 */
PreviewManager.prototype.cleanCanvasContentForPreview = function() {
    if (!this.elements.canvas) return '';
    
    // Create a temporary container to work with
    var tempContainer = document.createElement('div');
    tempContainer.innerHTML = this.elements.canvas.innerHTML;
    
    // Remove editing-specific classes and attributes
    var elements = tempContainer.querySelectorAll('*');
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        
        // Remove VWB-specific classes
        var classesToRemove = ['vwb-canvas-element', 'vwb-selected', 'vwb-highlight', 'vwb-preview-mode-element'];
        for (var j = 0; j < classesToRemove.length; j++) {
            element.classList.remove(classesToRemove[j]);
        }
        
        // Clean up empty class attributes
        if (element.className === '') {
            element.removeAttribute('class');
        }
        
        // Remove VWB-specific data attributes (keep data-vwb-type for styling)
        var attributesToRemove = ['data-vwb-id', 'data-vwb-selected', 'data-vwb-dropped-at'];
        for (var k = 0; k < attributesToRemove.length; k++) {
            element.removeAttribute(attributesToRemove[k]);
        }
    }
    
    return tempContainer.innerHTML;
};

/**
 * Extract relevant styles for preview
 */
PreviewManager.prototype.extractRelevantStyles = function() {
    var styles = '';
    
    // Basic reset and body styles
    styles += '* { box-sizing: border-box; }\n';
    styles += 'body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.5; color: #333; background: #fff; }\n';
    styles += '.preview-container { max-width: 1200px; margin: 0 auto; }\n';
    
    // Add element-specific styles
    styles += 'h1, h2, h3, h4, h5, h6 { margin: 15px 0 10px 0; font-weight: bold; }\n';
    styles += 'h1 { font-size: 2em; }\n';
    styles += 'h2 { font-size: 1.5em; }\n';
    styles += 'h3 { font-size: 1.17em; }\n';
    styles += 'h4 { font-size: 1em; }\n';
    styles += 'h5 { font-size: 0.83em; }\n';
    styles += 'h6 { font-size: 0.67em; }\n';
    styles += 'p { margin: 10px 0; line-height: 1.6; }\n';
    styles += 'button { display: inline-block; padding: 8px 16px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; transition: background-color 0.2s ease; }\n';
    styles += 'button:hover { background-color: #2980b9; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); }\n';
    styles += 'input, textarea { display: inline-block; padding: 8px 12px; border: 1px solid #bdc3c7; border-radius: 4px; font-size: 14px; }\n';
    styles += 'input { min-width: 200px; }\n';
    styles += 'textarea { min-width: 200px; min-height: 80px; resize: vertical; }\n';
    styles += 'input:focus, textarea:focus { outline: 2px solid #3498db; outline-offset: 1px; border-color: #3498db; }\n';
    styles += 'a { color: #3498db; text-decoration: underline; cursor: pointer; }\n';
    styles += 'a:hover { color: #2980b9; }\n';
    styles += 'img { max-width: 100%; height: auto; }\n';
    styles += 'div { min-height: 20px; }\n';
    
    // Extract canvas element styles from main CSS
    var styleSheets = document.styleSheets;
    for (var i = 0; i < styleSheets.length; i++) {
        try {
            var rules = styleSheets[i].cssRules || styleSheets[i].rules;
            if (rules) {
                for (var j = 0; j < rules.length; j++) {
                    var rule = rules[j];
                    if (rule.selectorText && rule.style && rule.style.cssText) {
                        // Include styles that are relevant to canvas elements
                        if (rule.selectorText.includes('[data-vwb-type]')) {
                            // Clean up selector for preview
                            var cleanSelector = rule.selectorText
                                .replace(/\.vwb-canvas-element/g, '')
                                .replace(/\.vwb-preview-mode-element/g, '')
                                .replace(/\.vwb-selected/g, '')
                                .replace(/\.vwb-highlight/g, '')
                                .trim();
                            
                            if (cleanSelector && !cleanSelector.includes('::before') && !cleanSelector.includes('::after')) {
                                styles += cleanSelector + ' { ' + rule.style.cssText + ' }\n';
                            }
                        }
                    }
                }
            }
        } catch (e) {
            // Skip stylesheets that can't be accessed (CORS)
            continue;
        }
    }
    
    return styles;
};

/**
 * Update demo button text and state
 */
PreviewManager.prototype.updateDemoButton = function() {
    if (this.elements.demoBtn) {
        this.elements.demoBtn.textContent = this.state.isPreviewMode ? 'Exit Demo' : 'Demo';
        this.elements.demoBtn.classList.toggle('active', this.state.isPreviewMode);
    }
};

/**
 * Get current preview state
 */
PreviewManager.prototype.getState = function() {
    return {
        isPreviewMode: this.state.isPreviewMode,
        isFullscreen: this.state.isFullscreen,
        hasPreviewWindow: this.state.previewWindow && !this.state.previewWindow.closed
    };
};

/**
 * Handle fullscreen change events
 */
PreviewManager.prototype.handleFullscreenChange = function() {
    var isFullscreen = !!(document.fullscreenElement || 
                         document.webkitFullscreenElement || 
                         document.mozFullScreenElement || 
                         document.msFullscreenElement);
    
    if (this.state.isFullscreen !== isFullscreen) {
        this.state.isFullscreen = isFullscreen;
        
        if (isFullscreen) {
            document.body.classList.add('vwb-fullscreen-preview');
        } else {
            document.body.classList.remove('vwb-fullscreen-preview');
        }
        
        console.log('Fullscreen mode ' + (isFullscreen ? 'entered' : 'exited'));
        this.eventBus.emit('preview:fullscreen-changed', { isFullscreen: isFullscreen });
    }
};

/**
 * Clean up resources
 */
PreviewManager.prototype.destroy = function() {
    if (!this.initialized) return;
    
    // Exit preview mode if active
    if (this.state.isPreviewMode) {
        this.exitPreviewMode();
    }
    
    // Close preview window
    this.closePreviewWindow();
    
    // Remove event listeners
    // (Event listeners are handled by EventBus, so they'll be cleaned up automatically)
    
    // Reset state
    this.state = {
        isPreviewMode: false,
        isFullscreen: false,
        previewWindow: null
    };
    
    this.initialized = false;
    
    console.log('PreviewManager destroyed');
};