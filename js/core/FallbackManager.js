/**
 * FallbackManager - Browser Compatibility Fallbacks
 * 
 * This class provides fallback functionality for browsers that don't support
 * certain features like drag and drop, localStorage, etc.
 */

function FallbackManager(eventBus, errorHandler) {
    this.eventBus = eventBus;
    this.errorHandler = errorHandler;
    this.initialized = false;
    
    // Fallback state
    this.state = {
        dragDropFallbackEnabled: false,
        storageFallbackEnabled: false,
        colorInputFallbackEnabled: false
    };
    
    // DOM elements for fallbacks
    this.elements = {
        elementLibraryFallback: null,
        colorPickerFallback: null
    };
}

/**
 * Initialize the fallback manager
 */
FallbackManager.prototype.init = function() {
    if (this.initialized) {
        console.warn('FallbackManager already initialized');
        return;
    }

    try {
        console.log('Initializing FallbackManager...');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Check browser capabilities and enable fallbacks
        this.checkAndEnableFallbacks();
        
        this.initialized = true;
        console.log('FallbackManager initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize FallbackManager:', error);
        throw error;
    }
};

/**
 * Set up event listeners
 */
FallbackManager.prototype.setupEventListeners = function() {
    var self = this;
    
    // Listen for fallback activation events
    this.eventBus.on('fallback:drag-drop-disabled', function() {
        self.enableDragDropFallback();
    });
    
    this.eventBus.on('fallback:storage-disabled', function() {
        self.enableStorageFallback();
    });
    
    this.eventBus.on('fallback:color-input-disabled', function() {
        self.enableColorInputFallback();
    });
};

/**
 * Check browser capabilities and enable fallbacks
 */
FallbackManager.prototype.checkAndEnableFallbacks = function() {
    var capabilities = this.errorHandler.getBrowserCapabilities();
    
    if (!capabilities.dragAndDrop) {
        console.log('Drag and drop not supported, enabling fallback');
        this.enableDragDropFallback();
    }
    
    if (!capabilities.localStorage) {
        console.log('localStorage not supported, enabling fallback');
        this.enableStorageFallback();
    }
    
    if (!capabilities.colorInput) {
        console.log('Color input not supported, enabling fallback');
        this.enableColorInputFallback();
    }
};

/**
 * Enable drag and drop fallback
 */
FallbackManager.prototype.enableDragDropFallback = function() {
    if (this.state.dragDropFallbackEnabled) return;
    
    console.log('Enabling drag and drop fallback');
    this.state.dragDropFallbackEnabled = true;
    
    // Add double-click handlers to element library items
    this.setupElementLibraryFallback();
    
    // Show fallback instructions
    this.showDragDropFallbackInstructions();
};

/**
 * Set up element library fallback (double-click to add)
 */
FallbackManager.prototype.setupElementLibraryFallback = function() {
    var self = this;
    
    // Find element library items
    var elementLibrary = document.querySelector('.element-library');
    if (!elementLibrary) return;
    
    // Add event delegation for double-click
    DOMUtils.addEventListener(elementLibrary, 'dblclick', function(event) {
        var elementItem = event.target.closest('.element-item');
        if (!elementItem) return;
        
        var elementType = elementItem.dataset.elementType;
        if (!elementType) return;
        
        // Add element to canvas center
        self.addElementToCanvasCenter(elementType);
    });
    
    // Add visual indicators
    var elementItems = elementLibrary.querySelectorAll('.element-item');
    for (var i = 0; i < elementItems.length; i++) {
        var item = elementItems[i];
        
        // Add fallback indicator
        var indicator = DOMUtils.createElement('div', {
            className: 'fallback-indicator',
            textContent: 'Double-click to add',
            styles: {
                position: 'absolute',
                bottom: '2px',
                left: '2px',
                right: '2px',
                fontSize: '10px',
                color: '#666',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '2px',
                padding: '1px'
            }
        });
        
        // Make item relative positioned
        item.style.position = 'relative';
        item.appendChild(indicator);
    }
};

/**
 * Add element to canvas center (fallback method)
 */
FallbackManager.prototype.addElementToCanvasCenter = function(elementType) {
    try {
        // Get canvas
        var canvas = document.querySelector('#main-canvas');
        if (!canvas) return;
        
        // Calculate center position
        var canvasRect = canvas.getBoundingClientRect();
        var centerX = canvasRect.width / 2;
        var centerY = canvasRect.height / 2;
        
        // Create mock drop position
        var dropPosition = {
            x: centerX,
            y: centerY,
            container: canvas,
            insertionIndex: canvas.children.length,
            target: canvas
        };
        
        // Emit element creation event
        this.eventBus.emit('fallback:create-element', {
            elementType: elementType,
            position: dropPosition
        });
        
        console.log('Added element via fallback:', elementType);
        
    } catch (error) {
        console.error('Error adding element via fallback:', error);
        this.eventBus.emit('error:drag-drop', {
            error: error,
            operation: 'add element (fallback)',
            context: 'fallback-creation'
        });
    }
};

/**
 * Show drag and drop fallback instructions
 */
FallbackManager.prototype.showDragDropFallbackInstructions = function() {
    var instructions = DOMUtils.createElement('div', {
        className: 'fallback-instructions drag-drop-fallback',
        styles: {
            position: 'fixed',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#f39c12',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '14px',
            zIndex: '9998',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
        },
        textContent: 'Drag and drop not supported. Double-click elements to add them to the canvas.'
    });
    
    document.body.appendChild(instructions);
    
    // Auto-hide after 10 seconds
    setTimeout(function() {
        DOMUtils.removeElement(instructions);
    }, 10000);
};

/**
 * Enable storage fallback
 */
FallbackManager.prototype.enableStorageFallback = function() {
    if (this.state.storageFallbackEnabled) return;
    
    console.log('Enabling storage fallback');
    this.state.storageFallbackEnabled = true;
    
    // Disable save/load buttons and show export-only workflow
    this.setupStorageFallback();
    
    // Show fallback instructions
    this.showStorageFallbackInstructions();
};

/**
 * Set up storage fallback
 */
FallbackManager.prototype.setupStorageFallback = function() {
    // Disable save and load buttons
    var saveBtn = document.querySelector('#save-btn');
    var loadBtn = document.querySelector('#load-btn');
    
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.title = 'Save not available - use Export instead';
        DOMUtils.addClass(saveBtn, 'disabled');
    }
    
    if (loadBtn) {
        loadBtn.disabled = true;
        loadBtn.title = 'Load not available - import files instead';
        DOMUtils.addClass(loadBtn, 'disabled');
    }
    
    // Emphasize export button
    var exportBtn = document.querySelector('#export-btn');
    if (exportBtn) {
        DOMUtils.addClass(exportBtn, 'emphasized');
        exportBtn.title = 'Export your work as files (recommended)';
    }
};

/**
 * Show storage fallback instructions
 */
FallbackManager.prototype.showStorageFallbackInstructions = function() {
    var instructions = DOMUtils.createElement('div', {
        className: 'fallback-instructions storage-fallback',
        styles: {
            position: 'fixed',
            top: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#e74c3c',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '14px',
            zIndex: '9998',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            maxWidth: '400px',
            textAlign: 'center'
        },
        textContent: 'Local storage not available. Use the Export button to save your work as files.'
    });
    
    document.body.appendChild(instructions);
    
    // Auto-hide after 15 seconds
    setTimeout(function() {
        DOMUtils.removeElement(instructions);
    }, 15000);
};

/**
 * Enable color input fallback
 */
FallbackManager.prototype.enableColorInputFallback = function() {
    if (this.state.colorInputFallbackEnabled) return;
    
    console.log('Enabling color input fallback');
    this.state.colorInputFallbackEnabled = true;
    
    // Replace color inputs with text inputs and color swatches
    this.setupColorInputFallback();
};

/**
 * Set up color input fallback
 */
FallbackManager.prototype.setupColorInputFallback = function() {
    var self = this;
    
    // Find all color inputs and replace them
    var colorInputs = document.querySelectorAll('input[type="color"]');
    
    for (var i = 0; i < colorInputs.length; i++) {
        var colorInput = colorInputs[i];
        this.replaceColorInput(colorInput);
    }
    
    // Listen for new color inputs being added
    this.eventBus.on('property:color-input-created', function(data) {
        if (data.input && data.input.type === 'color') {
            self.replaceColorInput(data.input);
        }
    });
};

/**
 * Replace color input with fallback
 */
FallbackManager.prototype.replaceColorInput = function(colorInput) {
    var container = colorInput.parentElement;
    if (!container) return;
    
    // Create fallback container
    var fallbackContainer = DOMUtils.createElement('div', {
        className: 'color-input-fallback',
        styles: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        }
    });
    
    // Create text input
    var textInput = DOMUtils.createElement('input', {
        attributes: {
            type: 'text',
            value: colorInput.value || '#000000',
            placeholder: '#000000'
        },
        className: 'color-text-fallback',
        styles: {
            flex: '1',
            padding: '4px 8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '12px'
        }
    });
    
    // Create color swatches
    var swatchContainer = this.createColorSwatches(textInput);
    
    // Copy event listeners from original input
    var originalOnChange = colorInput.onchange;
    var originalOnInput = colorInput.oninput;
    
    if (originalOnChange) {
        textInput.onchange = function() {
            colorInput.value = textInput.value;
            originalOnChange.call(colorInput);
        };
    }
    
    if (originalOnInput) {
        textInput.oninput = function() {
            colorInput.value = textInput.value;
            originalOnInput.call(colorInput);
        };
    }
    
    // Assemble fallback
    fallbackContainer.appendChild(textInput);
    fallbackContainer.appendChild(swatchContainer);
    
    // Replace original input
    container.replaceChild(fallbackContainer, colorInput);
    
    // Keep reference to original input (hidden)
    colorInput.style.display = 'none';
    fallbackContainer.appendChild(colorInput);
};

/**
 * Create color swatches for fallback
 */
FallbackManager.prototype.createColorSwatches = function(textInput) {
    var swatchContainer = DOMUtils.createElement('div', {
        className: 'color-swatches',
        styles: {
            display: 'flex',
            gap: '2px'
        }
    });
    
    var commonColors = [
        '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
        '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'
    ];
    
    for (var i = 0; i < commonColors.length; i++) {
        var color = commonColors[i];
        var swatch = DOMUtils.createElement('div', {
            className: 'color-swatch',
            styles: {
                width: '16px',
                height: '16px',
                backgroundColor: color,
                border: '1px solid #ccc',
                borderRadius: '2px',
                cursor: 'pointer'
            },
            attributes: {
                'data-color': color,
                'title': color
            }
        });
        
        // Add click handler
        DOMUtils.addEventListener(swatch, 'click', function(event) {
            var selectedColor = event.target.dataset.color;
            textInput.value = selectedColor;
            
            // Trigger change event
            var changeEvent = new Event('change', { bubbles: true });
            textInput.dispatchEvent(changeEvent);
        });
        
        swatchContainer.appendChild(swatch);
    }
    
    return swatchContainer;
};

/**
 * Check if fallback is enabled for feature
 */
FallbackManager.prototype.isFallbackEnabled = function(feature) {
    switch (feature) {
        case 'dragDrop':
            return this.state.dragDropFallbackEnabled;
        case 'storage':
            return this.state.storageFallbackEnabled;
        case 'colorInput':
            return this.state.colorInputFallbackEnabled;
        default:
            return false;
    }
};

/**
 * Get fallback status
 */
FallbackManager.prototype.getFallbackStatus = function() {
    return {
        dragDrop: this.state.dragDropFallbackEnabled,
        storage: this.state.storageFallbackEnabled,
        colorInput: this.state.colorInputFallbackEnabled
    };
};

/**
 * Clean up resources
 */
FallbackManager.prototype.destroy = function() {
    if (!this.initialized) return;
    
    // Remove fallback instructions
    var instructions = document.querySelectorAll('.fallback-instructions');
    for (var i = 0; i < instructions.length; i++) {
        DOMUtils.removeElement(instructions[i]);
    }
    
    // Reset state
    this.state = {
        dragDropFallbackEnabled: false,
        storageFallbackEnabled: false,
        colorInputFallbackEnabled: false
    };
    
    this.initialized = false;
    console.log('FallbackManager destroyed');
};