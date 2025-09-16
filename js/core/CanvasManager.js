/**
 * CanvasManager - Canvas Element Management System
 * 
 * This class manages the visual canvas and its contents, including element rendering,
 * selection system with visual highlighting, hierarchy management, element deletion,
 * and unique ID generation for canvas elements.
 */

function CanvasManager(canvasElement, eventBus) {
    this.canvas = canvasElement;
    this.eventBus = eventBus;
    this.initialized = false;
    
    // Canvas state
    this.state = {
        selectedElement: null,
        elements: {}, // Map of element IDs to element data
        rootElements: [], // Array of top-level element IDs
        nextElementId: 1
    };
    
    // Configuration
    this.config = {
        canvasElementClass: 'vwb-canvas-element',
        selectedClass: 'vwb-selected',
        highlightClass: 'vwb-highlight',
        selectionIndicatorClass: 'vwb-selection-indicator',
        idPrefix: 'vwb-element'
    };
    
    // Selection system elements
    this.selectionIndicator = null;
    this.selectionHandles = [];
    this.breadcrumbContainer = null;
}

/**
 * Initialize the canvas manager
 */
CanvasManager.prototype.init = function() {
    if (this.initialized) {
        console.warn('CanvasManager already initialized');
        return;
    }

    try {
        console.log('Initializing CanvasManager...');
        
        // Set up canvas
        this.setupCanvas();
        
        // Create selection system
        this.createSelectionSystem();
        
        // Create breadcrumb navigation
        this.createBreadcrumbNavigation();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up event bus listeners
        this.setupEventBusListeners();
        
        this.initialized = true;
        console.log('CanvasManager initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize CanvasManager:', error);
        throw error;
    }
};

/**
 * Set up the canvas element
 */
CanvasManager.prototype.setupCanvas = function() {
    // Ensure canvas has proper attributes
    if (!this.canvas.id) {
        this.canvas.id = 'vwb-main-canvas';
    }
    
    // Add canvas-specific classes
    DOMUtils.addClass(this.canvas, 'vwb-canvas');
    
    // Set up canvas styles for element management
    DOMUtils.setStyles(this.canvas, {
        position: 'relative',
        minHeight: '400px',
        outline: 'none' // Remove focus outline
    });
    
    // Make canvas focusable for keyboard navigation
    this.canvas.setAttribute('tabindex', '0');
};

/**
 * Create the selection system UI elements
 */
CanvasManager.prototype.createSelectionSystem = function() {
    // Create selection indicator
    this.selectionIndicator = DOMUtils.createElement('div', {
        className: this.config.selectionIndicatorClass,
        styles: {
            position: 'absolute',
            border: '2px solid #3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            pointerEvents: 'none',
            zIndex: '1000',
            display: 'none',
            borderRadius: '2px',
            boxShadow: '0 0 0 1px rgba(52, 152, 219, 0.3)'
        }
    });
    
    // Add selection indicator to canvas
    this.canvas.appendChild(this.selectionIndicator);
    
    // Create selection handles (for future resize functionality)
    this.createSelectionHandles();
};

/**
 * Create selection handles for element manipulation
 */
CanvasManager.prototype.createSelectionHandles = function() {
    var handlePositions = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];
    
    for (var i = 0; i < handlePositions.length; i++) {
        var position = handlePositions[i];
        var handle = DOMUtils.createElement('div', {
            className: 'vwb-selection-handle vwb-handle-' + position,
            attributes: {
                'data-handle-position': position
            },
            styles: {
                position: 'absolute',
                width: '8px',
                height: '8px',
                backgroundColor: '#3498db',
                border: '1px solid #ffffff',
                borderRadius: '50%',
                cursor: this.getHandleCursor(position),
                display: 'none',
                zIndex: '1001',
                transform: 'translate(-50%, -50%)'
            }
        });
        
        this.selectionHandles.push(handle);
        this.canvas.appendChild(handle);
    }
};

/**
 * Get cursor style for selection handle
 */
CanvasManager.prototype.getHandleCursor = function(position) {
    var cursors = {
        'nw': 'nw-resize',
        'ne': 'ne-resize',
        'sw': 'sw-resize',
        'se': 'se-resize',
        'n': 'n-resize',
        's': 's-resize',
        'e': 'e-resize',
        'w': 'w-resize'
    };
    
    return cursors[position] || 'default';
};

/**
 * Set up event listeners
 */
CanvasManager.prototype.setupEventListeners = function() {
    var self = this;
    
    // Canvas click for element selection
    DOMUtils.addEventListener(this.canvas, 'click', function(event) {
        self.handleCanvasClick(event);
    });
    
    // Canvas mouse events for hover effects
    DOMUtils.addEventListener(this.canvas, 'mouseover', function(event) {
        self.handleCanvasMouseOver(event);
    });
    
    DOMUtils.addEventListener(this.canvas, 'mouseout', function(event) {
        self.handleCanvasMouseOut(event);
    });
    
    // Keyboard events for element manipulation
    DOMUtils.addEventListener(this.canvas, 'keydown', function(event) {
        self.handleCanvasKeyDown(event);
    });
    
    // Prevent default drag behavior on canvas elements
    DOMUtils.addEventListener(this.canvas, 'dragstart', function(event) {
        if (DOMUtils.hasClass(event.target, self.config.canvasElementClass)) {
            event.preventDefault();
        }
    });
};

/**
 * Set up event bus listeners
 */
CanvasManager.prototype.setupEventBusListeners = function() {
    var self = this;
    
    // Listen for element creation from drag and drop
    this.eventBus.on('element:created', function(data) {
        self.handleElementCreated(data);
    });
    
    // Listen for global clicks to handle deselection
    this.eventBus.on('global:click', function(data) {
        self.handleGlobalClick(data);
    });
    
    // Listen for canvas layout updates
    this.eventBus.on('canvas:update-layout', function() {
        self.updateSelectionIndicator();
    });
    
    // Listen for property updates from PropertyEditor
    this.eventBus.on('property:update', function(data) {
        self.handlePropertyUpdate(data);
    });
};

/**
 * Handle canvas click events
 */
CanvasManager.prototype.handleCanvasClick = function(event) {
    event.stopPropagation();
    
    var target = event.target;
    
    // Find the canvas element that was clicked
    var canvasElement = this.findCanvasElement(target);
    
    if (canvasElement) {
        // Select the element
        this.selectElement(canvasElement);
    } else if (target === this.canvas) {
        // Clicked on empty canvas area - deselect
        this.deselectElement();
    }
};

/**
 * Handle canvas mouse over events
 */
CanvasManager.prototype.handleCanvasMouseOver = function(event) {
    var target = event.target;
    var canvasElement = this.findCanvasElement(target);
    
    if (canvasElement && canvasElement !== this.state.selectedElement) {
        // Add highlight class for hover effect
        DOMUtils.addClass(canvasElement, this.config.highlightClass);
    }
};

/**
 * Handle canvas mouse out events
 */
CanvasManager.prototype.handleCanvasMouseOut = function(event) {
    var target = event.target;
    var canvasElement = this.findCanvasElement(target);
    
    if (canvasElement && canvasElement !== this.state.selectedElement) {
        // Remove highlight class
        DOMUtils.removeClass(canvasElement, this.config.highlightClass);
    }
};

/**
 * Handle canvas keyboard events
 */
CanvasManager.prototype.handleCanvasKeyDown = function(event) {
    if (!this.state.selectedElement) return;
    
    switch (event.key) {
        case 'Delete':
        case 'Backspace':
            event.preventDefault();
            this.deleteElement(this.state.selectedElement);
            break;
            
        case 'Escape':
            event.preventDefault();
            this.deselectElement();
            break;
            
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
            event.preventDefault();
            this.navigateSelection(event.key);
            break;
    }
};

/**
 * Handle element created event from drag and drop
 */
CanvasManager.prototype.handleElementCreated = function(data) {
    var element = data.element;
    var elementType = data.elementType;
    
    if (!element) return;
    
    // Process the new element
    this.processNewElement(element, elementType);
    
    // Select the newly created element
    this.selectElement(element);
    
    console.log('CanvasManager: Processed new element', elementType);
};

/**
 * Handle global click events for deselection
 */
CanvasManager.prototype.handleGlobalClick = function(data) {
    var target = data.target;
    
    // If click is outside canvas and not on property panel, deselect
    if (!this.canvas.contains(target) && 
        !target.closest('.right-panel') && 
        !target.closest('.vwb-selection-indicator') &&
        !target.closest('.vwb-selection-handle')) {
        this.deselectElement();
    }
};

/**
 * Handle property updates from PropertyEditor
 */
CanvasManager.prototype.handlePropertyUpdate = function(data) {
    var element = data.element;
    var updateData = data.updateData;
    
    if (!element || !updateData) return;
    
    // Update the element using the existing updateElement method
    this.updateElement(element, updateData);
    
    console.log('CanvasManager: Applied property update', data.property, data.value);
};

/**
 * Create a new element on the canvas
 */
CanvasManager.prototype.createElement = function(elementType, properties) {
    properties = properties || {};
    
    try {
        // Generate unique ID
        var elementId = this.generateUniqueId();
        
        // Create element data
        var elementData = {
            id: elementId,
            type: elementType,
            content: properties.content || this.getDefaultContent(elementType),
            styles: properties.styles || {},
            attributes: properties.attributes || {},
            children: [],
            parent: null
        };
        
        // Create DOM element
        var domElement = this.createDOMElement(elementData);
        
        // Store element data
        this.state.elements[elementId] = elementData;
        
        // Add to root elements if no parent specified
        if (!properties.parent) {
            this.state.rootElements.push(elementId);
        }
        
        return domElement;
        
    } catch (error) {
        console.error('Error creating element:', error);
        return null;
    }
};

/**
 * Create DOM element from element data
 */
CanvasManager.prototype.createDOMElement = function(elementData) {
    var tagName = this.getTagNameForType(elementData.type);
    
    var element = DOMUtils.createElement(tagName, {
        attributes: Object.assign({
            id: elementData.id,
            'data-vwb-type': elementData.type,
            'data-vwb-id': elementData.id
        }, elementData.attributes),
        className: this.config.canvasElementClass,
        styles: Object.assign({
            minHeight: '20px',
            minWidth: '20px',
            position: 'relative'
        }, elementData.styles)
    });
    
    // Set content
    if (elementData.content) {
        if (this.isTextElement(elementData.type)) {
            element.textContent = elementData.content;
        } else {
            element.innerHTML = elementData.content;
        }
    }
    
    return element;
};

/**
 * Process a new element added to the canvas
 */
CanvasManager.prototype.processNewElement = function(element, elementType) {
    if (!element) return;
    
    // Generate unique ID if not present
    var elementId = element.id;
    if (!elementId || !elementId.startsWith(this.config.idPrefix)) {
        elementId = this.generateUniqueId();
        element.id = elementId;
    }
    
    // Add canvas element class
    DOMUtils.addClass(element, this.config.canvasElementClass);
    
    // Set data attributes
    element.setAttribute('data-vwb-type', elementType);
    element.setAttribute('data-vwb-id', elementId);
    
    // Create element data
    var elementData = {
        id: elementId,
        type: elementType,
        content: element.textContent || element.innerHTML || '',
        styles: this.extractElementStyles(element),
        attributes: this.extractElementAttributes(element),
        children: [],
        parent: this.findElementParent(element)
    };
    
    // Store element data
    this.state.elements[elementId] = elementData;
    
    // Update hierarchy
    this.updateElementHierarchy(element);
    
    // Emit element added event
    this.eventBus.emit('canvas:element-added', {
        element: element,
        elementData: elementData
    });
};

/**
 * Select an element and show visual feedback
 */
CanvasManager.prototype.selectElement = function(element) {
    if (!element) return;
    
    // Deselect current element
    if (this.state.selectedElement) {
        this.deselectElement();
    }
    
    // Set new selected element
    this.state.selectedElement = element;
    
    // Add selected class
    DOMUtils.addClass(element, this.config.selectedClass);
    
    // Update selection indicator
    this.updateSelectionIndicator();
    
    // Update breadcrumb navigation
    this.updateBreadcrumbNavigation();
    
    // Focus canvas for keyboard navigation
    this.canvas.focus();
    
    // Emit selection event
    var elementId = element.getAttribute('data-vwb-id');
    var elementData = this.state.elements[elementId];
    
    this.eventBus.emit('element:selected', {
        element: element,
        elementData: elementData
    });
    
    console.log('CanvasManager: Selected element', elementId, 'with breadcrumb navigation');
};

/**
 * Deselect the currently selected element
 */
CanvasManager.prototype.deselectElement = function() {
    if (!this.state.selectedElement) return;
    
    var previousElement = this.state.selectedElement;
    
    // Remove selected class
    DOMUtils.removeClass(previousElement, this.config.selectedClass);
    
    // Hide selection indicator
    this.hideSelectionIndicator();
    
    // Hide breadcrumb navigation
    this.hideBreadcrumbNavigation();
    
    // Clear selected element
    this.state.selectedElement = null;
    
    // Emit deselection event
    this.eventBus.emit('element:deselected', {
        element: previousElement
    });
    
    console.log('CanvasManager: Deselected element');
};

/**
 * Update selection indicator position and visibility
 */
CanvasManager.prototype.updateSelectionIndicator = function() {
    if (!this.state.selectedElement || !this.selectionIndicator) {
        this.hideSelectionIndicator();
        return;
    }
    
    var element = this.state.selectedElement;
    var rect = element.getBoundingClientRect();
    var canvasRect = this.canvas.getBoundingClientRect();
    
    // Calculate position relative to canvas
    var left = rect.left - canvasRect.left;
    var top = rect.top - canvasRect.top;
    var width = rect.width;
    var height = rect.height;
    
    // Update selection indicator
    DOMUtils.setStyles(this.selectionIndicator, {
        display: 'block',
        left: left + 'px',
        top: top + 'px',
        width: width + 'px',
        height: height + 'px'
    });
    
    // Update selection handles
    this.updateSelectionHandles(left, top, width, height);
};

/**
 * Update selection handles positions
 */
CanvasManager.prototype.updateSelectionHandles = function(left, top, width, height) {
    var positions = {
        'nw': { x: left, y: top },
        'ne': { x: left + width, y: top },
        'sw': { x: left, y: top + height },
        'se': { x: left + width, y: top + height },
        'n': { x: left + width / 2, y: top },
        's': { x: left + width / 2, y: top + height },
        'e': { x: left + width, y: top + height / 2 },
        'w': { x: left, y: top + height / 2 }
    };
    
    for (var i = 0; i < this.selectionHandles.length; i++) {
        var handle = this.selectionHandles[i];
        var position = handle.getAttribute('data-handle-position');
        var pos = positions[position];
        
        if (pos) {
            DOMUtils.setStyles(handle, {
                display: 'block',
                left: pos.x + 'px',
                top: pos.y + 'px'
            });
        }
    }
};

/**
 * Hide selection indicator and handles
 */
CanvasManager.prototype.hideSelectionIndicator = function() {
    if (this.selectionIndicator) {
        this.selectionIndicator.style.display = 'none';
    }
    
    for (var i = 0; i < this.selectionHandles.length; i++) {
        this.selectionHandles[i].style.display = 'none';
    }
};

/**
 * Create breadcrumb navigation system
 */
CanvasManager.prototype.createBreadcrumbNavigation = function() {
    // Create breadcrumb container
    this.breadcrumbContainer = DOMUtils.createElement('div', {
        className: 'vwb-breadcrumb-container',
        styles: {
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e1e8ed',
            borderRadius: '4px',
            padding: '8px 12px',
            fontSize: '12px',
            fontFamily: 'system-ui, sans-serif',
            color: '#2c3e50',
            zIndex: '999',
            display: 'none',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(4px)',
            maxWidth: '300px',
            overflow: 'hidden'
        }
    });
    
    // Add breadcrumb container to canvas
    this.canvas.appendChild(this.breadcrumbContainer);
};

/**
 * Update breadcrumb navigation
 */
CanvasManager.prototype.updateBreadcrumbNavigation = function() {
    if (!this.breadcrumbContainer || !this.state.selectedElement) {
        this.hideBreadcrumbNavigation();
        return;
    }
    
    var elementId = this.state.selectedElement.getAttribute('data-vwb-id');
    var hierarchy = this.getElementHierarchy(elementId);
    
    if (hierarchy.length === 0) {
        this.hideBreadcrumbNavigation();
        return;
    }
    
    // Clear existing breadcrumb content
    this.breadcrumbContainer.innerHTML = '';
    
    // Create breadcrumb items
    for (var i = 0; i < hierarchy.length; i++) {
        var elementData = hierarchy[i];
        var isLast = i === hierarchy.length - 1;
        
        // Create breadcrumb item
        var breadcrumbItem = this.createBreadcrumbItem(elementData, isLast);
        this.breadcrumbContainer.appendChild(breadcrumbItem);
        
        // Add separator if not last item
        if (!isLast) {
            var separator = DOMUtils.createElement('span', {
                className: 'vwb-breadcrumb-separator',
                textContent: ' > ',
                styles: {
                    margin: '0 4px',
                    color: '#95a5a6',
                    fontWeight: 'normal'
                }
            });
            this.breadcrumbContainer.appendChild(separator);
        }
    }
    
    // Show breadcrumb container
    this.breadcrumbContainer.style.display = 'block';
    
    console.log('CanvasManager: Updated breadcrumb navigation with', hierarchy.length, 'items');
};

/**
 * Create a breadcrumb item
 */
CanvasManager.prototype.createBreadcrumbItem = function(elementData, isLast) {
    var self = this;
    var displayName = this.getElementDisplayName(elementData.type);
    
    var breadcrumbItem = DOMUtils.createElement('span', {
        className: 'vwb-breadcrumb-item' + (isLast ? ' vwb-breadcrumb-current' : ''),
        textContent: displayName,
        attributes: {
            'data-element-id': elementData.id,
            'title': 'Click to select ' + displayName
        },
        styles: {
            cursor: isLast ? 'default' : 'pointer',
            fontWeight: isLast ? '600' : '500',
            color: isLast ? '#2c3e50' : '#3498db',
            textDecoration: 'none',
            padding: '2px 4px',
            borderRadius: '2px',
            transition: 'background-color 0.2s ease'
        }
    });
    
    // Add click handler for non-current items
    if (!isLast) {
        DOMUtils.addEventListener(breadcrumbItem, 'click', function(event) {
            event.stopPropagation();
            var targetElementId = breadcrumbItem.getAttribute('data-element-id');
            var targetElement = document.getElementById(targetElementId);
            if (targetElement) {
                self.selectElement(targetElement);
            }
        });
        
        // Add hover effect
        DOMUtils.addEventListener(breadcrumbItem, 'mouseover', function() {
            breadcrumbItem.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
        });
        
        DOMUtils.addEventListener(breadcrumbItem, 'mouseout', function() {
            breadcrumbItem.style.backgroundColor = 'transparent';
        });
    }
    
    return breadcrumbItem;
};

/**
 * Get element hierarchy from root to selected element
 */
CanvasManager.prototype.getElementHierarchy = function(elementId) {
    var hierarchy = [];
    var currentId = elementId;
    
    while (currentId) {
        var elementData = this.state.elements[currentId];
        if (!elementData) break;
        
        hierarchy.unshift(elementData);
        currentId = elementData.parent;
    }
    
    return hierarchy;
};

/**
 * Get display name for element type
 */
CanvasManager.prototype.getElementDisplayName = function(type) {
    var displayNames = {
        'div': 'Container',
        'paragraph': 'Paragraph',
        'heading1': 'Heading 1',
        'heading2': 'Heading 2',
        'heading3': 'Heading 3',
        'heading4': 'Heading 4',
        'heading5': 'Heading 5',
        'heading6': 'Heading 6',
        'button': 'Button',
        'input': 'Input',
        'textarea': 'Textarea',
        'image': 'Image',
        'link': 'Link',
        'span': 'Text',
        'section': 'Section',
        'article': 'Article',
        'header': 'Header',
        'footer': 'Footer',
        'nav': 'Navigation',
        'aside': 'Aside'
    };
    
    return displayNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

/**
 * Hide breadcrumb navigation
 */
CanvasManager.prototype.hideBreadcrumbNavigation = function() {
    if (this.breadcrumbContainer) {
        this.breadcrumbContainer.style.display = 'none';
    }
};

/**
 * Delete an element from the canvas
 */
CanvasManager.prototype.deleteElement = function(element) {
    if (!element) return false;
    
    var elementId = element.getAttribute('data-vwb-id');
    var elementData = this.state.elements[elementId];
    
    if (!elementData) return false;
    
    try {
        // Handle child elements
        this.handleChildElementsOnDelete(elementData);
        
        // Remove from parent's children array
        this.removeFromParentChildren(elementData);
        
        // Remove from root elements if applicable
        var rootIndex = this.state.rootElements.indexOf(elementId);
        if (rootIndex !== -1) {
            this.state.rootElements.splice(rootIndex, 1);
        }
        
        // Remove from DOM
        DOMUtils.removeElement(element);
        
        // Remove from state
        delete this.state.elements[elementId];
        
        // Deselect if this was the selected element
        if (this.state.selectedElement === element) {
            this.state.selectedElement = null;
            this.hideSelectionIndicator();
        }
        
        // Emit deletion event
        this.eventBus.emit('element:deleted', {
            elementId: elementId,
            elementData: elementData
        });
        
        console.log('CanvasManager: Deleted element', elementId);
        return true;
        
    } catch (error) {
        console.error('Error deleting element:', error);
        return false;
    }
};

/**
 * Handle child elements when parent is deleted
 */
CanvasManager.prototype.handleChildElementsOnDelete = function(parentData) {
    if (!parentData.children || parentData.children.length === 0) return;
    
    // For now, delete all child elements
    // In the future, this could be configurable (move to parent container, etc.)
    for (var i = 0; i < parentData.children.length; i++) {
        var childId = parentData.children[i];
        var childElement = document.getElementById(childId);
        if (childElement) {
            this.deleteElement(childElement);
        }
    }
};

/**
 * Remove element from parent's children array
 */
CanvasManager.prototype.removeFromParentChildren = function(elementData) {
    if (!elementData.parent) return;
    
    var parentData = this.state.elements[elementData.parent];
    if (parentData && parentData.children) {
        var index = parentData.children.indexOf(elementData.id);
        if (index !== -1) {
            parentData.children.splice(index, 1);
        }
    }
};

/**
 * Update element properties
 */
CanvasManager.prototype.updateElement = function(element, properties) {
    if (!element || !properties) return false;
    
    var elementId = element.getAttribute('data-vwb-id');
    var elementData = this.state.elements[elementId];
    
    if (!elementData) return false;
    
    try {
        // Update styles
        if (properties.styles) {
            Object.assign(elementData.styles, properties.styles);
            DOMUtils.setStyles(element, properties.styles);
        }
        
        // Update attributes
        if (properties.attributes) {
            Object.assign(elementData.attributes, properties.attributes);
            for (var attr in properties.attributes) {
                element.setAttribute(attr, properties.attributes[attr]);
            }
        }
        
        // Update content
        if (properties.content !== undefined) {
            elementData.content = properties.content;
            if (this.isTextElement(elementData.type)) {
                element.textContent = properties.content;
            } else {
                element.innerHTML = properties.content;
            }
        }
        
        // Update selection indicator if this element is selected
        if (this.state.selectedElement === element) {
            // Use setTimeout to allow DOM to update
            setTimeout(function() {
                this.updateSelectionIndicator();
            }.bind(this), 0);
        }
        
        // Emit update event
        this.eventBus.emit('element:updated', {
            element: element,
            elementData: elementData,
            properties: properties
        });
        
        return true;
        
    } catch (error) {
        console.error('Error updating element:', error);
        return false;
    }
};

/**
 * Get canvas HTML content
 */
CanvasManager.prototype.getCanvasHTML = function() {
    return this.canvas.innerHTML;
};

/**
 * Clear the canvas
 */
CanvasManager.prototype.clearCanvas = function() {
    // Deselect current element
    this.deselectElement();
    
    // Remove all canvas elements
    var canvasElements = this.canvas.querySelectorAll('.' + this.config.canvasElementClass);
    for (var i = 0; i < canvasElements.length; i++) {
        DOMUtils.removeElement(canvasElements[i]);
    }
    
    // Reset state
    this.state.elements = {};
    this.state.rootElements = [];
    this.state.selectedElement = null;
    
    // Emit clear event
    this.eventBus.emit('canvas:cleared');
    
    console.log('CanvasManager: Canvas cleared');
};

/**
 * Generate unique ID for canvas elements
 */
CanvasManager.prototype.generateUniqueId = function() {
    var id;
    do {
        id = this.config.idPrefix + '-' + this.state.nextElementId;
        this.state.nextElementId++;
    } while (document.getElementById(id));
    
    return id;
};

/**
 * Find canvas element from target (walks up DOM tree)
 */
CanvasManager.prototype.findCanvasElement = function(target) {
    var current = target;
    while (current && current !== this.canvas) {
        if (DOMUtils.hasClass(current, this.config.canvasElementClass)) {
            return current;
        }
        current = current.parentElement;
    }
    return null;
};

/**
 * Update element hierarchy relationships
 */
CanvasManager.prototype.updateElementHierarchy = function(element) {
    var elementId = element.getAttribute('data-vwb-id');
    var elementData = this.state.elements[elementId];
    
    if (!elementData) return;
    
    // Find parent element
    var parent = element.parentElement;
    var parentId = null;
    
    if (parent && parent !== this.canvas) {
        parentId = parent.getAttribute('data-vwb-id');
        if (parentId && this.state.elements[parentId]) {
            elementData.parent = parentId;
            
            // Add to parent's children if not already there
            var parentData = this.state.elements[parentId];
            if (parentData.children.indexOf(elementId) === -1) {
                parentData.children.push(elementId);
            }
            
            // Remove from root elements
            var rootIndex = this.state.rootElements.indexOf(elementId);
            if (rootIndex !== -1) {
                this.state.rootElements.splice(rootIndex, 1);
            }
        }
    } else {
        // Element is at root level
        elementData.parent = null;
        if (this.state.rootElements.indexOf(elementId) === -1) {
            this.state.rootElements.push(elementId);
        }
    }
};

/**
 * Navigate selection using keyboard
 */
CanvasManager.prototype.navigateSelection = function(direction) {
    if (!this.state.selectedElement) return;
    
    var currentId = this.state.selectedElement.getAttribute('data-vwb-id');
    var nextElement = null;
    
    switch (direction) {
        case 'ArrowUp':
            nextElement = this.findPreviousSibling(currentId);
            break;
        case 'ArrowDown':
            nextElement = this.findNextSibling(currentId);
            break;
        case 'ArrowLeft':
            nextElement = this.findParentElement(currentId);
            break;
        case 'ArrowRight':
            nextElement = this.findFirstChild(currentId);
            break;
    }
    
    if (nextElement) {
        this.selectElement(nextElement);
    }
};

/**
 * Find previous sibling element
 */
CanvasManager.prototype.findPreviousSibling = function(elementId) {
    var elementData = this.state.elements[elementId];
    if (!elementData) return null;
    
    var siblings = this.getSiblings(elementId);
    var currentIndex = siblings.indexOf(elementId);
    
    if (currentIndex > 0) {
        return document.getElementById(siblings[currentIndex - 1]);
    }
    
    return null;
};

/**
 * Find next sibling element
 */
CanvasManager.prototype.findNextSibling = function(elementId) {
    var elementData = this.state.elements[elementId];
    if (!elementData) return null;
    
    var siblings = this.getSiblings(elementId);
    var currentIndex = siblings.indexOf(elementId);
    
    if (currentIndex < siblings.length - 1) {
        return document.getElementById(siblings[currentIndex + 1]);
    }
    
    return null;
};

/**
 * Find parent element
 */
CanvasManager.prototype.findParentElement = function(elementId) {
    var elementData = this.state.elements[elementId];
    if (!elementData || !elementData.parent) return null;
    
    return document.getElementById(elementData.parent);
};

/**
 * Find first child element
 */
CanvasManager.prototype.findFirstChild = function(elementId) {
    var elementData = this.state.elements[elementId];
    if (!elementData || !elementData.children || elementData.children.length === 0) return null;
    
    return document.getElementById(elementData.children[0]);
};

/**
 * Get siblings of an element
 */
CanvasManager.prototype.getSiblings = function(elementId) {
    var elementData = this.state.elements[elementId];
    if (!elementData) return [];
    
    if (elementData.parent) {
        var parentData = this.state.elements[elementData.parent];
        return parentData ? parentData.children : [];
    } else {
        return this.state.rootElements;
    }
};

/**
 * Helper methods for element type handling
 */
CanvasManager.prototype.getTagNameForType = function(type) {
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
    
    return tagMap[type] || 'div';
};

CanvasManager.prototype.isTextElement = function(type) {
    var textTypes = ['paragraph', 'heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6', 'button', 'span', 'link'];
    return textTypes.indexOf(type) !== -1;
};

CanvasManager.prototype.getDefaultContent = function(type) {
    var defaultContent = {
        'paragraph': 'This is a paragraph',
        'heading1': 'Heading 1',
        'heading2': 'Heading 2',
        'heading3': 'Heading 3',
        'heading4': 'Heading 4',
        'heading5': 'Heading 5',
        'heading6': 'Heading 6',
        'button': 'Button',
        'link': 'Link',
        'span': 'Text'
    };
    
    return defaultContent[type] || '';
};

CanvasManager.prototype.findElementParent = function(element) {
    var parent = element.parentElement;
    if (parent && parent !== this.canvas) {
        return parent.getAttribute('data-vwb-id');
    }
    return null;
};

CanvasManager.prototype.extractElementStyles = function(element) {
    // Extract inline styles
    var styles = {};
    if (element.style.cssText) {
        var styleDeclarations = element.style.cssText.split(';');
        for (var i = 0; i < styleDeclarations.length; i++) {
            var declaration = styleDeclarations[i].trim();
            if (declaration) {
                var colonIndex = declaration.indexOf(':');
                if (colonIndex > 0) {
                    var property = declaration.substring(0, colonIndex).trim();
                    var value = declaration.substring(colonIndex + 1).trim();
                    styles[property] = value;
                }
            }
        }
    }
    return styles;
};

CanvasManager.prototype.extractElementAttributes = function(element) {
    var attributes = {};
    for (var i = 0; i < element.attributes.length; i++) {
        var attr = element.attributes[i];
        if (!attr.name.startsWith('data-vwb-') && attr.name !== 'id' && attr.name !== 'class') {
            attributes[attr.name] = attr.value;
        }
    }
    return attributes;
};

/**
 * Get current canvas state
 */
CanvasManager.prototype.getState = function() {
    return {
        selectedElement: this.state.selectedElement,
        elementCount: Object.keys(this.state.elements).length,
        rootElementCount: this.state.rootElements.length,
        elements: this.state.elements,
        rootElements: this.state.rootElements
    };
};

/**
 * Clean up resources
 */
CanvasManager.prototype.destroy = function() {
    if (!this.initialized) return;
    
    // Clear canvas
    this.clearCanvas();
    
    // Remove selection system elements
    if (this.selectionIndicator) {
        DOMUtils.removeElement(this.selectionIndicator);
        this.selectionIndicator = null;
    }
    
    for (var i = 0; i < this.selectionHandles.length; i++) {
        DOMUtils.removeElement(this.selectionHandles[i]);
    }
    this.selectionHandles = [];
    
    // Remove breadcrumb navigation
    if (this.breadcrumbContainer) {
        DOMUtils.removeElement(this.breadcrumbContainer);
        this.breadcrumbContainer = null;
    }
    
    // Reset state
    this.state = {
        selectedElement: null,
        elements: {},
        rootElements: [],
        nextElementId: 1
    };
    
    this.initialized = false;
    console.log('CanvasManager destroyed');
};