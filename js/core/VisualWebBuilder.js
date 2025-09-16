/**
 * VisualWebBuilder - Main Application Controller
 * 
 * This is the main application controller that orchestrates all the components
 * and manages the overall application state and lifecycle.
 */

function VisualWebBuilder() {
    this.initialized = false;
    this.eventBus = new EventBus();
    this.panelManager = null;
    
    // Application state
    this.state = {
        currentViewport: 'desktop',
        selectedElement: null,
        isDemoMode: false
    };
    
    // DOM references
    this.elements = {
        container: null,
        header: null,
        leftPanel: null,
        centerPanel: null,
        rightPanel: null,
        canvas: null
    };
}

/**
 * Initialize the application
 */
VisualWebBuilder.prototype.init = function() {
    if (this.initialized) {
        console.warn('VisualWebBuilder already initialized');
        return;
    }

    try {
        console.log('Initializing Visual Web Builder...');
        
        // Get DOM references
        console.log('Getting DOM references...');
        this.getDOMReferences();
        console.log('DOM references obtained successfully');
        
        // Initialize core systems
        console.log('Initializing core systems...');
        this.initializeCore();
        console.log('Core systems initialized successfully');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Mark as initialized
        this.initialized = true;
        
        console.log('Visual Web Builder initialization complete');
        
        // Emit initialization complete event
        this.eventBus.emit('app:initialized');
        
    } catch (error) {
        console.error('Failed to initialize Visual Web Builder:', error);
        throw error;
    }
};

/**
 * Get references to key DOM elements
 */
VisualWebBuilder.prototype.getDOMReferences = function() {
    this.elements.container = document.querySelector('.app-container');
    this.elements.header = document.querySelector('.app-header');
    this.elements.leftPanel = document.querySelector('.left-panel');
    this.elements.centerPanel = document.querySelector('.center-panel');
    this.elements.rightPanel = document.querySelector('.right-panel');
    this.elements.canvas = document.querySelector('#main-canvas');

    // Validate that all required elements exist
    var requiredElements = ['container', 'header', 'leftPanel', 'centerPanel', 'rightPanel', 'canvas'];
    var missingElements = [];
    
    for (var i = 0; i < requiredElements.length; i++) {
        if (!this.elements[requiredElements[i]]) {
            missingElements.push(requiredElements[i]);
        }
    }
    
    if (missingElements.length > 0) {
        throw new Error('Missing required DOM elements: ' + missingElements.join(', '));
    }
};

/**
 * Initialize core application systems
 */
VisualWebBuilder.prototype.initializeCore = function() {
    // Initialize error handler first (other components depend on it)
    this.errorHandler = new ErrorHandler(this.eventBus);
    this.errorHandler.init();
    
    // Initialize fallback manager
    this.fallbackManager = new FallbackManager(this.eventBus, this.errorHandler);
    this.fallbackManager.init();
    
    // Initialize panel manager
    this.panelManager = new PanelManager(this.elements.container, this.eventBus);
    this.panelManager.init();
    
    // Initialize element library
    this.elementLibrary = new ElementLibrary(this.elements.leftPanel, this.eventBus);
    this.elementLibrary.init();
    
    // Initialize drag and drop engine
    this.dragDropEngine = new DragDropEngine(this.elements.canvas, this.elementLibrary, this.eventBus);
    this.dragDropEngine.init();
    
    // Initialize canvas manager
    this.canvasManager = new CanvasManager(this.elements.canvas, this.eventBus);
    this.canvasManager.init();
    
    // Initialize property editor
    this.propertyEditor = new PropertyEditor(this.elements.rightPanel, this.eventBus);
    this.propertyEditor.init();
    
    // Initialize preview manager
    this.previewManager = new PreviewManager(this, this.eventBus);
    this.previewManager.init();
    
    // Initialize storage manager
    this.storageManager = new StorageManager(this.canvasManager, this.eventBus);
    this.storageManager.init();
    
    // Initialize export engine
    this.exportEngine = new ExportEngine(this.canvasManager, this.eventBus);
    this.exportEngine.init();
    
    // Initialize responsive manager
    this.responsiveManager = new ResponsiveManager(this.canvasManager, this.propertyEditor, this.exportEngine, this.eventBus);
    this.responsiveManager.init();
    
    // Initialize advanced manipulation
    this.advancedManipulation = new AdvancedManipulation(this.canvasManager, this.eventBus);
    this.advancedManipulation.init();
    
    // Initialize UX enhancement
    console.log('Initializing UX Enhancement...');
    this.uxEnhancement = new UXEnhancement(this.eventBus);
    this.uxEnhancement.init();
    console.log('UX Enhancement initialized successfully');
};

/**
 * Set up global event listeners using event delegation
 */
VisualWebBuilder.prototype.setupEventListeners = function() {
    var self = this;
    
    // Set up event delegation for the entire application
    this.setupEventDelegation();
    
    // Header button event listeners
    this.setupHeaderButtons();
    
    // Viewport control listeners
    this.setupViewportControls();
    
    // Global keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Window resize handler with debouncing
    var debouncedResize = DOMUtils.debounce(function() {
        self.handleWindowResize();
    }, 250);
    
    window.addEventListener('resize', debouncedResize);
    
    // Application event listeners
    this.eventBus.on('viewport:changed', function(data) {
        self.handleViewportChange(data);
    });
    
    // Notification events
    this.eventBus.on('notification:show', function(data) {
        self.showNotification(data.message, data.type, data.duration);
    });
    
    // Panel events
    this.eventBus.on('panels:resized', function(data) {
        self.handlePanelsResized(data);
    });
    
    this.eventBus.on('panel:toggled', function(data) {
        self.handlePanelToggled(data);
    });
    
    // Fallback events
    this.eventBus.on('fallback:create-element', function(data) {
        self.handleFallbackElementCreation(data);
    });
};

/**
 * Set up event delegation system for global application events
 */
VisualWebBuilder.prototype.setupEventDelegation = function() {
    var self = this;
    
    // Set up event delegation on the main container
    DOMUtils.addEventListener(this.elements.container, 'click', function(event) {
        self.handleGlobalClick(event);
    });
    
    DOMUtils.addEventListener(this.elements.container, 'mousedown', function(event) {
        self.handleGlobalMouseDown(event);
    });
    
    DOMUtils.addEventListener(this.elements.container, 'mouseup', function(event) {
        self.handleGlobalMouseUp(event);
    });
    
    DOMUtils.addEventListener(this.elements.container, 'mouseover', function(event) {
        self.handleGlobalMouseOver(event);
    });
    
    DOMUtils.addEventListener(this.elements.container, 'mouseout', function(event) {
        self.handleGlobalMouseOut(event);
    });
};

/**
 * Handle global click events using event delegation
 */
VisualWebBuilder.prototype.handleGlobalClick = function(event) {
    var target = event.target;
    
    // Handle button clicks
    if (target.matches('#save-btn')) {
        this.handleSaveClick(event);
    } else if (target.matches('#load-btn')) {
        this.handleLoadClick(event);
    } else if (target.matches('#export-btn')) {
        this.handleExportClick(event);
    } else if (target.matches('#demo-btn')) {
        this.handleDemoClick(event);
    } else if (target.matches('#preview-window-btn')) {
        this.handlePreviewWindowClick(event);
    } else if (target.matches('.viewport-btn')) {
        this.handleViewportClick(event);
    }
    
    // Emit global click event for other components
    this.eventBus.emit('global:click', {
        target: target,
        event: event
    });
};

/**
 * Handle global mouse events
 */
VisualWebBuilder.prototype.handleGlobalMouseDown = function(event) {
    this.eventBus.emit('global:mousedown', {
        target: event.target,
        event: event
    });
};

VisualWebBuilder.prototype.handleGlobalMouseUp = function(event) {
    this.eventBus.emit('global:mouseup', {
        target: event.target,
        event: event
    });
};

VisualWebBuilder.prototype.handleGlobalMouseOver = function(event) {
    this.eventBus.emit('global:mouseover', {
        target: event.target,
        event: event
    });
};

VisualWebBuilder.prototype.handleGlobalMouseOut = function(event) {
    this.eventBus.emit('global:mouseout', {
        target: event.target,
        event: event
    });
};

/**
 * Handle save button click
 */
VisualWebBuilder.prototype.handleSaveClick = function(event) {
    console.log('Save button clicked');
    this.eventBus.emit('action:save', { event: event });
    // TODO: Implement save functionality in future tasks
};

/**
 * Handle load button click
 */
VisualWebBuilder.prototype.handleLoadClick = function(event) {
    console.log('Load button clicked');
    this.eventBus.emit('action:load', { event: event });
    // TODO: Implement load functionality in future tasks
};

/**
 * Handle export button click
 */
VisualWebBuilder.prototype.handleExportClick = function(event) {
    console.log('Export button clicked');
    this.eventBus.emit('action:export', { event: event });
};

/**
 * Handle demo button click
 */
VisualWebBuilder.prototype.handleDemoClick = function(event) {
    console.log('Demo button clicked');
    this.toggleDemoMode();
};

/**
 * Handle preview window button click
 */
VisualWebBuilder.prototype.handlePreviewWindowClick = function(event) {
    console.log('Preview window button clicked');
    if (this.previewManager) {
        this.previewManager.openPreviewWindow();
    }
};

/**
 * Handle viewport button click
 */
VisualWebBuilder.prototype.handleViewportClick = function(event) {
    var viewport = event.target.dataset.viewport;
    if (viewport && this.responsiveManager) {
        this.responsiveManager.switchViewport(viewport);
    }
};

/**
 * Set up header button event listeners (legacy method for compatibility)
 */
VisualWebBuilder.prototype.setupHeaderButtons = function() {
    // This method is now handled by event delegation
    // Keeping for compatibility and future direct event needs
    console.log('Header buttons set up via event delegation');
};

/**
 * Set up viewport control listeners
 */
VisualWebBuilder.prototype.setupViewportControls = function() {
    // Viewport controls are now handled by event delegation
    // This method ensures viewport buttons are properly initialized
    var viewportButtons = DOMUtils.findElements('.viewport-btn');
    console.log('Found ' + viewportButtons.length + ' viewport buttons');
};

/**
 * Set up keyboard shortcuts
 */
VisualWebBuilder.prototype.setupKeyboardShortcuts = function() {
    var self = this;
    document.addEventListener('keydown', function(event) {
        // Ctrl/Cmd + S for save
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            console.log('Save shortcut triggered');
            // TODO: Implement save functionality
        }
        
        // Escape to exit demo mode
        if (event.key === 'Escape' && self.state.isDemoMode) {
            self.toggleDemoMode();
        }
    });
};

/**
 * Handle window resize events
 */
VisualWebBuilder.prototype.handleWindowResize = function() {
    var self = this;
    // Debounce resize events
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(function() {
        self.eventBus.emit('window:resized', {
            width: window.innerWidth,
            height: window.innerHeight
        });
    }, 250);
};

/**
 * Set the current viewport
 */
VisualWebBuilder.prototype.setViewport = function(viewport) {
    if (this.state.currentViewport === viewport) return;
    
    this.state.currentViewport = viewport;
    
    // Update active viewport button
    var viewportButtons = document.querySelectorAll('.viewport-btn');
    for (var i = 0; i < viewportButtons.length; i++) {
        var btn = viewportButtons[i];
        if (btn.dataset.viewport === viewport) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }
    
    // Emit viewport change event
    this.eventBus.emit('viewport:changed', { viewport: viewport });
    
    console.log('Viewport changed to: ' + viewport);
};

/**
 * Handle viewport change events
 */
VisualWebBuilder.prototype.handleViewportChange = function(data) {
    var viewport = data.viewport;
    
    // Update canvas dimensions based on viewport
    this.updateCanvasForViewport(viewport);
    
    console.log('Handling viewport change to: ' + viewport);
};

/**
 * Handle panel resize events
 */
VisualWebBuilder.prototype.handlePanelsResized = function(data) {
    console.log('Panels resized:', data);
    this.eventBus.emit('canvas:update-layout');
};

/**
 * Handle panel toggle events
 */
VisualWebBuilder.prototype.handlePanelToggled = function(data) {
    console.log('Panel toggled:', data.side, data.visible ? 'shown' : 'hidden');
    this.eventBus.emit('canvas:update-layout');
};

/**
 * Update canvas dimensions for different viewports
 */
VisualWebBuilder.prototype.updateCanvasForViewport = function(viewport) {
    var canvas = this.elements.canvas;
    if (!canvas) return;
    
    // Define viewport dimensions
    var viewportSizes = {
        desktop: { width: '100%', maxWidth: '1200px' },
        tablet: { width: '768px', maxWidth: '768px' },
        mobile: { width: '375px', maxWidth: '375px' }
    };
    
    var size = viewportSizes[viewport] || viewportSizes.desktop;
    
    DOMUtils.setStyles(canvas, {
        width: size.width,
        maxWidth: size.maxWidth,
        transition: 'all 0.3s ease'
    });
    
    // Update canvas container for centering
    var canvasContainer = canvas.parentElement;
    if (canvasContainer) {
        DOMUtils.setStyles(canvasContainer, {
            justifyContent: viewport === 'desktop' ? 'center' : 'center'
        });
    }
};

/**
 * Toggle demo mode
 */
VisualWebBuilder.prototype.toggleDemoMode = function() {
    this.state.isDemoMode = !this.state.isDemoMode;
    
    // Emit demo mode toggle event for PreviewManager to handle
    this.eventBus.emit('demo:toggled', { isDemoMode: this.state.isDemoMode });
    
    console.log('Demo mode ' + (this.state.isDemoMode ? 'enabled' : 'disabled'));
};

/**
 * Get current application state
 */
VisualWebBuilder.prototype.getState = function() {
    return {
        currentViewport: this.state.currentViewport,
        selectedElement: this.state.selectedElement,
        isDemoMode: this.state.isDemoMode,
        initialized: this.initialized
    };
};

/**
 * Create a new element with the application's standard structure
 */
VisualWebBuilder.prototype.createElement = function(tagName, options) {
    options = options || {};
    
    // Add unique ID if not provided
    if (!options.attributes) {
        options.attributes = {};
    }
    
    if (!options.attributes.id) {
        options.attributes.id = DOMUtils.generateUniqueId('vwb-element');
    }
    
    // Add application-specific classes
    var appClasses = 'vwb-element';
    if (options.className) {
        options.className = appClasses + ' ' + options.className;
    } else {
        options.className = appClasses;
    }
    
    return DOMUtils.createElement(tagName, options);
};

/**
 * Handle fallback element creation (for browsers without drag and drop)
 */
VisualWebBuilder.prototype.handleFallbackElementCreation = function(data) {
    try {
        if (!data || !data.elementType || !data.position) {
            throw new Error('Invalid fallback element creation data');
        }
        
        // Create element using the canvas manager
        if (this.canvasManager) {
            var element = this.canvasManager.createElement(data.elementType, {
                position: data.position
            });
            
            if (element) {
                console.log('Created element via fallback:', data.elementType);
                
                // Emit element created event
                this.eventBus.emit('element:created', {
                    element: element,
                    elementType: data.elementType,
                    position: data.position,
                    source: 'fallback'
                });
            }
        }
        
    } catch (error) {
        console.error('Error in fallback element creation:', error);
        this.eventBus.emit('error:drag-drop', {
            error: error,
            operation: 'create element (fallback)',
            context: 'fallback-handler'
        });
    }
};

/**
 * Show a notification to the user
 */
VisualWebBuilder.prototype.showNotification = function(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;
    
    var notification = this.createElement('div', {
        className: 'vwb-notification vwb-notification-' + type,
        textContent: message,
        styles: {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '4px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '10000',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease'
        }
    });
    
    // Set background color based on type
    var colors = {
        info: '#3498db',
        success: '#2ecc71',
        warning: '#f39c12',
        error: '#e74c3c'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(function() {
        DOMUtils.setStyles(notification, {
            opacity: '1',
            transform: 'translateX(0)'
        });
    }, 10);
    
    // Auto remove
    setTimeout(function() {
        DOMUtils.setStyles(notification, {
            opacity: '0',
            transform: 'translateX(100%)'
        });
        
        setTimeout(function() {
            DOMUtils.removeElement(notification);
        }, 300);
    }, duration);
    
    return notification;
};

/**
 * Get DOM utilities instance
 */
VisualWebBuilder.prototype.getDOMUtils = function() {
    return DOMUtils;
};

/**
 * Get event bus instance
 */
VisualWebBuilder.prototype.getEventBus = function() {
    return this.eventBus;
};

/**
 * Clean up resources
 */
VisualWebBuilder.prototype.destroy = function() {
    if (!this.initialized) return;
    
    // Clean up components
    if (this.panelManager) {
        this.panelManager.destroy();
    }
    
    if (this.elementLibrary) {
        this.elementLibrary.destroy();
    }
    
    if (this.dragDropEngine) {
        this.dragDropEngine.destroy();
    }
    
    if (this.canvasManager) {
        this.canvasManager.destroy();
    }
    
    if (this.propertyEditor) {
        this.propertyEditor.destroy();
    }
    
    if (this.previewManager) {
        this.previewManager.destroy();
    }
    
    if (this.storageManager) {
        this.storageManager.destroy();
    }
    
    if (this.exportEngine) {
        this.exportEngine.destroy();
    }
    
    if (this.responsiveManager) {
        this.responsiveManager.destroy();
    }
    
    if (this.advancedManipulation) {
        this.advancedManipulation.destroy();
    }
    
    // Clean up UX enhancement
    if (this.uxEnhancement) {
        this.uxEnhancement.destroy();
    }
    
    // Clean up fallback manager
    if (this.fallbackManager) {
        this.fallbackManager.destroy();
    }
    
    // Clean up error handler last
    if (this.errorHandler) {
        this.errorHandler.destroy();
    }
    
    // Clear timeouts
    if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
    }
    
    // Reset state
    this.initialized = false;
    this.state = {
        currentViewport: 'desktop',
        selectedElement: null,
        isDemoMode: false
    };
    
    console.log('Visual Web Builder destroyed');
};