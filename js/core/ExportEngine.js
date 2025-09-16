/**
 * ExportEngine - HTML/CSS Export Functionality
 * 
 * This class handles the generation of clean HTML markup and organized CSS
 * from canvas elements, providing export options including file downloads
 * and clipboard copying with properly formatted, valid code output.
 */

function ExportEngine(canvasManager, eventBus) {
    this.canvasManager = canvasManager;
    this.eventBus = eventBus;
    this.initialized = false;
    
    // Export configuration
    this.config = {
        htmlIndent: '  ', // 2 spaces
        cssIndent: '  ',  // 2 spaces
        classPrefix: 'vwb-',
        exportedClassPrefix: 'element-',
        includeComments: true,
        includeMetaTags: true,
        cssOrganization: 'grouped' // 'grouped' or 'sequential'
    };
    
    // Export UI elements
    this.ui = {
        exportDialog: null,
        codePreview: null,
        downloadButtons: null
    };
    
    // Generated code cache
    this.cache = {
        html: null,
        css: null,
        timestamp: null
    };
}

/**
 * Initialize the export engine
 */
ExportEngine.prototype.init = function() {
    if (this.initialized) {
        console.warn('ExportEngine already initialized');
        return;
    }

    try {
        console.log('Initializing ExportEngine...');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Create export UI
        this.createExportUI();
        
        this.initialized = true;
        console.log('ExportEngine initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize ExportEngine:', error);
        throw error;
    }
};

/**
 * Set up event listeners
 */
ExportEngine.prototype.setupEventListeners = function() {
    var self = this;
    
    // Listen for export action
    this.eventBus.on('action:export', function(data) {
        self.showExportDialog();
    });
    
    // Listen for canvas changes to invalidate cache
    this.eventBus.on('element:created', function() {
        self.invalidateCache();
    });
    
    this.eventBus.on('element:updated', function() {
        self.invalidateCache();
    });
    
    this.eventBus.on('element:deleted', function() {
        self.invalidateCache();
    });
    
    this.eventBus.on('canvas:cleared', function() {
        self.invalidateCache();
    });
};

/**
 * Generate clean HTML markup from canvas elements
 */
ExportEngine.prototype.generateHTML = function() {
    try {
        var canvasState = this.canvasManager.state;
        var elements = canvasState.elements;
        var rootElements = canvasState.rootElements;
        
        if (!elements || Object.keys(elements).length === 0) {
            return this.generateEmptyHTML();
        }
        
        var htmlContent = this.generateHTMLContent(elements, rootElements);
        var fullHTML = this.wrapHTMLContent(htmlContent);
        
        // Cache the result
        this.cache.html = fullHTML;
        this.cache.timestamp = Date.now();
        
        return fullHTML;
        
    } catch (error) {
        console.error('Error generating HTML:', error);
        throw error;
    }
};

/**
 * Generate organized CSS with proper class names and structure
 */
ExportEngine.prototype.generateCSS = function() {
    try {
        var canvasState = this.canvasManager.state;
        var elements = canvasState.elements;
        
        if (!elements || Object.keys(elements).length === 0) {
            return this.generateEmptyCSS();
        }
        
        var cssRules = this.extractCSSRules(elements);
        var organizedCSS = this.organizeCSSRules(cssRules);
        var fullCSS = this.formatCSS(organizedCSS);
        
        // Cache the result
        this.cache.css = fullCSS;
        this.cache.timestamp = Date.now();
        
        return fullCSS;
        
    } catch (error) {
        console.error('Error generating CSS:', error);
        throw error;
    }
};

/**
 * Generate HTML content from elements
 */
ExportEngine.prototype.generateHTMLContent = function(elements, rootElements) {
    var html = [];
    
    // Process root elements in order
    for (var i = 0; i < rootElements.length; i++) {
        var elementId = rootElements[i];
        var elementData = elements[elementId];
        
        if (elementData) {
            var elementHTML = this.generateElementHTML(elementData, elements, 1);
            html.push(elementHTML);
        }
    }
    
    return html.join('\n');
};

/**
 * Generate HTML for a single element and its children
 */
ExportEngine.prototype.generateElementHTML = function(elementData, allElements, depth) {
    var indent = this.repeatString(this.config.htmlIndent, depth);
    
    // Handle form field containers (checkbox/radio with labels)
    if (elementData.type === 'checkbox-field' || elementData.type === 'radio-field') {
        return this.generateFormFieldHTML(elementData, allElements, depth);
    }
    
    var tagName = this.getHTMLTagName(elementData.type);
    var attributes = this.generateHTMLAttributes(elementData);
    var content = this.getElementContent(elementData);
    
    // Self-closing tags
    var selfClosingTags = ['img', 'input', 'br', 'hr', 'meta', 'link'];
    var isSelfClosing = selfClosingTags.indexOf(tagName) !== -1;
    
    if (isSelfClosing) {
        return indent + '<' + tagName + attributes + ' />';
    }
    
    // Opening tag
    var html = indent + '<' + tagName + attributes + '>';
    
    // Content and children
    var hasChildren = elementData.children && elementData.children.length > 0;
    var hasTextContent = content && content.trim().length > 0;
    
    if (hasChildren || hasTextContent) {
        if (hasTextContent && !hasChildren) {
            // Simple text content on same line
            html += content + '</' + tagName + '>';
        } else {
            // Multi-line with children
            html += '\n';
            
            // Add text content if present
            if (hasTextContent) {
                html += this.repeatString(this.config.htmlIndent, depth + 1) + content + '\n';
            }
            
            // Add children
            if (hasChildren) {
                for (var i = 0; i < elementData.children.length; i++) {
                    var childId = elementData.children[i];
                    var childData = allElements[childId];
                    if (childData) {
                        html += this.generateElementHTML(childData, allElements, depth + 1) + '\n';
                    }
                }
            }
            
            html += indent + '</' + tagName + '>';
        }
    } else {
        // Empty element
        html += '</' + tagName + '>';
    }
    
    return html;
};

/**
 * Generate HTML for form field containers (checkbox/radio with labels)
 */
ExportEngine.prototype.generateFormFieldHTML = function(elementData, allElements, depth) {
    var indent = this.repeatString(this.config.htmlIndent, depth);
    var html = [];
    
    // Extract input and label data from the container element
    var inputId = elementData.attributes['data-input-id'];
    var labelFor = elementData.attributes['data-label-for'];
    
    // Find the actual input and label elements in the DOM
    var containerElement = document.getElementById(elementData.id);
    if (!containerElement) return indent + '<!-- Form field container not found -->';
    
    var inputElement = containerElement.querySelector('input');
    var labelElement = containerElement.querySelector('label');
    
    if (!inputElement || !labelElement) {
        return indent + '<!-- Invalid form field structure -->';
    }
    
    // Generate input HTML
    var inputType = elementData.type === 'checkbox-field' ? 'checkbox' : 'radio';
    var inputAttributes = this.generateFormInputAttributes(inputElement, inputType);
    var inputHTML = '<input' + inputAttributes + ' />';
    
    // Generate label HTML
    var labelAttributes = this.generateFormLabelAttributes(labelElement);
    var labelText = this.escapeHTML(labelElement.textContent || '');
    var labelHTML = '<label' + labelAttributes + '>' + labelText + '</label>';
    
    // Combine input and label
    html.push(indent + '<div class="form-field">');
    html.push(indent + this.config.htmlIndent + inputHTML);
    html.push(indent + this.config.htmlIndent + labelHTML);
    html.push(indent + '</div>');
    
    return html.join('\n');
};

/**
 * Generate attributes for form input elements
 */
ExportEngine.prototype.generateFormInputAttributes = function(inputElement, inputType) {
    var attributes = [];
    
    // Add type
    attributes.push('type="' + inputType + '"');
    
    // Add standard attributes
    var standardAttrs = ['id', 'name', 'value', 'required', 'disabled', 'readonly'];
    
    for (var i = 0; i < standardAttrs.length; i++) {
        var attr = standardAttrs[i];
        var value = inputElement.getAttribute(attr);
        
        if (value !== null && value !== '') {
            if (attr === 'required' || attr === 'disabled' || attr === 'readonly') {
                // Boolean attributes
                if (value === 'true' || value === attr) {
                    attributes.push(attr);
                }
            } else {
                attributes.push(attr + '="' + this.escapeAttributeValue(value) + '"');
            }
        }
    }
    
    // Add checked state for checkbox/radio
    if (inputElement.checked) {
        attributes.push('checked');
    }
    
    return attributes.length > 0 ? ' ' + attributes.join(' ') : '';
};

/**
 * Generate attributes for form label elements
 */
ExportEngine.prototype.generateFormLabelAttributes = function(labelElement) {
    var attributes = [];
    
    var forAttr = labelElement.getAttribute('for');
    if (forAttr) {
        attributes.push('for="' + this.escapeAttributeValue(forAttr) + '"');
    }
    
    return attributes.length > 0 ? ' ' + attributes.join(' ') : '';
};

/**
 * Generate HTML attributes for an element
 */
ExportEngine.prototype.generateHTMLAttributes = function(elementData) {
    var attributes = [];
    var exportedClass = this.generateExportedClassName(elementData);
    
    // Add exported class
    if (exportedClass) {
        attributes.push('class="' + exportedClass + '"');
    }
    
    // Add other attributes (excluding internal ones)
    if (elementData.attributes) {
        for (var attr in elementData.attributes) {
            if (this.shouldIncludeAttribute(attr, elementData.attributes[attr])) {
                var value = this.escapeAttributeValue(elementData.attributes[attr]);
                attributes.push(attr + '="' + value + '"');
            }
        }
    }
    
    return attributes.length > 0 ? ' ' + attributes.join(' ') : '';
};

/**
 * Extract CSS rules from elements
 */
ExportEngine.prototype.extractCSSRules = function(elements) {
    var cssRules = {};
    
    for (var elementId in elements) {
        var elementData = elements[elementId];
        var className = this.generateExportedClassName(elementData);
        
        if (className && elementData.styles && Object.keys(elementData.styles).length > 0) {
            cssRules[className] = this.processElementStyles(elementData.styles);
        }
    }
    
    return cssRules;
};

/**
 * Process element styles for CSS export
 */
ExportEngine.prototype.processElementStyles = function(styles) {
    var processedStyles = {};
    
    for (var property in styles) {
        var value = styles[property];
        
        // Skip internal or empty styles
        if (this.shouldIncludeStyle(property, value)) {
            var cssProperty = this.convertToCSSProperty(property);
            var cssValue = this.convertToCSSValue(property, value);
            processedStyles[cssProperty] = cssValue;
        }
    }
    
    return processedStyles;
};

/**
 * Organize CSS rules by category
 */
ExportEngine.prototype.organizeCSSRules = function(cssRules) {
    if (this.config.cssOrganization === 'sequential') {
        return cssRules;
    }
    
    // Group by categories
    var organized = {
        layout: {},
        typography: {},
        colors: {},
        borders: {},
        effects: {},
        other: {}
    };
    
    for (var selector in cssRules) {
        var rules = cssRules[selector];
        var categorizedRules = this.categorizeStyles(rules);
        
        for (var category in categorizedRules) {
            if (Object.keys(categorizedRules[category]).length > 0) {
                if (!organized[category][selector]) {
                    organized[category][selector] = {};
                }
                Object.assign(organized[category][selector], categorizedRules[category]);
            }
        }
    }
    
    return organized;
};

/**
 * Format CSS rules into a string
 */
ExportEngine.prototype.formatCSS = function(cssRules) {
    var css = [];
    var indent = this.config.cssIndent;
    
    if (this.config.includeComments) {
        css.push('/* Generated by Visual Web Builder */');
        css.push('/* ' + new Date().toISOString() + ' */');
        css.push('');
    }
    
    // Add reset styles
    css.push(this.generateResetCSS());
    css.push('');
    
    if (this.config.cssOrganization === 'grouped') {
        css.push(this.formatGroupedCSS(cssRules, indent));
    } else {
        css.push(this.formatSequentialCSS(cssRules, indent));
    }
    
    // Add responsive media queries
    var mediaQueries = this.generateResponsiveMediaQueries();
    if (mediaQueries) {
        css.push('');
        css.push(mediaQueries);
    }
    
    return css.join('\n');
};

/**
 * Wrap HTML content in a complete document structure
 */
ExportEngine.prototype.wrapHTMLContent = function(content) {
    var html = [];
    
    html.push('<!DOCTYPE html>');
    html.push('<html lang="en">');
    html.push('<head>');
    
    if (this.config.includeMetaTags) {
        html.push('  <meta charset="UTF-8">');
        html.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
        html.push('  <title>Visual Web Builder Export</title>');
    }
    
    if (this.config.includeComments) {
        html.push('  <!-- Generated by Visual Web Builder -->');
        html.push('  <!-- ' + new Date().toISOString() + ' -->');
    }
    
    html.push('  <link rel="stylesheet" href="styles.css">');
    html.push('</head>');
    html.push('<body>');
    
    if (content.trim()) {
        // Add content with proper indentation
        var contentLines = content.split('\n');
        for (var i = 0; i < contentLines.length; i++) {
            if (contentLines[i].trim()) {
                html.push('  ' + contentLines[i]);
            } else {
                html.push('');
            }
        }
    }
    
    html.push('</body>');
    html.push('</html>');
    
    return html.join('\n');
};

/**
 * Generate empty HTML template
 */
ExportEngine.prototype.generateEmptyHTML = function() {
    return this.wrapHTMLContent('  <!-- Your content will appear here -->');
};

/**
 * Generate empty CSS template
 */
ExportEngine.prototype.generateEmptyCSS = function() {
    var css = [];
    
    if (this.config.includeComments) {
        css.push('/* Generated by Visual Web Builder */');
        css.push('/* ' + new Date().toISOString() + ' */');
        css.push('');
    }
    
    css.push(this.generateResetCSS());
    css.push('');
    css.push('/* Your styles will appear here */');
    
    return css.join('\n');
};

/**
 * Generate basic CSS reset
 */
ExportEngine.prototype.generateResetCSS = function() {
    return [
        '/* Basic Reset */',
        '* {',
        '  margin: 0;',
        '  padding: 0;',
        '  box-sizing: border-box;',
        '}',
        '',
        'body {',
        '  font-family: system-ui, -apple-system, sans-serif;',
        '  line-height: 1.6;',
        '  color: #333;',
        '}'
    ].join('\n');
};

/**
 * Format grouped CSS
 */
ExportEngine.prototype.formatGroupedCSS = function(cssRules, indent) {
    var css = [];
    var categories = ['layout', 'typography', 'colors', 'borders', 'effects', 'other'];
    var categoryTitles = {
        layout: 'Layout & Positioning',
        typography: 'Typography',
        colors: 'Colors & Backgrounds',
        borders: 'Borders & Outlines',
        effects: 'Effects & Transforms',
        other: 'Other Styles'
    };
    
    for (var i = 0; i < categories.length; i++) {
        var category = categories[i];
        var rules = cssRules[category];
        
        if (rules && Object.keys(rules).length > 0) {
            if (this.config.includeComments) {
                css.push('/* ' + categoryTitles[category] + ' */');
            }
            
            css.push(this.formatCSSRules(rules, indent));
            css.push('');
        }
    }
    
    return css.join('\n');
};

/**
 * Format sequential CSS
 */
ExportEngine.prototype.formatSequentialCSS = function(cssRules, indent) {
    return this.formatCSSRules(cssRules, indent);
};

/**
 * Format CSS rules object into string
 */
ExportEngine.prototype.formatCSSRules = function(rules, indent) {
    var css = [];
    
    for (var selector in rules) {
        var properties = rules[selector];
        
        if (Object.keys(properties).length === 0) continue;
        
        css.push('.' + selector + ' {');
        
        for (var property in properties) {
            css.push(indent + property + ': ' + properties[property] + ';');
        }
        
        css.push('}');
        css.push('');
    }
    
    return css.join('\n');
};

/**
 * Categorize styles by type
 */
ExportEngine.prototype.categorizeStyles = function(styles) {
    var categories = {
        layout: {},
        typography: {},
        colors: {},
        borders: {},
        effects: {},
        other: {}
    };
    
    var categoryMap = {
        // Layout
        'display': 'layout',
        'position': 'layout',
        'top': 'layout',
        'right': 'layout',
        'bottom': 'layout',
        'left': 'layout',
        'width': 'layout',
        'height': 'layout',
        'min-width': 'layout',
        'min-height': 'layout',
        'max-width': 'layout',
        'max-height': 'layout',
        'margin': 'layout',
        'margin-top': 'layout',
        'margin-right': 'layout',
        'margin-bottom': 'layout',
        'margin-left': 'layout',
        'padding': 'layout',
        'padding-top': 'layout',
        'padding-right': 'layout',
        'padding-bottom': 'layout',
        'padding-left': 'layout',
        'float': 'layout',
        'clear': 'layout',
        'overflow': 'layout',
        'z-index': 'layout',
        
        // Typography
        'font-family': 'typography',
        'font-size': 'typography',
        'font-weight': 'typography',
        'font-style': 'typography',
        'line-height': 'typography',
        'text-align': 'typography',
        'text-decoration': 'typography',
        'text-transform': 'typography',
        'letter-spacing': 'typography',
        'word-spacing': 'typography',
        
        // Colors
        'color': 'colors',
        'background': 'colors',
        'background-color': 'colors',
        'background-image': 'colors',
        'background-size': 'colors',
        'background-position': 'colors',
        'background-repeat': 'colors',
        
        // Borders
        'border': 'borders',
        'border-top': 'borders',
        'border-right': 'borders',
        'border-bottom': 'borders',
        'border-left': 'borders',
        'border-width': 'borders',
        'border-style': 'borders',
        'border-color': 'borders',
        'border-radius': 'borders',
        'outline': 'borders',
        
        // Effects
        'box-shadow': 'effects',
        'text-shadow': 'effects',
        'opacity': 'effects',
        'transform': 'effects',
        'transition': 'effects',
        'animation': 'effects'
    };
    
    for (var property in styles) {
        var category = categoryMap[property] || 'other';
        categories[category][property] = styles[property];
    }
    
    return categories;
};

/**
 * Generate exported class name for an element
 */
ExportEngine.prototype.generateExportedClassName = function(elementData) {
    var baseClass = this.config.exportedClassPrefix + elementData.type;
    var uniqueId = elementData.id.replace(/^vwb-element-/, '');
    return baseClass + '-' + uniqueId;
};

/**
 * Get HTML tag name for element type
 */
ExportEngine.prototype.getHTMLTagName = function(elementType) {
    var tagMap = {
        'div': 'div',
        'paragraph': 'p',
        'heading1': 'h1',
        'heading2': 'h2',
        'heading3': 'h3',
        'heading4': 'h4',
        'heading5': 'h5',
        'heading6': 'h6',
        'button': 'button',
        'input': 'input',
        'textarea': 'textarea',
        'select': 'select',
        'checkbox': 'input',
        'radio': 'input',
        'label': 'label',
        'image': 'img',
        'link': 'a',
        'span': 'span',
        'section': 'section',
        'article': 'article',
        'header': 'header',
        'footer': 'footer',
        'nav': 'nav',
        'aside': 'aside'
    };
    
    return tagMap[elementType] || 'div';
};

/**
 * Get element content for export
 */
ExportEngine.prototype.getElementContent = function(elementData) {
    if (!elementData.content) return '';
    
    // Escape HTML content
    return this.escapeHTML(elementData.content);
};

/**
 * Check if attribute should be included in export
 */
ExportEngine.prototype.shouldIncludeAttribute = function(name, value) {
    // Skip internal attributes
    var skipAttributes = ['data-vwb-type', 'data-vwb-id', 'data-vwb-created', 'data-input-id', 'data-label-for'];
    
    if (skipAttributes.indexOf(name) !== -1) return false;
    if (name.indexOf('data-vwb-') === 0) return false;
    
    // Handle boolean attributes
    var booleanAttributes = ['required', 'disabled', 'readonly', 'multiple', 'checked', 'selected'];
    if (booleanAttributes.indexOf(name) !== -1) {
        return value === 'true' || value === true || value === name;
    }
    
    // Skip empty values for non-boolean attributes
    if (!value || value.trim() === '') return false;
    
    return true;
};

/**
 * Check if style should be included in export
 */
ExportEngine.prototype.shouldIncludeStyle = function(property, value) {
    // Skip internal or default styles
    if (!value || value === '' || value === 'auto' || value === 'initial') return false;
    if (property.indexOf('vwb-') === 0) return false;
    
    // Skip min-height and min-width if they're just defaults
    if ((property === 'minHeight' || property === 'min-height') && value === '20px') return false;
    if ((property === 'minWidth' || property === 'min-width') && value === '20px') return false;
    
    return true;
};

/**
 * Convert JavaScript style property to CSS property
 */
ExportEngine.prototype.convertToCSSProperty = function(jsProperty) {
    // Convert camelCase to kebab-case
    return jsProperty.replace(/([A-Z])/g, '-$1').toLowerCase();
};

/**
 * Convert JavaScript style value to CSS value
 */
ExportEngine.prototype.convertToCSSValue = function(property, value) {
    // Add units if needed
    var unitlessProperties = [
        'opacity', 'z-index', 'font-weight', 'line-height', 'flex-grow', 
        'flex-shrink', 'order', 'column-count', 'fill-opacity'
    ];
    
    var cssProperty = this.convertToCSSProperty(property);
    
    if (typeof value === 'number' && unitlessProperties.indexOf(cssProperty) === -1) {
        return value + 'px';
    }
    
    return value;
};

/**
 * Escape HTML content
 */
ExportEngine.prototype.escapeHTML = function(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

/**
 * Escape attribute value
 */
ExportEngine.prototype.escapeAttributeValue = function(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

/**
 * Repeat string n times
 */
ExportEngine.prototype.repeatString = function(str, count) {
    var result = '';
    for (var i = 0; i < count; i++) {
        result += str;
    }
    return result;
};

/**
 * Invalidate cached code
 */
ExportEngine.prototype.invalidateCache = function() {
    this.cache.html = null;
    this.cache.css = null;
    this.cache.timestamp = null;
};

/**
 * Create export UI dialog
 */
ExportEngine.prototype.createExportUI = function() {
    this.createExportDialog();
};

/**
 * Create export dialog
 */
ExportEngine.prototype.createExportDialog = function() {
    var self = this;
    
    this.ui.exportDialog = DOMUtils.createElement('div', {
        className: 'vwb-modal vwb-export-dialog',
        styles: {
            display: 'none',
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: '10000',
            justifyContent: 'center',
            alignItems: 'center'
        }
    });
    
    var dialogContent = DOMUtils.createElement('div', {
        className: 'vwb-modal-content',
        styles: {
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            minWidth: '700px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column'
        }
    });
    
    var title = DOMUtils.createElement('h3', {
        textContent: 'Export Code',
        styles: {
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#2c3e50'
        }
    });
    
    var tabContainer = this.createTabContainer();
    var codeContainer = this.createCodeContainer();
    var buttonContainer = this.createExportButtons();
    
    // Event listeners
    DOMUtils.addEventListener(this.ui.exportDialog, 'click', function(event) {
        if (event.target === self.ui.exportDialog) {
            self.hideExportDialog();
        }
    });
    
    // Assemble dialog
    dialogContent.appendChild(title);
    dialogContent.appendChild(tabContainer);
    dialogContent.appendChild(codeContainer);
    dialogContent.appendChild(buttonContainer);
    this.ui.exportDialog.appendChild(dialogContent);
    
    document.body.appendChild(this.ui.exportDialog);
};

/**
 * Create tab container for HTML/CSS switching
 */
ExportEngine.prototype.createTabContainer = function() {
    var self = this;
    
    var tabContainer = DOMUtils.createElement('div', {
        className: 'vwb-export-tabs',
        styles: {
            display: 'flex',
            borderBottom: '1px solid #ddd',
            marginBottom: '16px'
        }
    });
    
    var htmlTab = DOMUtils.createElement('button', {
        className: 'vwb-export-tab active',
        textContent: 'HTML',
        attributes: { 'data-tab': 'html' },
        styles: {
            padding: '10px 20px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            borderBottom: '2px solid #3498db',
            color: '#3498db'
        }
    });
    
    var cssTab = DOMUtils.createElement('button', {
        className: 'vwb-export-tab',
        textContent: 'CSS',
        attributes: { 'data-tab': 'css' },
        styles: {
            padding: '10px 20px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            borderBottom: '2px solid transparent',
            color: '#666'
        }
    });
    
    // Tab click handlers
    DOMUtils.addEventListener(htmlTab, 'click', function() {
        self.switchTab('html');
    });
    
    DOMUtils.addEventListener(cssTab, 'click', function() {
        self.switchTab('css');
    });
    
    tabContainer.appendChild(htmlTab);
    tabContainer.appendChild(cssTab);
    
    return tabContainer;
};

/**
 * Create code preview container
 */
ExportEngine.prototype.createCodeContainer = function() {
    this.ui.codePreview = DOMUtils.createElement('textarea', {
        className: 'vwb-code-preview',
        attributes: {
            readonly: true,
            spellcheck: false
        },
        styles: {
            flex: '1',
            minHeight: '400px',
            padding: '16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            fontSize: '12px',
            lineHeight: '1.4',
            backgroundColor: '#f8f9fa',
            color: '#2c3e50',
            resize: 'vertical',
            marginBottom: '16px'
        }
    });
    
    return this.ui.codePreview;
};

/**
 * Create export buttons
 */
ExportEngine.prototype.createExportButtons = function() {
    var self = this;
    
    var buttonContainer = DOMUtils.createElement('div', {
        styles: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }
    });
    
    var leftButtons = DOMUtils.createElement('div', {
        styles: {
            display: 'flex',
            gap: '12px'
        }
    });
    
    var copyButton = DOMUtils.createElement('button', {
        textContent: 'Copy to Clipboard',
        styles: {
            padding: '10px 20px',
            border: '1px solid #3498db',
            borderRadius: '4px',
            backgroundColor: 'white',
            color: '#3498db',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
        }
    });
    
    var downloadButton = DOMUtils.createElement('button', {
        textContent: 'Download Files',
        styles: {
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#3498db',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
        }
    });
    
    var rightButtons = DOMUtils.createElement('div', {
        styles: {
            display: 'flex',
            gap: '12px'
        }
    });
    
    var closeButton = DOMUtils.createElement('button', {
        textContent: 'Close',
        styles: {
            padding: '10px 20px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white',
            color: '#666',
            cursor: 'pointer',
            fontSize: '14px'
        }
    });
    
    // Event listeners
    DOMUtils.addEventListener(copyButton, 'click', function() {
        self.copyToClipboard();
    });
    
    DOMUtils.addEventListener(downloadButton, 'click', function() {
        self.downloadFiles();
    });
    
    DOMUtils.addEventListener(closeButton, 'click', function() {
        self.hideExportDialog();
    });
    
    leftButtons.appendChild(copyButton);
    leftButtons.appendChild(downloadButton);
    rightButtons.appendChild(closeButton);
    buttonContainer.appendChild(leftButtons);
    buttonContainer.appendChild(rightButtons);
    
    return buttonContainer;
};

/**
 * Show export dialog
 */
ExportEngine.prototype.showExportDialog = function() {
    if (!this.ui.exportDialog) return;
    
    // Generate fresh code
    this.generateHTML();
    this.generateCSS();
    
    // Show HTML tab by default
    this.switchTab('html');
    
    this.ui.exportDialog.style.display = 'flex';
    
    console.log('Export dialog opened');
};

/**
 * Hide export dialog
 */
ExportEngine.prototype.hideExportDialog = function() {
    if (this.ui.exportDialog) {
        this.ui.exportDialog.style.display = 'none';
    }
};

/**
 * Switch between HTML and CSS tabs
 */
ExportEngine.prototype.switchTab = function(tabType) {
    var tabs = this.ui.exportDialog.querySelectorAll('.vwb-export-tab');
    
    // Update tab appearance
    for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        if (tab.getAttribute('data-tab') === tabType) {
            DOMUtils.addClass(tab, 'active');
            DOMUtils.setStyles(tab, {
                borderBottomColor: '#3498db',
                color: '#3498db'
            });
        } else {
            DOMUtils.removeClass(tab, 'active');
            DOMUtils.setStyles(tab, {
                borderBottomColor: 'transparent',
                color: '#666'
            });
        }
    }
    
    // Update code preview
    if (tabType === 'html') {
        this.ui.codePreview.value = this.cache.html || this.generateHTML();
    } else if (tabType === 'css') {
        this.ui.codePreview.value = this.cache.css || this.generateCSS();
    }
    
    this.currentTab = tabType;
};

/**
 * Copy current code to clipboard
 */
ExportEngine.prototype.copyToClipboard = function() {
    if (!this.ui.codePreview) return;
    
    try {
        this.ui.codePreview.select();
        document.execCommand('copy');
        
        // Show success notification
        this.eventBus.emit('notification:show', {
            message: 'Code copied to clipboard!',
            type: 'success'
        });
        
        console.log('Code copied to clipboard');
        
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        
        this.eventBus.emit('notification:show', {
            message: 'Failed to copy to clipboard',
            type: 'error'
        });
    }
};

/**
 * Download HTML and CSS files
 */
ExportEngine.prototype.downloadFiles = function() {
    try {
        var html = this.cache.html || this.generateHTML();
        var css = this.cache.css || this.generateCSS();
        
        // Download HTML file
        this.downloadFile('index.html', html, 'text/html');
        
        // Download CSS file
        this.downloadFile('styles.css', css, 'text/css');
        
        // Show success notification
        this.eventBus.emit('notification:show', {
            message: 'Files downloaded successfully!',
            type: 'success'
        });
        
        console.log('Files downloaded');
        
    } catch (error) {
        console.error('Failed to download files:', error);
        
        this.eventBus.emit('notification:show', {
            message: 'Failed to download files',
            type: 'error'
        });
    }
};

/**
 * Download a single file
 */
ExportEngine.prototype.downloadFile = function(filename, content, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(function() {
        URL.revokeObjectURL(url);
    }, 100);
};

/**
 * Create preview of exported code
 */
ExportEngine.prototype.createPreview = function() {
    try {
        var html = this.generateHTML();
        var css = this.generateCSS();
        
        // Create preview window
        var previewWindow = window.open('', '_blank', 'width=800,height=600');
        
        if (!previewWindow) {
            throw new Error('Failed to open preview window. Please allow popups.');
        }
        
        // Write content to preview window
        previewWindow.document.write(html.replace('<link rel="stylesheet" href="styles.css">', '<style>' + css + '</style>'));
        previewWindow.document.close();
        
        console.log('Preview window opened');
        
        return previewWindow;
        
    } catch (error) {
        console.error('Failed to create preview:', error);
        throw error;
    }
};

/**
 * Get export statistics
 */
ExportEngine.prototype.getExportStats = function() {
    var canvasState = this.canvasManager.state;
    var elements = canvasState.elements;
    
    var stats = {
        elementCount: Object.keys(elements).length,
        rootElementCount: canvasState.rootElements.length,
        hasStyles: false,
        hasContent: false,
        timestamp: new Date().toISOString()
    };
    
    // Check for styles and content
    for (var elementId in elements) {
        var elementData = elements[elementId];
        
        if (elementData.styles && Object.keys(elementData.styles).length > 0) {
            stats.hasStyles = true;
        }
        
        if (elementData.content && elementData.content.trim()) {
            stats.hasContent = true;
        }
        
        if (stats.hasStyles && stats.hasContent) break;
    }
    
    return stats;
};

/**
 * Generate responsive media queries
 */
ExportEngine.prototype.generateResponsiveMediaQueries = function() {
    // Check if ResponsiveManager is available
    if (!window.visualWebBuilder || !window.visualWebBuilder.responsiveManager) {
        return null;
    }
    
    var responsiveManager = window.visualWebBuilder.responsiveManager;
    var responsiveData = responsiveManager.exportResponsiveData();
    
    if (!responsiveData.responsiveStyles || Object.keys(responsiveData.responsiveStyles).length === 0) {
        return null;
    }
    
    var css = [];
    var breakpoints = responsiveData.breakpoints;
    var responsiveStyles = responsiveData.responsiveStyles;
    
    // Generate media queries for tablet and mobile (desktop is default)
    var viewports = ['tablet', 'mobile'];
    
    for (var i = 0; i < viewports.length; i++) {
        var viewport = viewports[i];
        var breakpoint = breakpoints[viewport];
        
        if (!breakpoint) continue;
        
        var viewportRules = this.generateViewportMediaQuery(viewport, breakpoint, responsiveStyles);
        
        if (viewportRules) {
            css.push(viewportRules);
        }
    }
    
    return css.length > 0 ? css.join('\n\n') : null;
};

/**
 * Generate media query for specific viewport
 */
ExportEngine.prototype.generateViewportMediaQuery = function(viewport, breakpoint, responsiveStyles) {
    var rules = [];
    
    // Collect all rules for this viewport
    for (var elementId in responsiveStyles) {
        var elementStyles = responsiveStyles[elementId];
        
        if (elementStyles[viewport] && Object.keys(elementStyles[viewport]).length > 0) {
            var className = this.generateResponsiveClassName(elementId);
            var styles = this.processElementStyles(elementStyles[viewport]);
            
            if (className && Object.keys(styles).length > 0) {
                rules.push({
                    selector: className,
                    styles: styles
                });
            }
        }
    }
    
    if (rules.length === 0) return null;
    
    // Format media query
    var css = [];
    var maxWidth = breakpoint.width;
    
    if (this.config.includeComments) {
        css.push('/* ' + breakpoint.label + ' Styles */');
    }
    
    css.push('@media (max-width: ' + maxWidth + 'px) {');
    
    for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        css.push('  .' + rule.selector + ' {');
        
        for (var property in rule.styles) {
            css.push('    ' + property + ': ' + rule.styles[property] + ';');
        }
        
        css.push('  }');
        
        if (i < rules.length - 1) {
            css.push('');
        }
    }
    
    css.push('}');
    
    return css.join('\n');
};

/**
 * Generate responsive class name for element
 */
ExportEngine.prototype.generateResponsiveClassName = function(elementId) {
    // Get element data from canvas manager
    if (!window.visualWebBuilder || !window.visualWebBuilder.canvasManager) {
        return null;
    }
    
    var canvasManager = window.visualWebBuilder.canvasManager;
    var elementData = canvasManager.state.elements[elementId];
    
    if (!elementData) return null;
    
    return this.generateExportedClassName(elementData);
};

/**
 * Clean up resources
 */
ExportEngine.prototype.destroy = function() {
    if (!this.initialized) return;
    
    // Remove UI elements
    if (this.ui.exportDialog) {
        DOMUtils.removeElement(this.ui.exportDialog);
    }
    
    // Clear cache
    this.invalidateCache();
    
    // Reset state
    this.initialized = false;
    this.ui = {
        exportDialog: null,
        codePreview: null,
        downloadButtons: null
    };
    
    console.log('ExportEngine destroyed');
};
