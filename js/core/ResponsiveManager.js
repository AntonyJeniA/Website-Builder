/**
 * ResponsiveManager - Responsive Design Capabilities
 * 
 * This class manages responsive design features including viewport size controls,
 * canvas resizing functionality, responsive property editing with breakpoint support,
 * media query generation in exported CSS, and responsive preview testing.
 */

function ResponsiveManager(canvasManager, propertyEditor, exportEngine, eventBus) {
    this.canvasManager = canvasManager;
    this.propertyEditor = propertyEditor;
    this.exportEngine = exportEngine;
    this.eventBus = eventBus;
    this.initialized = false;
    
    // Current responsive state
    this.state = {
        currentViewport: 'desktop',
        breakpoints: {
            desktop: { width: 1200, label: 'Desktop' },
            tablet: { width: 768, label: 'Tablet' },
            mobile: { width: 375, label: 'Mobile' }
        },
        responsiveStyles: {} // elementId -> { viewport -> styles }
    };
    
    // DOM references
    this.elements = {
        canvas: null,
        canvasContainer: null,
        viewportButtons: null,
        viewportIndicator: null
    };
    
    // Configuration
    this.config = {
        transitionDuration: 300,
        defaultBreakpoints: {
            desktop: 1200,
            tablet: 768,
            mobile: 375
        }
    };
}

/**
 * Initialize the responsive manager
 */
ResponsiveManager.prototype.init = function() {
    if (this.initialized) {
        console.warn('ResponsiveManager already initialized');
        return;
    }

    try {
        console.log('Initializing ResponsiveManager...');
        
        // Get DOM references
        this.getDOMReferences();
        
        // Set up viewport controls
        this.setupViewportControls();
        
        // Create viewport indicator
        this.createViewportIndicator();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize with desktop viewport
        this.switchViewport('desktop');
        
        this.initialized = true;
        console.log('ResponsiveManager initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize ResponsiveManager:', error);
        throw error;
    }
};

/**
 * Get DOM references
 */
ResponsiveManager.prototype.getDOMReferences = function() {
    this.elements.canvas = document.getElementById('main-canvas');
    this.elements.canvasContainer = document.querySelector('.canvas-container');
    this.elements.viewportButtons = document.querySelectorAll('.viewport-btn');
    
    if (!this.elements.canvas || !this.elements.canvasContainer) {
        throw new Error('ResponsiveManager: Required DOM elements not found');
    }
    
    if (!this.elements.viewportButtons || this.elements.viewportButtons.length === 0) {
        throw new Error('ResponsiveManager: Viewport buttons not found');
    }
};

/**
 * Set up viewport controls
 */
ResponsiveManager.prototype.setupViewportControls = function() {
    var self = this;
    
    // Add click handlers to viewport buttons
    for (var i = 0; i < this.elements.viewportButtons.length; i++) {
        var button = this.elements.viewportButtons[i];
        var viewport = button.getAttribute('data-viewport');
        
        DOMUtils.addEventListener(button, 'click', function(event) {
            var targetViewport = event.target.getAttribute('data-viewport');
            self.switchViewport(targetViewport);
        });
    }
};

/**
 * Create viewport size indicator
 */
ResponsiveManager.prototype.createViewportIndicator = function() {
    this.elements.viewportIndicator = DOMUtils.createElement('div', {
        className: 'viewport-indicator',
        styles: {
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(44, 62, 80, 0.9)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            zIndex: '998',
            display: 'none',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }
    });
    
    this.elements.canvas.appendChild(this.elements.viewportIndicator);
};

/**
 * Set up event listeners
 */
ResponsiveManager.prototype.setupEventListeners = function() {
    var self = this;
    
    // Listen for element selection to show responsive properties
    this.eventBus.on('element:selected', function(data) {
        self.handleElementSelected(data);
    });
    
    // Listen for property updates to store responsive styles
    this.eventBus.on('property:update', function(data) {
        self.handlePropertyUpdate(data);
    });
    
    // Listen for canvas resize events
    this.eventBus.on('canvas:resize', function(data) {
        self.updateViewportIndicator();
    });
    
    // Listen for export events to include media queries
    this.eventBus.on('export:generate-css', function(data) {
        self.enhanceExportedCSS(data);
    });
    
    // Window resize handler for responsive preview
    DOMUtils.addEventListener(window, 'resize', DOMUtils.debounce(function() {
        self.updateViewportIndicator();
    }, 250));
};

/**
 * Switch to a different viewport size
 */
ResponsiveManager.prototype.switchViewport = function(viewport) {
    if (!this.state.breakpoints[viewport]) {
        console.warn('ResponsiveManager: Unknown viewport', viewport);
        return;
    }
    
    var previousViewport = this.state.currentViewport;
    this.state.currentViewport = viewport;
    
    // Update button states
    this.updateViewportButtons();
    
    // Resize canvas
    this.resizeCanvas(viewport);
    
    // Update viewport indicator
    this.updateViewportIndicator();
    
    // Load responsive styles for current viewport
    this.loadResponsiveStyles(viewport);
    
    // Update breakpoint selector in property editor
    var breakpointSelector = document.querySelector('.responsive-breakpoint-selector');
    if (breakpointSelector) {
        this.updateBreakpointSelector(breakpointSelector);
    }
    
    // Update property editor with responsive values for new viewport
    if (window.visualWebBuilder && window.visualWebBuilder.propertyEditor) {
        setTimeout(function() {
            window.visualWebBuilder.propertyEditor.updateResponsivePropertyControls();
        }, 100);
    }
    
    // Emit viewport change event
    this.eventBus.emit('viewport:changed', {
        previousViewport: previousViewport,
        currentViewport: viewport,
        breakpoint: this.state.breakpoints[viewport]
    });
    
    console.log('ResponsiveManager: Switched to', viewport, 'viewport');
};

/**
 * Update viewport button states
 */
ResponsiveManager.prototype.updateViewportButtons = function() {
    for (var i = 0; i < this.elements.viewportButtons.length; i++) {
        var button = this.elements.viewportButtons[i];
        var buttonViewport = button.getAttribute('data-viewport');
        
        if (buttonViewport === this.state.currentViewport) {
            DOMUtils.addClass(button, 'active');
        } else {
            DOMUtils.removeClass(button, 'active');
        }
    }
};

/**
 * Resize canvas for viewport
 */
ResponsiveManager.prototype.resizeCanvas = function(viewport) {
    var breakpoint = this.state.breakpoints[viewport];
    var canvas = this.elements.canvas;
    
    if (!breakpoint || !canvas) return;
    
    // Calculate canvas width based on viewport
    var canvasWidth = breakpoint.width + 'px';
    var maxWidth = breakpoint.width + 'px';
    
    // Apply canvas sizing with smooth transition
    DOMUtils.setStyles(canvas, {
        width: canvasWidth,
        maxWidth: maxWidth,
        transition: 'all ' + this.config.transitionDuration + 'ms ease',
        margin: '0 auto'
    });
    
    // Update canvas container for centering
    DOMUtils.setStyles(this.elements.canvasContainer, {
        justifyContent: 'center',
        alignItems: 'flex-start'
    });
    
    // Remove transition after animation completes
    setTimeout(function() {
        canvas.style.transition = '';
    }, this.config.transitionDuration);
    
    // Emit canvas resize event
    this.eventBus.emit('canvas:resized', {
        viewport: viewport,
        width: breakpoint.width,
        canvas: canvas
    });
};

/**
 * Update viewport indicator
 */
ResponsiveManager.prototype.updateViewportIndicator = function() {
    if (!this.elements.viewportIndicator) return;
    
    var breakpoint = this.state.breakpoints[this.state.currentViewport];
    var canvas = this.elements.canvas;
    
    if (!breakpoint || !canvas) return;
    
    var canvasRect = canvas.getBoundingClientRect();
    var indicatorText = breakpoint.label + ' (' + Math.round(canvasRect.width) + 'px)';
    
    this.elements.viewportIndicator.textContent = indicatorText;
    DOMUtils.addClass(this.elements.viewportIndicator, 'show');
    this.elements.viewportIndicator.style.display = 'block';
    
    // Auto-hide after 3 seconds
    var self = this;
    clearTimeout(this.indicatorTimeout);
    this.indicatorTimeout = setTimeout(function() {
        if (self.elements.viewportIndicator) {
            DOMUtils.removeClass(self.elements.viewportIndicator, 'show');
            setTimeout(function() {
                if (self.elements.viewportIndicator) {
                    self.elements.viewportIndicator.style.display = 'none';
                }
            }, 300);
        }
    }, 3000);
};

/**
 * Handle element selection for responsive properties
 */
ResponsiveManager.prototype.handleElementSelected = function(data) {
    var element = data.element;
    var elementId = element.getAttribute('data-vwb-id');
    
    if (!elementId) return;
    
    // Load responsive styles for the selected element
    this.loadElementResponsiveStyles(elementId);
    
    // Update property editor with responsive controls
    this.enhancePropertyEditor(elementId);
    
    // Update property editor with responsive values
    setTimeout(function() {
        if (window.visualWebBuilder && window.visualWebBuilder.propertyEditor) {
            window.visualWebBuilder.propertyEditor.updateResponsivePropertyControls();
        }
    }, 100);
};

/**
 * Handle property updates to store responsive styles
 */
ResponsiveManager.prototype.handlePropertyUpdate = function(data) {
    var element = data.element;
    var elementId = element.getAttribute('data-vwb-id');
    var currentViewport = this.state.currentViewport;
    
    if (!elementId || !data.updateData || !data.updateData.styles) return;
    
    // Store responsive styles
    if (!this.state.responsiveStyles[elementId]) {
        this.state.responsiveStyles[elementId] = {};
    }
    
    if (!this.state.responsiveStyles[elementId][currentViewport]) {
        this.state.responsiveStyles[elementId][currentViewport] = {};
    }
    
    // Merge new styles with existing responsive styles
    Object.assign(
        this.state.responsiveStyles[elementId][currentViewport],
        data.updateData.styles
    );
    
    console.log('ResponsiveManager: Stored responsive styles for', elementId, 'in', currentViewport);
};

/**
 * Load responsive styles for current viewport
 */
ResponsiveManager.prototype.loadResponsiveStyles = function(viewport) {
    var canvasElements = this.elements.canvas.querySelectorAll('.vwb-canvas-element');
    
    for (var i = 0; i < canvasElements.length; i++) {
        var element = canvasElements[i];
        var elementId = element.getAttribute('data-vwb-id');
        
        if (elementId) {
            this.applyResponsiveStyles(element, elementId, viewport);
        }
    }
};

/**
 * Apply responsive styles to an element
 */
ResponsiveManager.prototype.applyResponsiveStyles = function(element, elementId, viewport) {
    var responsiveStyles = this.state.responsiveStyles[elementId];
    
    if (!responsiveStyles || !responsiveStyles[viewport]) return;
    
    var styles = responsiveStyles[viewport];
    DOMUtils.setStyles(element, styles);
    
    console.log('ResponsiveManager: Applied responsive styles for', elementId, 'in', viewport);
};

/**
 * Load responsive styles for a specific element
 */
ResponsiveManager.prototype.loadElementResponsiveStyles = function(elementId) {
    var element = document.getElementById(elementId);
    if (!element) return;
    
    var currentViewport = this.state.currentViewport;
    this.applyResponsiveStyles(element, elementId, currentViewport);
};

/**
 * Enhance property editor with responsive controls
 */
ResponsiveManager.prototype.enhancePropertyEditor = function(elementId) {
    // Add responsive breakpoint selector to property editor
    this.addBreakpointSelector();
    
    // Add responsive property indicators
    this.addResponsivePropertyIndicators(elementId);
};

/**
 * Add breakpoint selector to property editor
 */
ResponsiveManager.prototype.addBreakpointSelector = function() {
    var propertyContent = document.querySelector('.property-content');
    if (!propertyContent) return;
    
    // Check if breakpoint selector already exists
    var existingSelector = propertyContent.querySelector('.responsive-breakpoint-selector');
    if (existingSelector) {
        this.updateBreakpointSelector(existingSelector);
        return;
    }
    
    var self = this;
    
    // Create breakpoint selector
    var selectorContainer = DOMUtils.createElement('div', {
        className: 'responsive-breakpoint-selector',
        styles: {
            background: '#f8f9fa',
            border: '1px solid #e1e8ed',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '16px'
        }
    });
    
    var selectorLabel = DOMUtils.createElement('div', {
        className: 'responsive-selector-label',
        textContent: 'Editing styles for:',
        styles: {
            fontSize: '12px',
            fontWeight: '500',
            color: '#6c757d',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        }
    });
    
    var buttonContainer = DOMUtils.createElement('div', {
        className: 'responsive-buttons',
        styles: {
            display: 'flex',
            gap: '4px',
            background: 'white',
            borderRadius: '4px',
            padding: '4px'
        }
    });
    
    // Create breakpoint buttons
    var viewports = ['desktop', 'tablet', 'mobile'];
    for (var i = 0; i < viewports.length; i++) {
        var viewport = viewports[i];
        var breakpoint = this.state.breakpoints[viewport];
        
        var button = DOMUtils.createElement('button', {
            className: 'responsive-breakpoint-btn' + (viewport === this.state.currentViewport ? ' active' : ''),
            textContent: breakpoint.label,
            attributes: {
                'data-viewport': viewport,
                'title': 'Switch to ' + breakpoint.label + ' (' + breakpoint.width + 'px)'
            },
            styles: {
                flex: '1',
                padding: '6px 12px',
                border: 'none',
                borderRadius: '3px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: viewport === this.state.currentViewport ? '#3498db' : 'transparent',
                color: viewport === this.state.currentViewport ? 'white' : '#6c757d'
            }
        });
        
        DOMUtils.addEventListener(button, 'click', function(event) {
            var targetViewport = event.target.getAttribute('data-viewport');
            self.switchViewport(targetViewport);
        });
        
        buttonContainer.appendChild(button);
    }
    
    selectorContainer.appendChild(selectorLabel);
    selectorContainer.appendChild(buttonContainer);
    
    // Insert at the beginning of property content
    propertyContent.insertBefore(selectorContainer, propertyContent.firstChild);
};

/**
 * Update breakpoint selector active state
 */
ResponsiveManager.prototype.updateBreakpointSelector = function(selectorContainer) {
    var buttons = selectorContainer.querySelectorAll('.responsive-breakpoint-btn');
    
    for (var i = 0; i < buttons.length; i++) {
        var button = buttons[i];
        var viewport = button.getAttribute('data-viewport');
        
        if (viewport === this.state.currentViewport) {
            DOMUtils.addClass(button, 'active');
            DOMUtils.setStyles(button, {
                background: '#3498db',
                color: 'white'
            });
        } else {
            DOMUtils.removeClass(button, 'active');
            DOMUtils.setStyles(button, {
                background: 'transparent',
                color: '#6c757d'
            });
        }
    }
};

/**
 * Add responsive property indicators
 */
ResponsiveManager.prototype.addResponsivePropertyIndicators = function(elementId) {
    var responsiveStyles = this.state.responsiveStyles[elementId];
    if (!responsiveStyles) return;
    
    var propertyControls = document.querySelectorAll('.property-control');
    
    for (var i = 0; i < propertyControls.length; i++) {
        var control = propertyControls[i];
        var propertyName = control.getAttribute('data-property');
        
        if (propertyName) {
            this.addPropertyIndicator(control, propertyName, responsiveStyles);
        }
    }
};

/**
 * Add indicator to property control
 */
ResponsiveManager.prototype.addPropertyIndicator = function(control, propertyName, responsiveStyles) {
    // Check if property has responsive values
    var hasResponsiveValues = false;
    var viewportsWithValues = [];
    
    for (var viewport in responsiveStyles) {
        if (responsiveStyles[viewport] && responsiveStyles[viewport][propertyName]) {
            hasResponsiveValues = true;
            viewportsWithValues.push(viewport);
        }
    }
    
    if (!hasResponsiveValues) return;
    
    // Remove existing indicator
    var existingIndicator = control.querySelector('.responsive-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Create responsive indicator
    var indicator = DOMUtils.createElement('div', {
        className: 'responsive-indicator',
        title: 'Has responsive values for: ' + viewportsWithValues.join(', '),
        styles: {
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '8px',
            height: '8px',
            background: '#3498db',
            borderRadius: '50%',
            fontSize: '10px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }
    });
    
    // Make control relative positioned
    control.style.position = 'relative';
    control.appendChild(indicator);
};

/**
 * Enhance exported CSS with media queries
 */
ResponsiveManager.prototype.enhanceExportedCSS = function(data) {
    if (!data.cssRules) return;
    
    var mediaQueries = this.generateMediaQueries();
    
    // Add media queries to CSS
    if (mediaQueries && mediaQueries.length > 0) {
        data.cssRules.responsive = mediaQueries;
    }
};

/**
 * Generate media queries from responsive styles
 */
ResponsiveManager.prototype.generateMediaQueries = function() {
    var mediaQueries = [];
    var viewports = ['tablet', 'mobile']; // Desktop is default, no media query needed
    
    for (var i = 0; i < viewports.length; i++) {
        var viewport = viewports[i];
        var breakpoint = this.state.breakpoints[viewport];
        var rules = this.generateViewportRules(viewport);
        
        if (rules.length > 0) {
            var mediaQuery = {
                viewport: viewport,
                maxWidth: breakpoint.width,
                rules: rules
            };
            mediaQueries.push(mediaQuery);
        }
    }
    
    return mediaQueries;
};

/**
 * Generate CSS rules for a specific viewport
 */
ResponsiveManager.prototype.generateViewportRules = function(viewport) {
    var rules = [];
    
    for (var elementId in this.state.responsiveStyles) {
        var elementStyles = this.state.responsiveStyles[elementId];
        
        if (elementStyles[viewport]) {
            var className = this.generateExportedClassName(elementId);
            var styles = elementStyles[viewport];
            
            if (className && Object.keys(styles).length > 0) {
                rules.push({
                    selector: className,
                    styles: styles
                });
            }
        }
    }
    
    return rules;
};

/**
 * Generate exported class name for element
 */
ResponsiveManager.prototype.generateExportedClassName = function(elementId) {
    // This should match the ExportEngine's naming convention
    var elementData = this.canvasManager.state.elements[elementId];
    if (!elementData) return null;
    
    var baseClass = 'element-' + elementData.type;
    var uniqueId = elementId.replace(/^vwb-element-/, '');
    return baseClass + '-' + uniqueId;
};

/**
 * Get current viewport
 */
ResponsiveManager.prototype.getCurrentViewport = function() {
    return this.state.currentViewport;
};

/**
 * Get breakpoint for viewport
 */
ResponsiveManager.prototype.getBreakpoint = function(viewport) {
    return this.state.breakpoints[viewport];
};

/**
 * Get responsive styles for element
 */
ResponsiveManager.prototype.getResponsiveStyles = function(elementId) {
    return this.state.responsiveStyles[elementId] || {};
};

/**
 * Set responsive styles for element
 */
ResponsiveManager.prototype.setResponsiveStyles = function(elementId, viewport, styles) {
    if (!this.state.responsiveStyles[elementId]) {
        this.state.responsiveStyles[elementId] = {};
    }
    
    this.state.responsiveStyles[elementId][viewport] = styles;
    
    // Apply styles if it's the current viewport
    if (viewport === this.state.currentViewport) {
        var element = document.getElementById(elementId);
        if (element) {
            DOMUtils.setStyles(element, styles);
        }
    }
};

/**
 * Clear responsive styles for element
 */
ResponsiveManager.prototype.clearResponsiveStyles = function(elementId, viewport) {
    if (this.state.responsiveStyles[elementId] && this.state.responsiveStyles[elementId][viewport]) {
        delete this.state.responsiveStyles[elementId][viewport];
        
        // Clean up empty element entries
        if (Object.keys(this.state.responsiveStyles[elementId]).length === 0) {
            delete this.state.responsiveStyles[elementId];
        }
    }
};

/**
 * Test responsive design at different screen sizes
 */
ResponsiveManager.prototype.testResponsiveDesign = function() {
    var self = this;
    var originalViewport = this.state.currentViewport;
    var viewports = ['desktop', 'tablet', 'mobile'];
    var testResults = [];
    
    // Test each viewport
    for (var i = 0; i < viewports.length; i++) {
        var viewport = viewports[i];
        this.switchViewport(viewport);
        
        // Simulate testing delay
        setTimeout(function(currentViewport) {
            var breakpoint = self.state.breakpoints[currentViewport];
            var canvas = self.elements.canvas;
            var canvasRect = canvas.getBoundingClientRect();
            
            testResults.push({
                viewport: currentViewport,
                expectedWidth: breakpoint.width,
                actualWidth: Math.round(canvasRect.width),
                passed: Math.abs(canvasRect.width - breakpoint.width) < 5
            });
            
            // Return to original viewport after testing
            if (currentViewport === viewports[viewports.length - 1]) {
                self.switchViewport(originalViewport);
                
                // Emit test results
                self.eventBus.emit('responsive:test-complete', {
                    results: testResults,
                    passed: testResults.every(function(result) { return result.passed; })
                });
            }
        }.bind(null, viewport), i * 500);
    }
    
    return testResults;
};

/**
 * Export responsive styles data
 */
ResponsiveManager.prototype.exportResponsiveData = function() {
    return {
        currentViewport: this.state.currentViewport,
        breakpoints: this.state.breakpoints,
        responsiveStyles: this.state.responsiveStyles
    };
};

/**
 * Import responsive styles data
 */
ResponsiveManager.prototype.importResponsiveData = function(data) {
    if (data.currentViewport) {
        this.state.currentViewport = data.currentViewport;
    }
    
    if (data.breakpoints) {
        this.state.breakpoints = Object.assign({}, this.state.breakpoints, data.breakpoints);
    }
    
    if (data.responsiveStyles) {
        this.state.responsiveStyles = data.responsiveStyles;
    }
    
    // Apply current viewport
    this.switchViewport(this.state.currentViewport);
};

/**
 * Clean up resources
 */
ResponsiveManager.prototype.destroy = function() {
    if (!this.initialized) return;
    
    // Remove viewport indicator
    if (this.elements.viewportIndicator) {
        DOMUtils.removeElement(this.elements.viewportIndicator);
    }
    
    // Remove breakpoint selector
    var breakpointSelector = document.querySelector('.responsive-breakpoint-selector');
    if (breakpointSelector) {
        DOMUtils.removeElement(breakpointSelector);
    }
    
    // Reset canvas styles
    if (this.elements.canvas) {
        DOMUtils.setStyles(this.elements.canvas, {
            width: '',
            maxWidth: '',
            transition: '',
            margin: ''
        });
    }
    
    // Reset state
    this.state = {
        currentViewport: 'desktop',
        breakpoints: {
            desktop: { width: 1200, label: 'Desktop' },
            tablet: { width: 768, label: 'Tablet' },
            mobile: { width: 375, label: 'Mobile' }
        },
        responsiveStyles: {}
    };
    
    this.initialized = false;
    console.log('ResponsiveManager destroyed');
};