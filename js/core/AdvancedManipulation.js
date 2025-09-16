/**
 * AdvancedManipulation - Advanced Element Manipulation Features
 * 
 * This class provides advanced element manipulation capabilities including:
 * - Element reordering within containers (drag to reorder)
 * - Element duplication functionality
 * - Undo/redo system for canvas operations
 * - Element grouping and ungrouping capabilities
 * - Element alignment and distribution tools
 */

function AdvancedManipulation(canvasManager, eventBus) {
    this.canvasManager = canvasManager;
    this.eventBus = eventBus;
    this.initialized = false;
    
    // Undo/Redo system
    this.history = {
        stack: [],
        currentIndex: -1,
        maxSize: 50
    };
    
    // Reordering state
    this.reorderState = {
        isDragging: false,
        draggedElement: null,
        placeholder: null,
        originalParent: null,
        originalIndex: null
    };
    
    // Group management
    this.groups = new Map(); // groupId -> { elements: [], name: '', styles: {} }
    this.nextGroupId = 1;
    
    // Configuration
    this.config = {
        reorderClass: 'vwb-reordering',
        placeholderClass: 'vwb-reorder-placeholder',
        groupClass: 'vwb-group',
        selectedGroupClass: 'vwb-group-selected',
        alignmentGuideClass: 'vwb-alignment-guide'
    };
}

/**
 * Initialize the advanced manipulation system
 */
AdvancedManipulation.prototype.init = function() {
    if (this.initialized) {
        console.warn('AdvancedManipulation already initialized');
        return;
    }

    try {
        console.log('Initializing AdvancedManipulation...');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Create UI elements
        this.createUIElements();
        
        // Initialize history with current state
        this.saveState('Initial state');
        
        this.initialized = true;
        console.log('AdvancedManipulation initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize AdvancedManipulation:', error);
        throw error;
    }
};
/**

 * Set up event listeners
 */
AdvancedManipulation.prototype.setupEventListeners = function() {
    var self = this;
    
    // Listen for canvas element changes to save history
    this.eventBus.on('element:created', function(data) {
        self.saveState('Element created: ' + data.elementType);
    });
    
    this.eventBus.on('element:deleted', function(data) {
        self.saveState('Element deleted');
    });
    
    this.eventBus.on('element:updated', function(data) {
        self.saveState('Element updated');
    });
    
    // Listen for element selection to enable reordering
    this.eventBus.on('element:selected', function(data) {
        self.enableReordering(data.element);
    });
    
    this.eventBus.on('element:deselected', function(data) {
        self.disableReordering();
    });
    
    // Listen for global mouse events for reordering
    this.eventBus.on('global:mousedown', function(data) {
        self.handleGlobalMouseDown(data);
    });
    
    this.eventBus.on('global:mouseup', function(data) {
        self.handleGlobalMouseUp(data);
    });
};

/**
 * Set up keyboard shortcuts
 */
AdvancedManipulation.prototype.setupKeyboardShortcuts = function() {
    var self = this;
    
    document.addEventListener('keydown', function(event) {
        // Ctrl/Cmd + Z for undo
        if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
            event.preventDefault();
            self.undo();
        }
        
        // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
        if ((event.ctrlKey || event.metaKey) && 
            ((event.key === 'z' && event.shiftKey) || event.key === 'y')) {
            event.preventDefault();
            self.redo();
        }
        
        // Ctrl/Cmd + D for duplicate
        if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
            event.preventDefault();
            self.duplicateSelectedElement();
        }
        
        // Ctrl/Cmd + G for group
        if ((event.ctrlKey || event.metaKey) && event.key === 'g') {
            event.preventDefault();
            self.groupSelectedElements();
        }
        
        // Ctrl/Cmd + Shift + G for ungroup
        if ((event.ctrlKey || event.metaKey) && event.key === 'g' && event.shiftKey) {
            event.preventDefault();
            self.ungroupSelectedElements();
        }
    });
};

/**
 * Create UI elements for advanced manipulation
 */
AdvancedManipulation.prototype.createUIElements = function() {
    this.createReorderPlaceholder();
    this.createAlignmentGuides();
    this.createToolbar();
};

/**
 * Create placeholder element for reordering
 */
AdvancedManipulation.prototype.createReorderPlaceholder = function() {
    this.reorderState.placeholder = DOMUtils.createElement('div', {
        className: this.config.placeholderClass,
        styles: {
            position: 'relative',
            height: '2px',
            backgroundColor: '#3498db',
            margin: '4px 0',
            borderRadius: '1px',
            display: 'none',
            zIndex: '999',
            boxShadow: '0 0 4px rgba(52, 152, 219, 0.5)'
        }
    });
};

/**
 * Create alignment guides
 */
AdvancedManipulation.prototype.createAlignmentGuides = function() {
    this.alignmentGuides = {
        horizontal: DOMUtils.createElement('div', {
            className: this.config.alignmentGuideClass + ' horizontal',
            styles: {
                position: 'absolute',
                height: '1px',
                backgroundColor: '#e74c3c',
                display: 'none',
                zIndex: '1000',
                pointerEvents: 'none'
            }
        }),
        vertical: DOMUtils.createElement('div', {
            className: this.config.alignmentGuideClass + ' vertical',
            styles: {
                position: 'absolute',
                width: '1px',
                backgroundColor: '#e74c3c',
                display: 'none',
                zIndex: '1000',
                pointerEvents: 'none'
            }
        })
    };
    
    // Add guides to canvas
    var canvas = this.canvasManager.canvas;
    canvas.appendChild(this.alignmentGuides.horizontal);
    canvas.appendChild(this.alignmentGuides.vertical);
};

/**
 * Create manipulation toolbar
 */
AdvancedManipulation.prototype.createToolbar = function() {
    // This will be integrated with the existing UI
    // For now, we'll use keyboard shortcuts and context menus
    console.log('Advanced manipulation toolbar ready (keyboard shortcuts active)');
};

// ============================================================================
// ELEMENT REORDERING FUNCTIONALITY
// ============================================================================

/**
 * Enable reordering for the selected element
 */
AdvancedManipulation.prototype.enableReordering = function(element) {
    if (!element) return;
    
    var self = this;
    
    // Add reorder capability by making element draggable
    element.draggable = true;
    DOMUtils.addClass(element, 'vwb-reorderable');
    
    // Add drag event listeners
    DOMUtils.addEventListener(element, 'dragstart', function(event) {
        self.handleReorderDragStart(event, element);
    });
    
    DOMUtils.addEventListener(element, 'dragend', function(event) {
        self.handleReorderDragEnd(event, element);
    });
};

/**
 * Disable reordering
 */
AdvancedManipulation.prototype.disableReordering = function() {
    var reorderableElements = document.querySelectorAll('.vwb-reorderable');
    for (var i = 0; i < reorderableElements.length; i++) {
        var element = reorderableElements[i];
        element.draggable = false;
        DOMUtils.removeClass(element, 'vwb-reorderable');
    }
};

/**
 * Handle reorder drag start
 */
AdvancedManipulation.prototype.handleReorderDragStart = function(event, element) {
    this.reorderState.isDragging = true;
    this.reorderState.draggedElement = element;
    this.reorderState.originalParent = element.parentElement;
    this.reorderState.originalIndex = this.getElementIndex(element);
    
    // Set drag data
    event.dataTransfer.setData('text/plain', JSON.stringify({
        source: 'reorder',
        elementId: element.id
    }));
    
    event.dataTransfer.effectAllowed = 'move';
    
    // Add visual feedback
    DOMUtils.addClass(element, this.config.reorderClass);
    
    // Set up drop zones for reordering
    this.setupReorderDropZones();
    
    console.log('Started reordering element:', element.id);
};

/**
 * Handle reorder drag end
 */
AdvancedManipulation.prototype.handleReorderDragEnd = function(event, element) {
    // Clean up reorder state
    this.cleanupReorderState();
    
    console.log('Ended reordering element:', element.id);
};

/**
 * Set up drop zones for reordering
 */
AdvancedManipulation.prototype.setupReorderDropZones = function() {
    var self = this;
    var canvas = this.canvasManager.canvas;
    
    // Add drop listeners to canvas and container elements
    var containers = canvas.querySelectorAll('.vwb-canvas-element');
    
    for (var i = 0; i < containers.length; i++) {
        var container = containers[i];
        if (this.isContainer(container)) {
            this.addReorderDropListeners(container);
        }
    }
    
    // Add to canvas itself
    this.addReorderDropListeners(canvas);
};

/**
 * Add reorder drop listeners to a container
 */
AdvancedManipulation.prototype.addReorderDropListeners = function(container) {
    var self = this;
    
    var dragOverHandler = function(event) {
        if (!self.reorderState.isDragging) return;
        
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        
        // Show placeholder at appropriate position
        self.showReorderPlaceholder(event, container);
    };
    
    var dropHandler = function(event) {
        if (!self.reorderState.isDragging) return;
        
        event.preventDefault();
        
        // Perform the reorder
        self.performReorder(event, container);
    };
    
    DOMUtils.addEventListener(container, 'dragover', dragOverHandler);
    DOMUtils.addEventListener(container, 'drop', dropHandler);
    
    // Store handlers for cleanup
    container._reorderHandlers = {
        dragover: dragOverHandler,
        drop: dropHandler
    };
};

/**
 * Show reorder placeholder
 */
AdvancedManipulation.prototype.showReorderPlaceholder = function(event, container) {
    var insertionPoint = this.calculateReorderInsertionPoint(event, container);
    
    if (insertionPoint.element) {
        // Insert placeholder before the target element
        container.insertBefore(this.reorderState.placeholder, insertionPoint.element);
    } else {
        // Append to end of container
        container.appendChild(this.reorderState.placeholder);
    }
    
    this.reorderState.placeholder.style.display = 'block';
};

/**
 * Calculate reorder insertion point
 */
AdvancedManipulation.prototype.calculateReorderInsertionPoint = function(event, container) {
    var children = Array.from(container.children).filter(function(child) {
        return DOMUtils.hasClass(child, 'vwb-canvas-element') && 
               child !== this.reorderState.draggedElement;
    }.bind(this));
    
    var mouseY = event.clientY;
    
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var rect = child.getBoundingClientRect();
        var centerY = rect.top + rect.height / 2;
        
        if (mouseY < centerY) {
            return { element: child, index: i };
        }
    }
    
    return { element: null, index: children.length };
};

/**
 * Perform the reorder operation
 */
AdvancedManipulation.prototype.performReorder = function(event, container) {
    var draggedElement = this.reorderState.draggedElement;
    var insertionPoint = this.calculateReorderInsertionPoint(event, container);
    
    // Remove element from original position
    if (draggedElement.parentElement) {
        draggedElement.parentElement.removeChild(draggedElement);
    }
    
    // Insert at new position
    if (insertionPoint.element) {
        container.insertBefore(draggedElement, insertionPoint.element);
    } else {
        container.appendChild(draggedElement);
    }
    
    // Update element hierarchy in canvas manager
    this.updateElementHierarchy(draggedElement);
    
    // Save state for undo/redo
    this.saveState('Element reordered');
    
    // Emit reorder event
    this.eventBus.emit('element:reordered', {
        element: draggedElement,
        newParent: container,
        newIndex: insertionPoint.index
    });
    
    console.log('Reordered element to new position');
};

/**
 * Clean up reorder state
 */
AdvancedManipulation.prototype.cleanupReorderState = function() {
    // Hide placeholder
    if (this.reorderState.placeholder) {
        this.reorderState.placeholder.style.display = 'none';
        if (this.reorderState.placeholder.parentElement) {
            this.reorderState.placeholder.parentElement.removeChild(this.reorderState.placeholder);
        }
    }
    
    // Remove reordering class
    if (this.reorderState.draggedElement) {
        DOMUtils.removeClass(this.reorderState.draggedElement, this.config.reorderClass);
    }
    
    // Clean up drop listeners
    this.cleanupReorderDropListeners();
    
    // Reset state
    this.reorderState = {
        isDragging: false,
        draggedElement: null,
        placeholder: this.reorderState.placeholder,
        originalParent: null,
        originalIndex: null
    };
};

/**
 * Clean up reorder drop listeners
 */
AdvancedManipulation.prototype.cleanupReorderDropListeners = function() {
    var canvas = this.canvasManager.canvas;
    var containers = canvas.querySelectorAll('.vwb-canvas-element');
    
    for (var i = 0; i < containers.length; i++) {
        var container = containers[i];
        if (container._reorderHandlers) {
            DOMUtils.removeEventListener(container, 'dragover', container._reorderHandlers.dragover);
            DOMUtils.removeEventListener(container, 'drop', container._reorderHandlers.drop);
            delete container._reorderHandlers;
        }
    }
    
    // Clean up canvas handlers if they exist
    if (canvas._reorderHandlers) {
        DOMUtils.removeEventListener(canvas, 'dragover', canvas._reorderHandlers.dragover);
        DOMUtils.removeEventListener(canvas, 'drop', canvas._reorderHandlers.drop);
        delete canvas._reorderHandlers;
    }
};

// ============================================================================
// ELEMENT DUPLICATION FUNCTIONALITY
// ============================================================================

/**
 * Duplicate the currently selected element
 */
AdvancedManipulation.prototype.duplicateSelectedElement = function() {
    var selectedElement = this.canvasManager.state.selectedElement;
    if (!selectedElement) {
        console.warn('No element selected for duplication');
        return null;
    }
    
    return this.duplicateElement(selectedElement);
};

/**
 * Duplicate an element
 */
AdvancedManipulation.prototype.duplicateElement = function(element) {
    if (!element) return null;
    
    try {
        // Clone the element
        var clonedElement = element.cloneNode(true);
        
        // Generate new unique ID
        var newId = this.generateUniqueId();
        clonedElement.id = newId;
        clonedElement.setAttribute('data-vwb-id', newId);
        
        // Update IDs of child elements recursively
        this.updateClonedElementIds(clonedElement);
        
        // Insert after the original element
        var parent = element.parentElement;
        var nextSibling = element.nextSibling;
        
        if (nextSibling) {
            parent.insertBefore(clonedElement, nextSibling);
        } else {
            parent.appendChild(clonedElement);
        }
        
        // Process the new element in canvas manager
        var elementType = element.getAttribute('data-vwb-type');
        this.canvasManager.processNewElement(clonedElement, elementType);
        
        // Select the duplicated element
        this.canvasManager.selectElement(clonedElement);
        
        // Save state for undo/redo
        this.saveState('Element duplicated');
        
        // Emit duplication event
        this.eventBus.emit('element:duplicated', {
            original: element,
            duplicate: clonedElement
        });
        
        console.log('Duplicated element:', element.id, '->', newId);
        return clonedElement;
        
    } catch (error) {
        console.error('Error duplicating element:', error);
        return null;
    }
};

/**
 * Update IDs of cloned element and its children
 */
AdvancedManipulation.prototype.updateClonedElementIds = function(element) {
    // Update child elements with canvas element class
    var canvasElements = element.querySelectorAll('.vwb-canvas-element');
    
    for (var i = 0; i < canvasElements.length; i++) {
        var child = canvasElements[i];
        var newId = this.generateUniqueId();
        child.id = newId;
        child.setAttribute('data-vwb-id', newId);
    }
};

// ============================================================================
// UNDO/REDO SYSTEM
// ============================================================================

/**
 * Save current state to history
 */
AdvancedManipulation.prototype.saveState = function(description) {
    try {
        // Get current canvas state
        var state = this.captureCanvasState();
        
        // Remove any states after current index (for branching)
        this.history.stack = this.history.stack.slice(0, this.history.currentIndex + 1);
        
        // Add new state
        this.history.stack.push({
            state: state,
            description: description || 'Canvas change',
            timestamp: Date.now()
        });
        
        // Limit history size
        if (this.history.stack.length > this.history.maxSize) {
            this.history.stack.shift();
        } else {
            this.history.currentIndex++;
        }
        
        // Emit history change event
        this.eventBus.emit('history:changed', {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            description: description
        });
        
    } catch (error) {
        console.error('Error saving state:', error);
    }
};

/**
 * Capture current canvas state
 */
AdvancedManipulation.prototype.captureCanvasState = function() {
    var canvas = this.canvasManager.canvas;
    
    return {
        html: canvas.innerHTML,
        elements: JSON.parse(JSON.stringify(this.canvasManager.state.elements)),
        rootElements: [...this.canvasManager.state.rootElements],
        selectedElementId: this.canvasManager.state.selectedElement ? 
                          this.canvasManager.state.selectedElement.id : null
    };
};

/**
 * Restore canvas state
 */
AdvancedManipulation.prototype.restoreCanvasState = function(state) {
    try {
        var canvas = this.canvasManager.canvas;
        
        // Deselect current element
        this.canvasManager.deselectElement();
        
        // Restore HTML
        canvas.innerHTML = state.html;
        
        // Restore canvas manager state
        this.canvasManager.state.elements = JSON.parse(JSON.stringify(state.elements));
        this.canvasManager.state.rootElements = [...state.rootElements];
        
        // Restore selection if it existed
        if (state.selectedElementId) {
            var selectedElement = document.getElementById(state.selectedElementId);
            if (selectedElement) {
                this.canvasManager.selectElement(selectedElement);
            }
        }
        
        // Re-setup event listeners for restored elements
        this.setupRestoredElementListeners();
        
        // Emit canvas restored event
        this.eventBus.emit('canvas:restored', { state: state });
        
    } catch (error) {
        console.error('Error restoring canvas state:', error);
    }
};

/**
 * Set up event listeners for restored elements
 */
AdvancedManipulation.prototype.setupRestoredElementListeners = function() {
    // This ensures that restored elements have proper event handling
    var canvasElements = this.canvasManager.canvas.querySelectorAll('.vwb-canvas-element');
    
    for (var i = 0; i < canvasElements.length; i++) {
        var element = canvasElements[i];
        
        // Re-enable reordering if element is selected
        if (element === this.canvasManager.state.selectedElement) {
            this.enableReordering(element);
        }
    }
};

/**
 * Undo last operation
 */
AdvancedManipulation.prototype.undo = function() {
    if (!this.canUndo()) {
        console.warn('Nothing to undo');
        return false;
    }
    
    this.history.currentIndex--;
    var historyItem = this.history.stack[this.history.currentIndex];
    
    this.restoreCanvasState(historyItem.state);
    
    // Emit undo event
    this.eventBus.emit('history:undo', {
        description: historyItem.description,
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
    });
    
    console.log('Undo:', historyItem.description);
    return true;
};

/**
 * Redo last undone operation
 */
AdvancedManipulation.prototype.redo = function() {
    if (!this.canRedo()) {
        console.warn('Nothing to redo');
        return false;
    }
    
    this.history.currentIndex++;
    var historyItem = this.history.stack[this.history.currentIndex];
    
    this.restoreCanvasState(historyItem.state);
    
    // Emit redo event
    this.eventBus.emit('history:redo', {
        description: historyItem.description,
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
    });
    
    console.log('Redo:', historyItem.description);
    return true;
};

/**
 * Check if undo is possible
 */
AdvancedManipulation.prototype.canUndo = function() {
    return this.history.currentIndex > 0;
};

/**
 * Check if redo is possible
 */
AdvancedManipulation.prototype.canRedo = function() {
    return this.history.currentIndex < this.history.stack.length - 1;
};

// ============================================================================
// ELEMENT GROUPING FUNCTIONALITY
// ============================================================================

/**
 * Group selected elements
 */
AdvancedManipulation.prototype.groupSelectedElements = function() {
    // For now, we'll group the currently selected element with its siblings
    // In a full implementation, this would work with multiple selection
    var selectedElement = this.canvasManager.state.selectedElement;
    if (!selectedElement) {
        console.warn('No element selected for grouping');
        return null;
    }
    
    // Get sibling elements for grouping
    var parent = selectedElement.parentElement;
    var siblings = Array.from(parent.children).filter(function(child) {
        return DOMUtils.hasClass(child, 'vwb-canvas-element');
    });
    
    if (siblings.length < 2) {
        console.warn('Need at least 2 elements to create a group');
        return null;
    }
    
    return this.createGroup(siblings, 'Group ' + this.nextGroupId);
};

/**
 * Create a group from elements
 */
AdvancedManipulation.prototype.createGroup = function(elements, name) {
    if (!elements || elements.length < 2) {
        console.warn('Need at least 2 elements to create a group');
        return null;
    }
    
    try {
        var groupId = 'group-' + this.nextGroupId++;
        
        // Create group container
        var groupContainer = DOMUtils.createElement('div', {
            id: groupId,
            className: 'vwb-canvas-element ' + this.config.groupClass,
            attributes: {
                'data-vwb-type': 'group',
                'data-vwb-id': groupId,
                'data-group-name': name
            },
            styles: {
                position: 'relative',
                border: '1px dashed #95a5a6',
                borderRadius: '4px',
                padding: '8px',
                margin: '4px 0'
            }
        });
        
        // Add group label
        var groupLabel = DOMUtils.createElement('div', {
            className: 'vwb-group-label',
            textContent: name,
            styles: {
                position: 'absolute',
                top: '-12px',
                left: '8px',
                background: '#ecf0f1',
                padding: '2px 6px',
                fontSize: '10px',
                color: '#7f8c8d',
                borderRadius: '2px',
                zIndex: '1'
            }
        });
        
        groupContainer.appendChild(groupLabel);
        
        // Move elements into group
        var firstElement = elements[0];
        var parent = firstElement.parentElement;
        
        // Insert group container before first element
        parent.insertBefore(groupContainer, firstElement);
        
        // Move all elements into group
        for (var i = 0; i < elements.length; i++) {
            groupContainer.appendChild(elements[i]);
        }
        
        // Store group data
        this.groups.set(groupId, {
            elements: elements.map(function(el) { return el.id; }),
            name: name,
            container: groupContainer
        });
        
        // Process group in canvas manager
        this.canvasManager.processNewElement(groupContainer, 'group');
        
        // Select the group
        this.canvasManager.selectElement(groupContainer);
        
        // Save state for undo/redo
        this.saveState('Elements grouped: ' + name);
        
        // Emit group created event
        this.eventBus.emit('group:created', {
            groupId: groupId,
            elements: elements,
            container: groupContainer
        });
        
        console.log('Created group:', name, 'with', elements.length, 'elements');
        return groupContainer;
        
    } catch (error) {
        console.error('Error creating group:', error);
        return null;
    }
};

/**
 * Ungroup selected elements
 */
AdvancedManipulation.prototype.ungroupSelectedElements = function() {
    var selectedElement = this.canvasManager.state.selectedElement;
    if (!selectedElement || !DOMUtils.hasClass(selectedElement, this.config.groupClass)) {
        console.warn('Selected element is not a group');
        return false;
    }
    
    return this.ungroupElements(selectedElement);
};

/**
 * Ungroup elements
 */
AdvancedManipulation.prototype.ungroupElements = function(groupContainer) {
    if (!groupContainer || !DOMUtils.hasClass(groupContainer, this.config.groupClass)) {
        console.warn('Element is not a group');
        return false;
    }
    
    try {
        var groupId = groupContainer.id;
        var groupData = this.groups.get(groupId);
        
        if (!groupData) {
            console.warn('Group data not found');
            return false;
        }
        
        // Get parent container
        var parent = groupContainer.parentElement;
        
        // Move elements out of group
        var elements = Array.from(groupContainer.children).filter(function(child) {
            return DOMUtils.hasClass(child, 'vwb-canvas-element');
        });
        
        // Insert elements before group container
        for (var i = 0; i < elements.length; i++) {
            parent.insertBefore(elements[i], groupContainer);
        }
        
        // Remove group container
        parent.removeChild(groupContainer);
        
        // Remove group data
        this.groups.delete(groupId);
        
        // Select first ungrouped element
        if (elements.length > 0) {
            this.canvasManager.selectElement(elements[0]);
        }
        
        // Save state for undo/redo
        this.saveState('Group ungrouped: ' + groupData.name);
        
        // Emit group destroyed event
        this.eventBus.emit('group:destroyed', {
            groupId: groupId,
            elements: elements
        });
        
        console.log('Ungrouped elements from:', groupData.name);
        return true;
        
    } catch (error) {
        console.error('Error ungrouping elements:', error);
        return false;
    }
};

// ============================================================================
// ELEMENT ALIGNMENT AND DISTRIBUTION TOOLS
// ============================================================================

/**
 * Align elements
 */
AdvancedManipulation.prototype.alignElements = function(alignment, elements) {
    elements = elements || this.getSelectedElements();
    
    if (!elements || elements.length < 2) {
        console.warn('Need at least 2 elements for alignment');
        return false;
    }
    
    try {
        var bounds = this.calculateElementsBounds(elements);
        
        switch (alignment) {
            case 'left':
                this.alignLeft(elements, bounds);
                break;
            case 'center':
                this.alignCenter(elements, bounds);
                break;
            case 'right':
                this.alignRight(elements, bounds);
                break;
            case 'top':
                this.alignTop(elements, bounds);
                break;
            case 'middle':
                this.alignMiddle(elements, bounds);
                break;
            case 'bottom':
                this.alignBottom(elements, bounds);
                break;
            default:
                console.warn('Unknown alignment:', alignment);
                return false;
        }
        
        // Save state for undo/redo
        this.saveState('Elements aligned: ' + alignment);
        
        // Emit alignment event
        this.eventBus.emit('elements:aligned', {
            alignment: alignment,
            elements: elements
        });
        
        console.log('Aligned', elements.length, 'elements:', alignment);
        return true;
        
    } catch (error) {
        console.error('Error aligning elements:', error);
        return false;
    }
};

/**
 * Align elements to the left
 */
AdvancedManipulation.prototype.alignLeft = function(elements, bounds) {
    var leftPosition = bounds.left;
    
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        var rect = element.getBoundingClientRect();
        var canvasRect = this.canvasManager.canvas.getBoundingClientRect();
        
        var newLeft = leftPosition - canvasRect.left;
        element.style.position = 'absolute';
        element.style.left = newLeft + 'px';
    }
};

/**
 * Align elements to center
 */
AdvancedManipulation.prototype.alignCenter = function(elements, bounds) {
    var centerX = bounds.centerX;
    
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        var rect = element.getBoundingClientRect();
        var canvasRect = this.canvasManager.canvas.getBoundingClientRect();
        
        var newLeft = centerX - rect.width / 2 - canvasRect.left;
        element.style.position = 'absolute';
        element.style.left = newLeft + 'px';
    }
};

/**
 * Align elements to the right
 */
AdvancedManipulation.prototype.alignRight = function(elements, bounds) {
    var rightPosition = bounds.right;
    
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        var rect = element.getBoundingClientRect();
        var canvasRect = this.canvasManager.canvas.getBoundingClientRect();
        
        var newLeft = rightPosition - rect.width - canvasRect.left;
        element.style.position = 'absolute';
        element.style.left = newLeft + 'px';
    }
};

/**
 * Align elements to the top
 */
AdvancedManipulation.prototype.alignTop = function(elements, bounds) {
    var topPosition = bounds.top;
    
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        var canvasRect = this.canvasManager.canvas.getBoundingClientRect();
        
        var newTop = topPosition - canvasRect.top;
        element.style.position = 'absolute';
        element.style.top = newTop + 'px';
    }
};

/**
 * Align elements to middle
 */
AdvancedManipulation.prototype.alignMiddle = function(elements, bounds) {
    var centerY = bounds.centerY;
    
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        var rect = element.getBoundingClientRect();
        var canvasRect = this.canvasManager.canvas.getBoundingClientRect();
        
        var newTop = centerY - rect.height / 2 - canvasRect.top;
        element.style.position = 'absolute';
        element.style.top = newTop + 'px';
    }
};

/**
 * Align elements to the bottom
 */
AdvancedManipulation.prototype.alignBottom = function(elements, bounds) {
    var bottomPosition = bounds.bottom;
    
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        var rect = element.getBoundingClientRect();
        var canvasRect = this.canvasManager.canvas.getBoundingClientRect();
        
        var newTop = bottomPosition - rect.height - canvasRect.top;
        element.style.position = 'absolute';
        element.style.top = newTop + 'px';
    }
};

/**
 * Distribute elements
 */
AdvancedManipulation.prototype.distributeElements = function(distribution, elements) {
    elements = elements || this.getSelectedElements();
    
    if (!elements || elements.length < 3) {
        console.warn('Need at least 3 elements for distribution');
        return false;
    }
    
    try {
        switch (distribution) {
            case 'horizontal':
                this.distributeHorizontally(elements);
                break;
            case 'vertical':
                this.distributeVertically(elements);
                break;
            default:
                console.warn('Unknown distribution:', distribution);
                return false;
        }
        
        // Save state for undo/redo
        this.saveState('Elements distributed: ' + distribution);
        
        // Emit distribution event
        this.eventBus.emit('elements:distributed', {
            distribution: distribution,
            elements: elements
        });
        
        console.log('Distributed', elements.length, 'elements:', distribution);
        return true;
        
    } catch (error) {
        console.error('Error distributing elements:', error);
        return false;
    }
};

/**
 * Distribute elements horizontally
 */
AdvancedManipulation.prototype.distributeHorizontally = function(elements) {
    // Sort elements by their left position
    var sortedElements = elements.slice().sort(function(a, b) {
        return a.getBoundingClientRect().left - b.getBoundingClientRect().left;
    });
    
    var bounds = this.calculateElementsBounds(sortedElements);
    var totalWidth = bounds.width;
    var elementWidths = sortedElements.map(function(el) {
        return el.getBoundingClientRect().width;
    });
    
    var totalElementWidth = elementWidths.reduce(function(sum, width) {
        return sum + width;
    }, 0);
    
    var spacing = (totalWidth - totalElementWidth) / (sortedElements.length - 1);
    var currentX = bounds.left;
    var canvasRect = this.canvasManager.canvas.getBoundingClientRect();
    
    for (var i = 0; i < sortedElements.length; i++) {
        var element = sortedElements[i];
        var newLeft = currentX - canvasRect.left;
        
        element.style.position = 'absolute';
        element.style.left = newLeft + 'px';
        
        currentX += elementWidths[i] + spacing;
    }
};

/**
 * Distribute elements vertically
 */
AdvancedManipulation.prototype.distributeVertically = function(elements) {
    // Sort elements by their top position
    var sortedElements = elements.slice().sort(function(a, b) {
        return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
    });
    
    var bounds = this.calculateElementsBounds(sortedElements);
    var totalHeight = bounds.height;
    var elementHeights = sortedElements.map(function(el) {
        return el.getBoundingClientRect().height;
    });
    
    var totalElementHeight = elementHeights.reduce(function(sum, height) {
        return sum + height;
    }, 0);
    
    var spacing = (totalHeight - totalElementHeight) / (sortedElements.length - 1);
    var currentY = bounds.top;
    var canvasRect = this.canvasManager.canvas.getBoundingClientRect();
    
    for (var i = 0; i < sortedElements.length; i++) {
        var element = sortedElements[i];
        var newTop = currentY - canvasRect.top;
        
        element.style.position = 'absolute';
        element.style.top = newTop + 'px';
        
        currentY += elementHeights[i] + spacing;
    }
};

// ============================================================================
// UTILITY METHODS
// ============================================================================

/**
 * Get currently selected elements (for future multi-selection support)
 */
AdvancedManipulation.prototype.getSelectedElements = function() {
    var selectedElement = this.canvasManager.state.selectedElement;
    return selectedElement ? [selectedElement] : [];
};

/**
 * Calculate bounds of multiple elements
 */
AdvancedManipulation.prototype.calculateElementsBounds = function(elements) {
    var bounds = {
        left: Infinity,
        top: Infinity,
        right: -Infinity,
        bottom: -Infinity
    };
    
    for (var i = 0; i < elements.length; i++) {
        var rect = elements[i].getBoundingClientRect();
        bounds.left = Math.min(bounds.left, rect.left);
        bounds.top = Math.min(bounds.top, rect.top);
        bounds.right = Math.max(bounds.right, rect.right);
        bounds.bottom = Math.max(bounds.bottom, rect.bottom);
    }
    
    bounds.width = bounds.right - bounds.left;
    bounds.height = bounds.bottom - bounds.top;
    bounds.centerX = bounds.left + bounds.width / 2;
    bounds.centerY = bounds.top + bounds.height / 2;
    
    return bounds;
};

/**
 * Check if element is a container
 */
AdvancedManipulation.prototype.isContainer = function(element) {
    if (!element || !element.tagName) return false;
    
    var containerTags = ['DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'ASIDE', 'NAV'];
    return containerTags.indexOf(element.tagName.toUpperCase()) !== -1;
};

/**
 * Get element index within its parent
 */
AdvancedManipulation.prototype.getElementIndex = function(element) {
    var siblings = Array.from(element.parentElement.children);
    return siblings.indexOf(element);
};

/**
 * Update element hierarchy after reordering
 */
AdvancedManipulation.prototype.updateElementHierarchy = function(element) {
    // This would update the canvas manager's element hierarchy
    // For now, we'll emit an event for the canvas manager to handle
    this.eventBus.emit('element:hierarchy-changed', {
        element: element
    });
};

/**
 * Generate unique ID
 */
AdvancedManipulation.prototype.generateUniqueId = function() {
    var id;
    do {
        id = 'vwb-element-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    } while (document.getElementById(id));
    
    return id;
};

/**
 * Handle global mouse down events
 */
AdvancedManipulation.prototype.handleGlobalMouseDown = function(data) {
    // Handle mouse down for potential drag operations
};

/**
 * Handle global mouse up events
 */
AdvancedManipulation.prototype.handleGlobalMouseUp = function(data) {
    // Clean up any drag operations
    if (this.reorderState.isDragging) {
        this.cleanupReorderState();
    }
};

/**
 * Get manipulation state for debugging
 */
AdvancedManipulation.prototype.getState = function() {
    return {
        initialized: this.initialized,
        historySize: this.history.stack.length,
        currentHistoryIndex: this.history.currentIndex,
        canUndo: this.canUndo(),
        canRedo: this.canRedo(),
        groupCount: this.groups.size,
        isReordering: this.reorderState.isDragging
    };
};

/**
 * Clean up resources
 */
AdvancedManipulation.prototype.destroy = function() {
    if (!this.initialized) return;
    
    // Clean up reorder state
    this.cleanupReorderState();
    
    // Remove alignment guides
    if (this.alignmentGuides) {
        DOMUtils.removeElement(this.alignmentGuides.horizontal);
        DOMUtils.removeElement(this.alignmentGuides.vertical);
    }
    
    // Clear groups
    this.groups.clear();
    
    // Clear history
    this.history.stack = [];
    this.history.currentIndex = -1;
    
    // Reset state
    this.initialized = false;
    
    console.log('AdvancedManipulation destroyed');
};