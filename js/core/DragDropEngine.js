/**
 * DragDropEngine - HTML5 Drag and Drop Implementation
 * 
 * This class handles all drag and drop functionality for the Visual Web Builder,
 * including dragging elements from the library to the canvas, visual feedback,
 * drop zone detection, and element creation on drop.
 */

function DragDropEngine(canvas, elementLibrary, eventBus) {
    this.canvas = canvas;
    this.elementLibrary = elementLibrary;
    this.eventBus = eventBus;
    this.initialized = false;
    
    // Drag state
    this.dragState = {
        isDragging: false,
        dragData: null,
        ghostElement: null,
        dropZones: [],
        currentDropZone: null,
        insertionIndicator: null
    };
    
    // Configuration
    this.config = {
        dropZoneClass: 'vwb-drop-zone',
        dropZoneActiveClass: 'vwb-drop-zone-active',
        insertionIndicatorClass: 'vwb-insertion-indicator',
        draggingClass: 'vwb-dragging',
        dragOverClass: 'vwb-drag-over'
    };
}

/**
 * Initialize the drag and drop engine
 */
DragDropEngine.prototype.init = function() {
    if (this.initialized) {
        console.warn('DragDropEngine already initialized');
        return;
    }

    try {
        console.log('Initializing DragDropEngine...');
        
        // Set up drag and drop event listeners
        this.setupDragEventListeners();
        
        // Set up drop zones
        this.setupDropZones();
        
        // Create insertion indicator
        this.createInsertionIndicator();
        
        // Set up event bus listeners
        this.setupEventBusListeners();
        
        this.initialized = true;
        console.log('DragDropEngine initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize DragDropEngine:', error);
        throw error;
    }
};

/**
 * Set up drag and drop event listeners
 */
DragDropEngine.prototype.setupDragEventListeners = function() {
    var self = this;
    
    // Canvas drop events
    DOMUtils.addEventListener(this.canvas, 'dragover', function(event) {
        self.handleDragOver(event);
    });
    
    DOMUtils.addEventListener(this.canvas, 'dragenter', function(event) {
        self.handleDragEnter(event);
    });
    
    DOMUtils.addEventListener(this.canvas, 'dragleave', function(event) {
        self.handleDragLeave(event);
    });
    
    DOMUtils.addEventListener(this.canvas, 'drop', function(event) {
        self.handleDrop(event);
    });
    
    // Global drag events for cleanup
    DOMUtils.addEventListener(document, 'dragend', function(event) {
        self.handleGlobalDragEnd(event);
    });
    
    // Prevent default drag behavior on the canvas
    DOMUtils.addEventListener(this.canvas, 'dragstart', function(event) {
        // Only prevent if it's not from our element library
        var dragData = self.getDragData(event);
        if (!dragData || dragData.source !== 'element-library') {
            event.preventDefault();
        }
    });
};

/**
 * Set up drop zones within the canvas
 */
DragDropEngine.prototype.setupDropZones = function() {
    // Initially, the entire canvas is a drop zone
    this.addDropZone(this.canvas);
    
    // Listen for new elements being added to create additional drop zones
    this.eventBus.on('element:added', function(data) {
        if (data.element && this.isContainer(data.element)) {
            this.addDropZone(data.element);
        }
    }.bind(this));
};

/**
 * Create the insertion point indicator
 */
DragDropEngine.prototype.createInsertionIndicator = function() {
    this.dragState.insertionIndicator = DOMUtils.createElement('div', {
        className: this.config.insertionIndicatorClass,
        styles: {
            position: 'absolute',
            height: '2px',
            backgroundColor: '#3498db',
            borderRadius: '1px',
            zIndex: '1000',
            display: 'none',
            pointerEvents: 'none',
            boxShadow: '0 0 4px rgba(52, 152, 219, 0.5)'
        }
    });
    
    document.body.appendChild(this.dragState.insertionIndicator);
};

/**
 * Set up event bus listeners
 */
DragDropEngine.prototype.setupEventBusListeners = function() {
    var self = this;
    
    // Listen for drag start from element library
    this.eventBus.on('element:drag-start', function(data) {
        self.handleElementDragStart(data);
    });
    
    // Listen for drag end from element library
    this.eventBus.on('element:drag-end', function(data) {
        self.handleElementDragEnd(data);
    });
};

/**
 * Handle drag start from element library
 */
DragDropEngine.prototype.handleElementDragStart = function(data) {
    try {
        // Validate drag data
        if (!data || !data.elementType) {
            throw new Error('Invalid drag start data');
        }
        
        this.dragState.isDragging = true;
        this.dragState.dragData = {
            elementType: data.elementType,
            template: data.template,
            source: 'element-library'
        };
        
        // Add visual feedback to canvas
        DOMUtils.addClass(this.canvas, this.config.draggingClass);
        
        // Show all drop zones
        this.showDropZones();
        
        console.log('DragDropEngine: Started dragging', data.elementType);
        
    } catch (error) {
        console.error('Error starting drag:', error);
        this.eventBus.emit('error:drag-drop', { 
            error: error, 
            operation: 'start drag',
            context: 'drag-start'
        });
        this.cleanupDragState();
    }
};

/**
 * Handle drag end from element library
 */
DragDropEngine.prototype.handleElementDragEnd = function(data) {
    this.cleanupDragState();
    console.log('DragDropEngine: Ended dragging');
};

/**
 * Handle drag over event on canvas
 */
DragDropEngine.prototype.handleDragOver = function(event) {
    if (!this.dragState.isDragging) return;
    
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    
    // Update insertion indicator position
    this.updateInsertionIndicator(event);
    
    // Find and highlight current drop zone
    var dropZone = this.findDropZone(event.target);
    this.setCurrentDropZone(dropZone);
};

/**
 * Handle drag enter event on canvas
 */
DragDropEngine.prototype.handleDragEnter = function(event) {
    if (!this.dragState.isDragging) return;
    
    event.preventDefault();
    
    // Add drag over class to canvas
    DOMUtils.addClass(this.canvas, this.config.dragOverClass);
};

/**
 * Handle drag leave event on canvas
 */
DragDropEngine.prototype.handleDragLeave = function(event) {
    if (!this.dragState.isDragging) return;
    
    // Check if we're actually leaving the canvas (not just moving to a child)
    var rect = this.canvas.getBoundingClientRect();
    var x = event.clientX;
    var y = event.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        DOMUtils.removeClass(this.canvas, this.config.dragOverClass);
        this.hideInsertionIndicator();
        this.setCurrentDropZone(null);
    }
};

/**
 * Handle drop event on canvas
 */
DragDropEngine.prototype.handleDrop = function(event) {
    if (!this.dragState.isDragging) return;
    
    event.preventDefault();
    
    try {
        // Get drag data
        var dragData = this.getDragData(event) || this.dragState.dragData;
        
        if (!dragData || dragData.source !== 'element-library') {
            var error = new Error('Invalid drag data for drop');
            this.eventBus.emit('error:drag-drop', { 
                error: error, 
                operation: 'drop element',
                context: 'invalid-drag-data'
            });
            return;
        }
        
        // Validate drop target
        var dropPosition = this.calculateDropPosition(event);
        if (!this.validateDropTarget(dropPosition)) {
            var error = new Error('Invalid drop target');
            this.eventBus.emit('error:drag-drop', { 
                error: error, 
                operation: 'drop element',
                context: 'invalid-drop-target'
            });
            return;
        }
        
        // Create the element
        var newElement = this.createElement(dragData, dropPosition);
        
        if (newElement) {
            // Insert element at the calculated position
            this.insertElement(newElement, dropPosition);
            
            // Emit element created event
            this.eventBus.emit('element:created', {
                element: newElement,
                elementType: dragData.elementType,
                position: dropPosition
            });
            
            console.log('DragDropEngine: Successfully dropped element', dragData.elementType);
        } else {
            var error = new Error('Failed to create element');
            this.eventBus.emit('error:drag-drop', { 
                error: error, 
                operation: 'create element',
                context: 'element-creation-failed'
            });
        }
        
    } catch (error) {
        console.error('Error handling drop:', error);
        this.eventBus.emit('error:drag-drop', { 
            error: error, 
            operation: 'drop element',
            context: 'unexpected-error'
        });
    } finally {
        this.cleanupDragState();
    }
};

/**
 * Handle global drag end event for cleanup
 */
DragDropEngine.prototype.handleGlobalDragEnd = function(event) {
    if (this.dragState.isDragging) {
        this.cleanupDragState();
    }
};

/**
 * Get drag data from event or internal state
 */
DragDropEngine.prototype.getDragData = function(event) {
    try {
        var dataString = event.dataTransfer.getData('text/plain');
        if (dataString) {
            return JSON.parse(dataString);
        }
    } catch (error) {
        console.warn('Could not parse drag data:', error);
    }
    
    return this.dragState.dragData;
};

/**
 * Calculate drop position based on mouse coordinates
 */
DragDropEngine.prototype.calculateDropPosition = function(event) {
    var canvasRect = this.canvas.getBoundingClientRect();
    var x = event.clientX - canvasRect.left;
    var y = event.clientY - canvasRect.top;
    
    // Find the target container and insertion point
    var target = event.target;
    var container = this.findDropContainer(target);
    var insertionIndex = this.calculateInsertionIndex(container, x, y);
    
    return {
        x: x,
        y: y,
        container: container,
        insertionIndex: insertionIndex,
        target: target
    };
};

/**
 * Find the appropriate drop container for the target element
 */
DragDropEngine.prototype.findDropContainer = function(target) {
    // If target is the canvas itself, return it
    if (target === this.canvas) {
        return this.canvas;
    }
    
    // Walk up the DOM to find a suitable container
    var current = target;
    while (current && current !== this.canvas) {
        if (this.isContainer(current)) {
            return current;
        }
        current = current.parentElement;
    }
    
    // Default to canvas
    return this.canvas;
};

/**
 * Calculate insertion index within a container
 */
DragDropEngine.prototype.calculateInsertionIndex = function(container, x, y) {
    var children = Array.from(container.children).filter(function(child) {
        return DOMUtils.hasClass(child, 'vwb-canvas-element');
    });
    
    if (children.length === 0) {
        return 0;
    }
    
    // Find the best insertion point based on mouse position
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var rect = child.getBoundingClientRect();
        var containerRect = container.getBoundingClientRect();
        
        var childY = rect.top - containerRect.top;
        var childCenterY = childY + rect.height / 2;
        
        if (y < childCenterY) {
            return i;
        }
    }
    
    // Insert at the end
    return children.length;
};

/**
 * Validate drop target
 */
DragDropEngine.prototype.validateDropTarget = function(dropPosition) {
    if (!dropPosition || !dropPosition.container) {
        return false;
    }
    
    // Check if container is valid
    if (!this.isContainer(dropPosition.container)) {
        return false;
    }
    
    // Check if drop position is within canvas bounds
    var canvasRect = this.canvas.getBoundingClientRect();
    if (dropPosition.x < 0 || dropPosition.y < 0 || 
        dropPosition.x > canvasRect.width || dropPosition.y > canvasRect.height) {
        return false;
    }
    
    return true;
};

/**
 * Create element from drag data
 */
DragDropEngine.prototype.createElement = function(dragData, dropPosition) {
    try {
        // Validate element type
        if (!dragData.elementType || typeof dragData.elementType !== 'string') {
            throw new Error('Invalid element type: ' + dragData.elementType);
        }
        
        return this.elementLibrary.createElement(dragData.elementType, {
            attributes: {
                'data-vwb-dropped-at': Date.now()
            }
        });
    } catch (error) {
        console.error('Error creating element:', error);
        this.eventBus.emit('error:drag-drop', { 
            error: error, 
            operation: 'create element',
            context: 'element-creation'
        });
        return null;
    }
};

/**
 * Insert element at the calculated position
 */
DragDropEngine.prototype.insertElement = function(element, position) {
    var container = position.container;
    var insertionIndex = position.insertionIndex;
    
    // Get current canvas elements in the container
    var canvasElements = Array.from(container.children).filter(function(child) {
        return DOMUtils.hasClass(child, 'vwb-canvas-element');
    });
    
    if (insertionIndex >= canvasElements.length) {
        // Append to end
        container.appendChild(element);
    } else {
        // Insert before the element at insertionIndex
        var referenceElement = canvasElements[insertionIndex];
        container.insertBefore(element, referenceElement);
    }
    
    // Add drop zone if this is a container element
    if (this.isContainer(element)) {
        this.addDropZone(element);
    }
};

/**
 * Update insertion indicator position
 */
DragDropEngine.prototype.updateInsertionIndicator = function(event) {
    if (!this.dragState.insertionIndicator) return;
    
    var dropPosition = this.calculateDropPosition(event);
    var container = dropPosition.container;
    var insertionIndex = dropPosition.insertionIndex;
    
    // Get container position
    var containerRect = container.getBoundingClientRect();
    
    // Calculate indicator position
    var indicatorY;
    var indicatorX = containerRect.left;
    var indicatorWidth = containerRect.width;
    
    var canvasElements = Array.from(container.children).filter(function(child) {
        return DOMUtils.hasClass(child, 'vwb-canvas-element');
    });
    
    if (canvasElements.length === 0 || insertionIndex === 0) {
        // Insert at beginning
        indicatorY = containerRect.top;
    } else if (insertionIndex >= canvasElements.length) {
        // Insert at end
        var lastElement = canvasElements[canvasElements.length - 1];
        var lastRect = lastElement.getBoundingClientRect();
        indicatorY = lastRect.bottom;
    } else {
        // Insert between elements
        var targetElement = canvasElements[insertionIndex];
        var targetRect = targetElement.getBoundingClientRect();
        indicatorY = targetRect.top;
    }
    
    // Show and position the indicator
    DOMUtils.setStyles(this.dragState.insertionIndicator, {
        display: 'block',
        left: indicatorX + 'px',
        top: indicatorY + 'px',
        width: indicatorWidth + 'px'
    });
};

/**
 * Hide insertion indicator
 */
DragDropEngine.prototype.hideInsertionIndicator = function() {
    if (this.dragState.insertionIndicator) {
        this.dragState.insertionIndicator.style.display = 'none';
    }
};

/**
 * Show drop zones
 */
DragDropEngine.prototype.showDropZones = function() {
    this.dragState.dropZones.forEach(function(dropZone) {
        DOMUtils.addClass(dropZone, this.config.dropZoneClass);
    }.bind(this));
};

/**
 * Hide drop zones
 */
DragDropEngine.prototype.hideDropZones = function() {
    this.dragState.dropZones.forEach(function(dropZone) {
        DOMUtils.removeClass(dropZone, this.config.dropZoneClass);
        DOMUtils.removeClass(dropZone, this.config.dropZoneActiveClass);
    }.bind(this));
};

/**
 * Add a drop zone
 */
DragDropEngine.prototype.addDropZone = function(element) {
    if (this.dragState.dropZones.indexOf(element) === -1) {
        this.dragState.dropZones.push(element);
    }
};

/**
 * Find drop zone for a target element
 */
DragDropEngine.prototype.findDropZone = function(target) {
    var current = target;
    while (current) {
        if (this.dragState.dropZones.indexOf(current) !== -1) {
            return current;
        }
        current = current.parentElement;
    }
    return null;
};

/**
 * Set current drop zone with visual feedback
 */
DragDropEngine.prototype.setCurrentDropZone = function(dropZone) {
    // Remove active class from previous drop zone
    if (this.dragState.currentDropZone) {
        DOMUtils.removeClass(this.dragState.currentDropZone, this.config.dropZoneActiveClass);
    }
    
    // Set new current drop zone
    this.dragState.currentDropZone = dropZone;
    
    // Add active class to new drop zone
    if (dropZone) {
        DOMUtils.addClass(dropZone, this.config.dropZoneActiveClass);
    }
};

/**
 * Check if element is a container that can accept drops
 */
DragDropEngine.prototype.isContainer = function(element) {
    if (!element || !element.tagName) return false;
    
    var containerTags = ['DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'ASIDE', 'NAV'];
    return containerTags.indexOf(element.tagName.toUpperCase()) !== -1 || 
           element === this.canvas;
};

/**
 * Clean up drag state and visual feedback
 */
DragDropEngine.prototype.cleanupDragState = function() {
    // Reset drag state
    this.dragState.isDragging = false;
    this.dragState.dragData = null;
    this.dragState.currentDropZone = null;
    
    // Remove visual feedback
    DOMUtils.removeClass(this.canvas, this.config.draggingClass);
    DOMUtils.removeClass(this.canvas, this.config.dragOverClass);
    
    // Hide drop zones and insertion indicator
    this.hideDropZones();
    this.hideInsertionIndicator();
    
    console.log('DragDropEngine: Cleaned up drag state');
};

/**
 * Get current drag state (for debugging)
 */
DragDropEngine.prototype.getDragState = function() {
    return {
        isDragging: this.dragState.isDragging,
        dragData: this.dragState.dragData,
        dropZoneCount: this.dragState.dropZones.length,
        currentDropZone: this.dragState.currentDropZone
    };
};

/**
 * Clean up resources
 */
DragDropEngine.prototype.destroy = function() {
    if (!this.initialized) return;
    
    // Clean up drag state
    this.cleanupDragState();
    
    // Remove insertion indicator
    if (this.dragState.insertionIndicator) {
        DOMUtils.removeElement(this.dragState.insertionIndicator);
        this.dragState.insertionIndicator = null;
    }
    
    // Clear drop zones
    this.dragState.dropZones = [];
    
    // Reset state
    this.initialized = false;
    
    console.log('DragDropEngine destroyed');
};