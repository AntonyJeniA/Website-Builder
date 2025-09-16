/**
 * ElementLibrary - Manages draggable HTML element components
 * 
 * This class manages the collection of available HTML elements that users can
 * drag from the left panel to the canvas. It handles element templates,
 * categorization, and the visual representation in the element palette.
 */

function ElementLibrary(container, eventBus) {
    this.container = container;
    this.eventBus = eventBus;
    this.initialized = false;
    
    // Element categories and their containers
    this.categories = {
        layout: null,
        text: null,
        form: null,
        media: null
    };
    
    // Element templates definition
    this.elementTemplates = this.defineElementTemplates();
}

/**
 * Initialize the element library
 */
ElementLibrary.prototype.init = function() {
    if (this.initialized) {
        console.warn('ElementLibrary already initialized');
        return;
    }

    try {
        console.log('Initializing ElementLibrary...');
        
        // Get category container references
        this.getCategoryReferences();
        
        // Populate element palette
        this.populateElementPalette();
        
        // Set up event listeners
        this.setupEventListeners();
        
        this.initialized = true;
        console.log('ElementLibrary initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize ElementLibrary:', error);
        throw error;
    }
};

/**
 * Get references to category container elements
 */
ElementLibrary.prototype.getCategoryReferences = function() {
    this.categories.layout = this.container.querySelector('#layout-elements');
    this.categories.text = this.container.querySelector('#text-elements');
    this.categories.form = this.container.querySelector('#form-elements');
    this.categories.media = this.container.querySelector('#media-elements');

    // Validate category references
    for (var category in this.categories) {
        if (!this.categories[category]) {
            throw new Error('Could not find category container: ' + category);
        }
    }
};

/**
 * Define element templates with their properties and metadata
 */
ElementLibrary.prototype.defineElementTemplates = function() {
    return {
        // Layout Elements
        div: {
            category: 'layout',
            tagName: 'div',
            displayName: 'Container',
            description: 'A generic container for grouping other elements',
            icon: '📦',
            defaultContent: '',
            defaultStyles: {
                padding: '20px',
                border: '1px dashed #ccc',
                minHeight: '50px'
            },
            attributes: {
                class: 'container-element'
            }
        },
        
        section: {
            category: 'layout',
            tagName: 'section',
            displayName: 'Section',
            description: 'A thematic grouping of content',
            icon: '📄',
            defaultContent: '',
            defaultStyles: {
                padding: '20px',
                margin: '10px 0'
            },
            attributes: {
                class: 'section-element'
            }
        },
        
        header: {
            category: 'layout',
            tagName: 'header',
            displayName: 'Header',
            description: 'Header section for page or section',
            icon: '🔝',
            defaultContent: '',
            defaultStyles: {
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #dee2e6'
            },
            attributes: {
                class: 'header-element'
            }
        },
        
        footer: {
            category: 'layout',
            tagName: 'footer',
            displayName: 'Footer',
            description: 'Footer section for page or section',
            icon: '🔻',
            defaultContent: '',
            defaultStyles: {
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #dee2e6'
            },
            attributes: {
                class: 'footer-element'
            }
        },
        
        // Text Elements
        h1: {
            category: 'text',
            tagName: 'h1',
            displayName: 'Heading 1',
            description: 'Main page heading',
            icon: 'H1',
            defaultContent: 'Heading 1',
            defaultStyles: {
                fontSize: '2rem',
                fontWeight: 'bold',
                margin: '0.5rem 0'
            },
            attributes: {
                class: 'heading-element'
            }
        },
        
        h2: {
            category: 'text',
            tagName: 'h2',
            displayName: 'Heading 2',
            description: 'Section heading',
            icon: 'H2',
            defaultContent: 'Heading 2',
            defaultStyles: {
                fontSize: '1.5rem',
                fontWeight: 'bold',
                margin: '0.5rem 0'
            },
            attributes: {
                class: 'heading-element'
            }
        },
        
        h3: {
            category: 'text',
            tagName: 'h3',
            displayName: 'Heading 3',
            description: 'Subsection heading',
            icon: 'H3',
            defaultContent: 'Heading 3',
            defaultStyles: {
                fontSize: '1.25rem',
                fontWeight: 'bold',
                margin: '0.5rem 0'
            },
            attributes: {
                class: 'heading-element'
            }
        },
        
        p: {
            category: 'text',
            tagName: 'p',
            displayName: 'Paragraph',
            description: 'Text paragraph',
            icon: '¶',
            defaultContent: 'This is a paragraph of text. You can edit this content.',
            defaultStyles: {
                margin: '1rem 0',
                lineHeight: '1.5'
            },
            attributes: {
                class: 'paragraph-element'
            }
        },
        
        span: {
            category: 'text',
            tagName: 'span',
            displayName: 'Span',
            description: 'Inline text element',
            icon: 'S',
            defaultContent: 'Inline text',
            defaultStyles: {},
            attributes: {
                class: 'span-element'
            }
        },
        
        a: {
            category: 'text',
            tagName: 'a',
            displayName: 'Link',
            description: 'Hyperlink element',
            icon: '🔗',
            defaultContent: 'Link text',
            defaultStyles: {
                color: '#007bff',
                textDecoration: 'underline'
            },
            attributes: {
                href: '#',
                class: 'link-element'
            }
        },
        
        // Form Elements
        button: {
            category: 'form',
            tagName: 'button',
            displayName: 'Button',
            description: 'Clickable button',
            icon: '🔘',
            defaultContent: 'Click me',
            defaultStyles: {
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
            },
            attributes: {
                type: 'button',
                class: 'button-element'
            },
            formElement: true
        },
        
        input: {
            category: 'form',
            tagName: 'input',
            displayName: 'Text Input',
            description: 'Text input field',
            icon: '📝',
            defaultContent: '',
            defaultStyles: {
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
            },
            attributes: {
                type: 'text',
                placeholder: 'Enter text...',
                class: 'input-element'
            },
            formElement: true
        },
        
        textarea: {
            category: 'form',
            tagName: 'textarea',
            displayName: 'Text Area',
            description: 'Multi-line text input',
            icon: '📄',
            defaultContent: '',
            defaultStyles: {
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical',
                minHeight: '80px'
            },
            attributes: {
                placeholder: 'Enter text...',
                rows: '3',
                class: 'textarea-element'
            },
            formElement: true
        },
        
        select: {
            category: 'form',
            tagName: 'select',
            displayName: 'Select',
            description: 'Dropdown selection',
            icon: '📋',
            defaultContent: '<option value="">Choose...</option><option value="1">Option 1</option><option value="2">Option 2</option>',
            defaultStyles: {
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
            },
            attributes: {
                class: 'select-element'
            },
            formElement: true
        },
        
        checkbox: {
            category: 'form',
            tagName: 'input',
            displayName: 'Checkbox',
            description: 'Checkbox input for multiple selections',
            icon: '☑️',
            defaultContent: '',
            defaultStyles: {
                margin: '4px',
                cursor: 'pointer'
            },
            attributes: {
                type: 'checkbox',
                class: 'checkbox-element',
                value: 'checkbox-value'
            },
            formElement: true,
            requiresLabel: true
        },
        
        radio: {
            category: 'form',
            tagName: 'input',
            displayName: 'Radio Button',
            description: 'Radio button for single selection',
            icon: '🔘',
            defaultContent: '',
            defaultStyles: {
                margin: '4px',
                cursor: 'pointer'
            },
            attributes: {
                type: 'radio',
                class: 'radio-element',
                name: 'radio-group',
                value: 'radio-value'
            },
            formElement: true,
            requiresLabel: true
        },
        
        label: {
            category: 'form',
            tagName: 'label',
            displayName: 'Label',
            description: 'Label for form elements',
            icon: '🏷️',
            defaultContent: 'Label text',
            defaultStyles: {
                display: 'inline-block',
                marginBottom: '4px',
                fontWeight: '500',
                cursor: 'pointer'
            },
            attributes: {
                class: 'label-element'
            },
            formElement: true
        },
        
        // Media Elements
        img: {
            category: 'media',
            tagName: 'img',
            displayName: 'Image',
            description: 'Image element',
            icon: '🖼️',
            defaultContent: '',
            defaultStyles: {
                maxWidth: '100%',
                height: 'auto',
                border: '1px solid #ddd'
            },
            attributes: {
                src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIFBsYWNlaG9sZGVyPC90ZXh0Pjwvc3ZnPg==',
                alt: 'Image placeholder',
                class: 'image-element'
            }
        }
    };
};

/**
 * Populate the element palette with draggable elements
 */
ElementLibrary.prototype.populateElementPalette = function() {
    // Clear existing elements
    for (var category in this.categories) {
        DOMUtils.empty(this.categories[category]);
    }
    
    // Create elements for each template
    for (var elementType in this.elementTemplates) {
        var template = this.elementTemplates[elementType];
        var categoryContainer = this.categories[template.category];
        
        if (categoryContainer) {
            var elementItem = this.createElementItem(elementType, template);
            categoryContainer.appendChild(elementItem);
            console.log('Added element to palette:', elementType, 'in category:', template.category);
        }
    }
};

/**
 * Create a draggable element item for the palette
 */
ElementLibrary.prototype.createElementItem = function(elementType, template) {
    var elementItem = DOMUtils.createElement('div', {
        className: 'element-item',
        attributes: {
            'data-element-type': elementType,
            'draggable': 'true',
            'title': template.description
        }
    });
    
    // Create element icon
    var icon = DOMUtils.createElement('div', {
        className: 'element-icon',
        textContent: template.icon,
        parent: elementItem
    });
    
    // Create element info
    var info = DOMUtils.createElement('div', {
        className: 'element-info',
        parent: elementItem
    });
    
    var name = DOMUtils.createElement('div', {
        className: 'element-name',
        textContent: template.displayName,
        parent: info
    });
    
    var description = DOMUtils.createElement('div', {
        className: 'element-description',
        textContent: template.description,
        parent: info
    });
    
    // Add drag handle
    var dragHandle = DOMUtils.createElement('div', {
        className: 'drag-handle',
        innerHTML: '⋮⋮',
        attributes: {
            'title': 'Drag to canvas'
        },
        parent: elementItem
    });
    
    return elementItem;
};

/**
 * Set up event listeners for drag and drop functionality
 */
ElementLibrary.prototype.setupEventListeners = function() {
    var self = this;
    
    // Set up drag event listeners for all element items
    for (var category in this.categories) {
        var categoryContainer = this.categories[category];
        
        // Use event delegation for drag events
        DOMUtils.addEventListener(categoryContainer, 'dragstart', function(event) {
            self.handleDragStart(event);
        }, '.element-item');
        
        DOMUtils.addEventListener(categoryContainer, 'dragend', function(event) {
            self.handleDragEnd(event);
        }, '.element-item');
        
        // Add hover effects
        DOMUtils.addEventListener(categoryContainer, 'mouseenter', function(event) {
            self.handleElementHover(event, true);
        }, '.element-item');
        
        DOMUtils.addEventListener(categoryContainer, 'mouseleave', function(event) {
            self.handleElementHover(event, false);
        }, '.element-item');
    }
    
    // Listen for element creation requests
    this.eventBus.on('element:create', function(data) {
        self.handleElementCreation(data);
    });
};

/**
 * Handle drag start event
 */
ElementLibrary.prototype.handleDragStart = function(event) {
    var elementItem = event.target.closest('.element-item');
    if (!elementItem) return;
    
    var elementType = elementItem.getAttribute('data-element-type');
    var template = this.elementTemplates[elementType];
    
    if (!template) return;
    
    // Set drag data
    var dragData = {
        elementType: elementType,
        template: template,
        source: 'element-library'
    };
    
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = 'copy';
    
    // Add visual feedback
    DOMUtils.addClass(elementItem, 'dragging');
    
    // Emit drag start event
    this.eventBus.emit('element:drag-start', {
        elementType: elementType,
        template: template,
        event: event
    });
    
    console.log('Started dragging element:', elementType);
};

/**
 * Handle drag end event
 */
ElementLibrary.prototype.handleDragEnd = function(event) {
    var elementItem = event.target.closest('.element-item');
    if (!elementItem) return;
    
    // Remove visual feedback
    DOMUtils.removeClass(elementItem, 'dragging');
    
    // Emit drag end event
    this.eventBus.emit('element:drag-end', {
        event: event
    });
    
    console.log('Ended dragging element');
};

/**
 * Handle element hover for preview
 */
ElementLibrary.prototype.handleElementHover = function(event, isEntering) {
    var elementItem = event.target.closest('.element-item');
    if (!elementItem) return;
    
    if (isEntering) {
        DOMUtils.addClass(elementItem, 'hovered');
        
        var elementType = elementItem.getAttribute('data-element-type');
        var template = this.elementTemplates[elementType];
        
        // Emit hover event for potential preview functionality
        this.eventBus.emit('element:hover', {
            elementType: elementType,
            template: template,
            isEntering: true
        });
    } else {
        DOMUtils.removeClass(elementItem, 'hovered');
        
        this.eventBus.emit('element:hover', {
            isEntering: false
        });
    }
};

/**
 * Handle element creation requests
 */
ElementLibrary.prototype.handleElementCreation = function(data) {
    var elementType = data.elementType;
    var template = this.elementTemplates[elementType];
    
    if (!template) {
        console.error('Unknown element type:', elementType);
        return null;
    }
    
    return this.createElement(elementType, data.options);
};

/**
 * Create an element instance from a template
 */
ElementLibrary.prototype.createElement = function(elementType, options) {
    options = options || {};
    var template = this.elementTemplates[elementType];
    
    if (!template) {
        throw new Error('Unknown element type: ' + elementType);
    }
    
    // Merge template attributes with provided options
    var attributes = Object.assign({}, template.attributes, options.attributes);
    var styles = Object.assign({}, template.defaultStyles, options.styles);
    
    // Generate unique ID
    var uniqueId = DOMUtils.generateUniqueId('vwb-' + elementType);
    attributes.id = uniqueId;
    
    // Handle form elements that require labels
    if (template.requiresLabel && (elementType === 'checkbox' || elementType === 'radio')) {
        return this.createFormElementWithLabel(elementType, template, attributes, styles, options);
    }
    
    // Create the element
    var element = DOMUtils.createElement(template.tagName, {
        attributes: attributes,
        styles: styles,
        innerHTML: options.content || template.defaultContent,
        className: (template.attributes.class || '') + ' vwb-canvas-element'
    });
    
    // Add element metadata
    element.setAttribute('data-vwb-type', elementType);
    element.setAttribute('data-vwb-created', Date.now());
    
    // Add form-specific attributes for accessibility
    if (template.formElement) {
        this.enhanceFormElementAccessibility(element, elementType, template);
    }
    
    return element;
};

/**
 * Create form element with associated label for better accessibility
 */
ElementLibrary.prototype.createFormElementWithLabel = function(elementType, template, attributes, styles, options) {
    // Create container for input and label
    var container = DOMUtils.createElement('div', {
        className: 'form-field-container vwb-canvas-element',
        attributes: {
            'data-vwb-type': elementType + '-field',
            'data-vwb-created': Date.now()
        },
        styles: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '8px 0'
        }
    });
    
    // Create the input element
    var input = DOMUtils.createElement(template.tagName, {
        attributes: attributes,
        styles: styles,
        className: template.attributes.class
    });
    
    // Create associated label
    var labelText = options.labelText || (elementType === 'checkbox' ? 'Checkbox option' : 'Radio option');
    var label = DOMUtils.createElement('label', {
        attributes: {
            'for': attributes.id,
            class: 'form-field-label'
        },
        textContent: labelText,
        styles: {
            cursor: 'pointer',
            userSelect: 'none'
        }
    });
    
    // Add elements to container
    container.appendChild(input);
    container.appendChild(label);
    
    // Store references for property editing
    container.setAttribute('data-input-id', attributes.id);
    container.setAttribute('data-label-for', attributes.id);
    
    return container;
};

/**
 * Enhance form element with accessibility attributes
 */
ElementLibrary.prototype.enhanceFormElementAccessibility = function(element, elementType, template) {
    // Add ARIA attributes based on element type
    switch (elementType) {
        case 'input':
            if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
                element.setAttribute('aria-label', element.getAttribute('placeholder') || 'Text input');
            }
            break;
            
        case 'textarea':
            if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
                element.setAttribute('aria-label', element.getAttribute('placeholder') || 'Text area');
            }
            break;
            
        case 'select':
            if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
                element.setAttribute('aria-label', 'Select option');
            }
            break;
            
        case 'button':
            if (!element.getAttribute('aria-label') && !element.textContent.trim()) {
                element.setAttribute('aria-label', 'Button');
            }
            break;
    }
    
    // Add role if not implicit
    if (elementType === 'button' && !element.getAttribute('role')) {
        element.setAttribute('role', 'button');
    }
};

/**
 * Get element template by type
 */
ElementLibrary.prototype.getTemplate = function(elementType) {
    return this.elementTemplates[elementType] || null;
};

/**
 * Get all available element types
 */
ElementLibrary.prototype.getAvailableElements = function() {
    return Object.keys(this.elementTemplates);
};

/**
 * Get elements by category
 */
ElementLibrary.prototype.getElementsByCategory = function(category) {
    var elements = [];
    
    for (var elementType in this.elementTemplates) {
        var template = this.elementTemplates[elementType];
        if (template.category === category) {
            elements.push({
                type: elementType,
                template: template
            });
        }
    }
    
    return elements;
};

/**
 * Register a custom element template
 */
ElementLibrary.prototype.registerCustomElement = function(elementType, template) {
    if (this.elementTemplates[elementType]) {
        console.warn('Element type already exists:', elementType);
    }
    
    // Validate template
    if (!template.tagName || !template.category || !template.displayName) {
        throw new Error('Invalid element template. Required: tagName, category, displayName');
    }
    
    this.elementTemplates[elementType] = template;
    
    // Re-populate the palette if initialized
    if (this.initialized) {
        this.populateElementPalette();
    }
    
    console.log('Registered custom element:', elementType);
};

/**
 * Clean up resources
 */
ElementLibrary.prototype.destroy = function() {
    if (!this.initialized) return;
    
    // Clear element palette
    for (var category in this.categories) {
        if (this.categories[category]) {
            DOMUtils.empty(this.categories[category]);
        }
    }
    
    // Reset state
    this.initialized = false;
    
    console.log('ElementLibrary destroyed');
};