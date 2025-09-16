/**
 * PanelManager - Manages the three-panel layout system
 * 
 * Handles the layout, resizing, and responsive behavior of the three main panels:
 * - Left panel (Element Library)
 * - Center panel (Canvas)
 * - Right panel (Property Editor)
 */

function PanelManager(container, eventBus) {
    this.container = container;
    this.eventBus = eventBus;
    this.initialized = false;
    
    // Panel references
    this.panels = {
        left: null,
        center: null,
        right: null
    };
    
    // Panel state
    this.state = {
        leftPanelVisible: true,
        rightPanelVisible: true,
        leftPanelWidth: 280,
        rightPanelWidth: 320,
        isResizing: false
    };
    
    // Resize handles
    this.resizeHandles = {
        left: null,
        right: null
    };
}

/**
 * Initialize the panel manager
 */
PanelManager.prototype.init = function() {
    if (this.initialized) {
        console.warn('PanelManager already initialized');
        return;
    }

    try {
        console.log('Initializing PanelManager...');
        
        // Get panel references
        this.getPanelReferences();
        
        // Create resize handles
        this.createResizeHandles();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Apply initial layout
        this.applyLayout();
        
        this.initialized = true;
        console.log('PanelManager initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize PanelManager:', error);
        throw error;
    }
};

/**
 * Get references to panel elements
 */
PanelManager.prototype.getPanelReferences = function() {
    this.panels.left = this.container.querySelector('.left-panel');
    this.panels.center = this.container.querySelector('.center-panel');
    this.panels.right = this.container.querySelector('.right-panel');

    // Validate panel references
    if (!this.panels.left || !this.panels.center || !this.panels.right) {
        throw new Error('Could not find all required panel elements');
    }
};

/**
 * Create resize handles for panel resizing
 */
PanelManager.prototype.createResizeHandles = function() {
    // Left panel resize handle
    this.resizeHandles.left = this.createResizeHandle('left');
    this.panels.left.appendChild(this.resizeHandles.left);
    
    // Right panel resize handle  
    this.resizeHandles.right = this.createResizeHandle('right');
    this.panels.right.appendChild(this.resizeHandles.right);
};

/**
 * Create a resize handle element
 */
PanelManager.prototype.createResizeHandle = function(side) {
    var handle = document.createElement('div');
    handle.className = 'resize-handle resize-handle-' + side;
    handle.setAttribute('data-side', side);
    
    // Add styles
    handle.style.cssText = 
        'position: absolute;' +
        'top: 0;' +
        (side === 'left' ? 'right: -2px;' : 'left: -2px;') +
        'width: 4px;' +
        'height: 100%;' +
        'background: transparent;' +
        'cursor: col-resize;' +
        'z-index: 10;' +
        'transition: background-color 0.2s ease;';
    
    // Add hover effect
    handle.addEventListener('mouseenter', function() {
        handle.style.backgroundColor = 'rgba(52, 152, 219, 0.3)';
    });
    
    var self = this;
    handle.addEventListener('mouseleave', function() {
        if (!self.state.isResizing) {
            handle.style.backgroundColor = 'transparent';
        }
    });
    
    return handle;
};

/**
 * Set up event listeners
 */
PanelManager.prototype.setupEventListeners = function() {
    var self = this;
    
    // Resize handle events
    for (var key in this.resizeHandles) {
        if (this.resizeHandles[key]) {
            this.resizeHandles[key].addEventListener('mousedown', function(event) {
                self.handleResizeStart(event);
            });
        }
    }
    
    // Global mouse events for resizing
    document.addEventListener('mousemove', function(event) {
        self.handleResizeMove(event);
    });
    
    document.addEventListener('mouseup', function(event) {
        self.handleResizeEnd(event);
    });
    
    // Window resize events
    this.eventBus.on('window:resized', function(data) {
        self.handleWindowResize(data);
    });
    
    // Keyboard shortcuts for panel toggling
    document.addEventListener('keydown', function(event) {
        self.handleKeyboardShortcuts(event);
    });
};

/**
 * Handle resize start
 */
PanelManager.prototype.handleResizeStart = function(event) {
    event.preventDefault();
    
    this.state.isResizing = true;
    this.state.resizingSide = event.target.getAttribute('data-side');
    this.state.startX = event.clientX;
    this.state.startWidth = this.state.resizingSide === 'left' 
        ? this.state.leftPanelWidth 
        : this.state.rightPanelWidth;
    
    // Add resizing class to body
    document.body.classList.add('panel-resizing');
    
    // Update cursor
    document.body.style.cursor = 'col-resize';
    
    console.log('Started resizing ' + this.state.resizingSide + ' panel');
};

/**
 * Handle resize move
 */
PanelManager.prototype.handleResizeMove = function(event) {
    if (!this.state.isResizing) return;
    
    event.preventDefault();
    
    var deltaX = event.clientX - this.state.startX;
    var side = this.state.resizingSide;
    
    var newWidth;
    if (side === 'left') {
        newWidth = Math.max(200, Math.min(500, this.state.startWidth + deltaX));
        this.state.leftPanelWidth = newWidth;
    } else {
        newWidth = Math.max(250, Math.min(600, this.state.startWidth - deltaX));
        this.state.rightPanelWidth = newWidth;
    }
    
    this.applyLayout();
};

/**
 * Handle resize end
 */
PanelManager.prototype.handleResizeEnd = function(event) {
    if (!this.state.isResizing) return;
    
    this.state.isResizing = false;
    this.state.resizingSide = null;
    
    // Remove resizing class and cursor
    document.body.classList.remove('panel-resizing');
    document.body.style.cursor = '';
    
    // Reset resize handle background
    for (var key in this.resizeHandles) {
        if (this.resizeHandles[key]) {
            this.resizeHandles[key].style.backgroundColor = 'transparent';
        }
    }
    
    // Emit resize complete event
    this.eventBus.emit('panels:resized', {
        leftWidth: this.state.leftPanelWidth,
        rightWidth: this.state.rightPanelWidth
    });
    
    console.log('Panel resize completed');
};

/**
 * Handle window resize
 */
PanelManager.prototype.handleWindowResize = function() {
    // Ensure panels don't exceed window bounds
    var maxLeftWidth = Math.min(500, window.innerWidth * 0.3);
    var maxRightWidth = Math.min(600, window.innerWidth * 0.3);
    
    if (this.state.leftPanelWidth > maxLeftWidth) {
        this.state.leftPanelWidth = maxLeftWidth;
    }
    
    if (this.state.rightPanelWidth > maxRightWidth) {
        this.state.rightPanelWidth = maxRightWidth;
    }
    
    this.applyLayout();
};

/**
 * Handle keyboard shortcuts
 */
PanelManager.prototype.handleKeyboardShortcuts = function(event) {
    // Toggle left panel with Ctrl/Cmd + 1
    if ((event.ctrlKey || event.metaKey) && event.key === '1') {
        event.preventDefault();
        this.togglePanel('left');
    }
    
    // Toggle right panel with Ctrl/Cmd + 2
    if ((event.ctrlKey || event.metaKey) && event.key === '2') {
        event.preventDefault();
        this.togglePanel('right');
    }
};

/**
 * Apply the current layout to the panels
 */
PanelManager.prototype.applyLayout = function() {
    var mainContent = this.container.querySelector('.main-content');
    if (!mainContent) return;
    
    var leftWidth = this.state.leftPanelVisible ? this.state.leftPanelWidth + 'px' : '0';
    var rightWidth = this.state.rightPanelVisible ? this.state.rightPanelWidth + 'px' : '0';
    
    mainContent.style.gridTemplateColumns = leftWidth + ' 1fr ' + rightWidth;
    
    // Update panel visibility
    this.panels.left.style.display = this.state.leftPanelVisible ? 'block' : 'none';
    this.panels.right.style.display = this.state.rightPanelVisible ? 'block' : 'none';
    
    // Update resize handle visibility
    if (this.resizeHandles.left) {
        this.resizeHandles.left.style.display = this.state.leftPanelVisible ? 'block' : 'none';
    }
    if (this.resizeHandles.right) {
        this.resizeHandles.right.style.display = this.state.rightPanelVisible ? 'block' : 'none';
    }
};

/**
 * Toggle panel visibility
 */
PanelManager.prototype.togglePanel = function(side) {
    if (side === 'left') {
        this.state.leftPanelVisible = !this.state.leftPanelVisible;
    } else if (side === 'right') {
        this.state.rightPanelVisible = !this.state.rightPanelVisible;
    }
    
    this.applyLayout();
    
    this.eventBus.emit('panel:toggled', {
        side: side,
        visible: side === 'left' ? this.state.leftPanelVisible : this.state.rightPanelVisible
    });
    
    var visible = side === 'left' ? this.state.leftPanelVisible : this.state.rightPanelVisible;
    console.log(side + ' panel ' + (visible ? 'shown' : 'hidden'));
};

/**
 * Show a specific panel
 */
PanelManager.prototype.showPanel = function(side) {
    if (side === 'left' && !this.state.leftPanelVisible) {
        this.togglePanel('left');
    } else if (side === 'right' && !this.state.rightPanelVisible) {
        this.togglePanel('right');
    }
};

/**
 * Hide a specific panel
 */
PanelManager.prototype.hidePanel = function(side) {
    if (side === 'left' && this.state.leftPanelVisible) {
        this.togglePanel('left');
    } else if (side === 'right' && this.state.rightPanelVisible) {
        this.togglePanel('right');
    }
};

/**
 * Get current panel state
 */
PanelManager.prototype.getState = function() {
    return {
        leftPanelVisible: this.state.leftPanelVisible,
        rightPanelVisible: this.state.rightPanelVisible,
        leftPanelWidth: this.state.leftPanelWidth,
        rightPanelWidth: this.state.rightPanelWidth,
        isResizing: this.state.isResizing
    };
};

/**
 * Clean up resources
 */
PanelManager.prototype.destroy = function() {
    if (!this.initialized) return;
    
    // Remove resize handles
    for (var key in this.resizeHandles) {
        var handle = this.resizeHandles[key];
        if (handle && handle.parentNode) {
            handle.parentNode.removeChild(handle);
        }
    }
    
    // Reset state
    this.initialized = false;
    this.state = {
        leftPanelVisible: true,
        rightPanelVisible: true,
        leftPanelWidth: 280,
        rightPanelWidth: 320,
        isResizing: false
    };
    
    console.log('PanelManager destroyed');
};