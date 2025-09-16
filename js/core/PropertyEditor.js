/**
 * PropertyEditor - Real-time Element Customization System
 * 
 * This class manages the property editor in the right panel, providing real-time
 * style and content editing capabilities for selected canvas elements.
 */

function PropertyEditor(rightPanel, eventBus) {
    this.rightPanel = rightPanel;
    this.eventBus = eventBus;
    this.initialized = false;

    // Current state
    this.state = {
        selectedElement: null,
        selectedElementData: null,
        activePropertyGroup: null
    };

    // DOM references
    this.elements = {
        noSelectionMessage: null,
        propertyContent: null,
        propertyGroups: {}
    };

    // Configuration
    this.config = {
        propertyGroups: ['layout', 'typography', 'background', 'border', 'content', 'form'],
        debounceDelay: 300
    };

    // Property definitions
    this.propertyDefinitions = this.initializePropertyDefinitions();
}

/**
 * Initialize the property editor
 */
PropertyEditor.prototype.init = function () {
    if (this.initialized) {
        console.warn('PropertyEditor already initialized');
        return;
    }

    try {
        console.log('Initializing PropertyEditor...');

        // Get DOM references
        this.getDOMReferences();

        // Set up the property editor UI
        this.setupPropertyEditor();

        // Set up event listeners
        this.setupEventListeners();

        this.initialized = true;
        console.log('PropertyEditor initialized successfully');

    } catch (error) {
        console.error('Failed to initialize PropertyEditor:', error);
        throw error;
    }
};

/**
 * Get DOM references
 */
PropertyEditor.prototype.getDOMReferences = function () {
    this.elements.noSelectionMessage = this.rightPanel.querySelector('.no-selection-message');
    this.elements.propertyContent = this.rightPanel.querySelector('.property-content');

    if (!this.elements.noSelectionMessage || !this.elements.propertyContent) {
        throw new Error('PropertyEditor: Required DOM elements not found');
    }
};

/**
 * Set up the property editor UI structure
 */
PropertyEditor.prototype.setupPropertyEditor = function () {
    // Clear existing content
    this.elements.propertyContent.innerHTML = '';

    // Create property groups
    this.createPropertyGroups();

    // Initially show no selection message
    this.showNoSelectionMessage();
};

/**
 * Create property group sections
 */
PropertyEditor.prototype.createPropertyGroups = function () {
    var self = this;

    this.config.propertyGroups.forEach(function (groupName) {
        var groupElement = self.createPropertyGroup(groupName);
        self.elements.propertyGroups[groupName] = groupElement;
        self.elements.propertyContent.appendChild(groupElement);
    });
};

/**
 * Create a property group section
 */
PropertyEditor.prototype.createPropertyGroup = function (groupName) {
    var groupElement = DOMUtils.createElement('div', {
        className: 'property-group',
        attributes: {
            'data-group': groupName
        }
    });

    // Create group header
    var header = DOMUtils.createElement('div', {
        className: 'property-group-header',
        innerHTML: '<h3>' + this.capitalizeFirst(groupName) + '</h3>'
    });

    // Create group content
    var content = DOMUtils.createElement('div', {
        className: 'property-group-content'
    });

    groupElement.appendChild(header);
    groupElement.appendChild(content);

    return groupElement;
};

/**
 * Set up event listeners
 */
PropertyEditor.prototype.setupEventListeners = function () {
    var self = this;

    // Listen for element selection events
    this.eventBus.on('element:selected', function (data) {
        self.handleElementSelected(data);
    });

    this.eventBus.on('element:deselected', function (data) {
        self.handleElementDeselected(data);
    });

    // Listen for element updates to sync property values
    this.eventBus.on('element:updated', function (data) {
        self.handleElementUpdated(data);
    });
};

/**
 * Handle element selection
 */
PropertyEditor.prototype.handleElementSelected = function (data) {
    this.state.selectedElement = data.element;
    this.state.selectedElementData = data.elementData;

    this.showElementProperties();
};

/**
 * Handle element deselection
 */
PropertyEditor.prototype.handleElementDeselected = function (data) {
    this.state.selectedElement = null;
    this.state.selectedElementData = null;

    this.showNoSelectionMessage();
};

/**
 * Handle element updates
 */
PropertyEditor.prototype.handleElementUpdated = function (data) {
    if (data.element === this.state.selectedElement) {
        this.state.selectedElementData = data.elementData;
        // Update property controls to reflect changes
        this.updatePropertyControls();
    }
};

/**
 * Show element properties in the editor
 */
PropertyEditor.prototype.showElementProperties = function () {
    if (!this.state.selectedElement || !this.state.selectedElementData) return;

    // Hide no selection message
    this.elements.noSelectionMessage.style.display = 'none';
    this.elements.propertyContent.style.display = 'block';

    // Populate property groups
    this.populatePropertyGroups();
};

/**
 * Show no selection message
 */
PropertyEditor.prototype.showNoSelectionMessage = function () {
    this.elements.noSelectionMessage.style.display = 'block';
    this.elements.propertyContent.style.display = 'none';

    // Clear property groups
    this.clearPropertyGroups();
};

/**
 * Populate property groups with controls
 */
PropertyEditor.prototype.populatePropertyGroups = function () {
    var self = this;
    var elementType = this.state.selectedElementData.type;

    this.config.propertyGroups.forEach(function (groupName) {
        var groupElement = self.elements.propertyGroups[groupName];
        var contentElement = groupElement.querySelector('.property-group-content');

        // Clear existing content
        contentElement.innerHTML = '';

        // Get properties for this group and element type
        var properties = self.getPropertiesForGroup(groupName, elementType);

        if (properties.length > 0) {
            // Create controls for each property
            properties.forEach(function (propertyDef) {
                var control = self.createPropertyControl(propertyDef);
                if (control) {
                    contentElement.appendChild(control);
                }
            });

            // Show the group
            groupElement.style.display = 'block';
        } else {
            // Hide empty groups
            groupElement.style.display = 'none';
        }
    });
};

/**
 * Clear property groups
 */
PropertyEditor.prototype.clearPropertyGroups = function () {
    var self = this;

    this.config.propertyGroups.forEach(function (groupName) {
        var groupElement = self.elements.propertyGroups[groupName];
        var contentElement = groupElement.querySelector('.property-group-content');
        contentElement.innerHTML = '';
        groupElement.style.display = 'none';
    });
};

/**
 * Create a property control based on property definition
 */
PropertyEditor.prototype.createPropertyControl = function (propertyDef) {
    var controlContainer = DOMUtils.createElement('div', {
        className: 'property-control',
        attributes: {
            'data-property': propertyDef.name
        }
    });

    // Create label
    var label = DOMUtils.createElement('label', {
        className: 'property-label',
        textContent: propertyDef.label,
        attributes: {
            'for': 'prop-' + propertyDef.name
        }
    });

    // Create control based on type
    var control = this.createControlByType(propertyDef);

    if (!control) return null;

    controlContainer.appendChild(label);
    controlContainer.appendChild(control);

    return controlContainer;
};

/**
 * Create control element based on property type
 */
PropertyEditor.prototype.createControlByType = function (propertyDef) {
    var currentValue = this.getCurrentPropertyValue(propertyDef);

    switch (propertyDef.type) {
        case 'text':
            return this.createTextInput(propertyDef, currentValue);

        case 'number':
            return this.createNumberInput(propertyDef, currentValue);

        case 'color':
            return this.createColorPicker(propertyDef, currentValue);

        case 'select':
            return this.createSelectDropdown(propertyDef, currentValue);

        case 'textarea':
            return this.createTextarea(propertyDef, currentValue);

        case 'checkbox':
            return this.createCheckbox(propertyDef, currentValue);

        default:
            return this.createTextInput(propertyDef, currentValue);
    }
};

/**
 * Create text input control
 */
PropertyEditor.prototype.createTextInput = function (propertyDef, currentValue) {
    var self = this;

    var input = DOMUtils.createElement('input', {
        attributes: {
            type: 'text',
            id: 'prop-' + propertyDef.name,
            value: currentValue || '',
            placeholder: propertyDef.placeholder || ''
        },
        className: 'property-input'
    });

    // Add event listeners with debouncing
    var debouncedUpdate = DOMUtils.debounce(function () {
        self.updateElementProperty(propertyDef, input.value);
    }, this.config.debounceDelay);

    DOMUtils.addEventListener(input, 'input', debouncedUpdate);
    DOMUtils.addEventListener(input, 'change', function () {
        self.updateElementProperty(propertyDef, input.value);
    });

    return input;
};

/**
 * Create number input control
 */
PropertyEditor.prototype.createNumberInput = function (propertyDef, currentValue) {
    var self = this;

    var input = DOMUtils.createElement('input', {
        attributes: {
            type: 'number',
            id: 'prop-' + propertyDef.name,
            value: this.extractNumericValue(currentValue) || '',
            min: propertyDef.min || '',
            max: propertyDef.max || '',
            step: propertyDef.step || '1'
        },
        className: 'property-input property-number'
    });

    // Add unit suffix if specified
    if (propertyDef.unit) {
        var container = DOMUtils.createElement('div', {
            className: 'property-input-with-unit'
        });

        var unitLabel = DOMUtils.createElement('span', {
            className: 'property-unit',
            textContent: propertyDef.unit
        });

        container.appendChild(input);
        container.appendChild(unitLabel);

        var debouncedUpdate = DOMUtils.debounce(function () {
            var value = input.value ? input.value + propertyDef.unit : '';
            self.updateElementProperty(propertyDef, value);
        }, this.config.debounceDelay);

        DOMUtils.addEventListener(input, 'input', debouncedUpdate);
        DOMUtils.addEventListener(input, 'change', function () {
            var value = input.value ? input.value + propertyDef.unit : '';
            self.updateElementProperty(propertyDef, value);
        });

        return container;
    } else {
        var debouncedUpdate = DOMUtils.debounce(function () {
            self.updateElementProperty(propertyDef, input.value);
        }, this.config.debounceDelay);

        DOMUtils.addEventListener(input, 'input', debouncedUpdate);
        DOMUtils.addEventListener(input, 'change', function () {
            self.updateElementProperty(propertyDef, input.value);
        });

        return input;
    }
};

/**
 * Create color picker control
 */
PropertyEditor.prototype.createColorPicker = function (propertyDef, currentValue) {
    var self = this;

    var container = DOMUtils.createElement('div', {
        className: 'property-color-picker'
    });

    var colorInput = DOMUtils.createElement('input', {
        attributes: {
            type: 'color',
            id: 'prop-' + propertyDef.name,
            value: this.normalizeColorValue(currentValue) || '#000000'
        },
        className: 'property-color-input'
    });

    var textInput = DOMUtils.createElement('input', {
        attributes: {
            type: 'text',
            value: currentValue || '',
            placeholder: '#000000'
        },
        className: 'property-color-text'
    });

    container.appendChild(colorInput);
    container.appendChild(textInput);

    // Sync color picker and text input
    DOMUtils.addEventListener(colorInput, 'input', function () {
        textInput.value = colorInput.value;
        self.updateElementProperty(propertyDef, colorInput.value);
    });

    var debouncedUpdate = DOMUtils.debounce(function () {
        var color = self.normalizeColorValue(textInput.value);
        if (color) {
            colorInput.value = color;
        }
        self.updateElementProperty(propertyDef, textInput.value);
    }, this.config.debounceDelay);

    DOMUtils.addEventListener(textInput, 'input', debouncedUpdate);
    DOMUtils.addEventListener(textInput, 'change', function () {
        var color = self.normalizeColorValue(textInput.value);
        if (color) {
            colorInput.value = color;
        }
        self.updateElementProperty(propertyDef, textInput.value);
    });

    return container;
};

/**
 * Create select dropdown control
 */
PropertyEditor.prototype.createSelectDropdown = function (propertyDef, currentValue) {
    var self = this;

    var select = DOMUtils.createElement('select', {
        attributes: {
            id: 'prop-' + propertyDef.name
        },
        className: 'property-select'
    });

    // Add options
    if (propertyDef.options) {
        propertyDef.options.forEach(function (option) {
            var optionElement = DOMUtils.createElement('option', {
                attributes: {
                    value: option.value
                },
                textContent: option.label
            });

            if (option.value === currentValue) {
                optionElement.selected = true;
            }

            select.appendChild(optionElement);
        });
    }

    DOMUtils.addEventListener(select, 'change', function () {
        self.updateElementProperty(propertyDef, select.value);
    });

    return select;
};

/**
 * Create textarea control
 */
PropertyEditor.prototype.createTextarea = function (propertyDef, currentValue) {
    var self = this;

    var textarea = DOMUtils.createElement('textarea', {
        attributes: {
            id: 'prop-' + propertyDef.name,
            rows: propertyDef.rows || '3',
            placeholder: propertyDef.placeholder || ''
        },
        className: 'property-textarea',
        textContent: currentValue || ''
    });

    var debouncedUpdate = DOMUtils.debounce(function () {
        self.updateElementProperty(propertyDef, textarea.value);
    }, this.config.debounceDelay);

    DOMUtils.addEventListener(textarea, 'input', debouncedUpdate);
    DOMUtils.addEventListener(textarea, 'change', function () {
        self.updateElementProperty(propertyDef, textarea.value);
    });

    return textarea;
};

/**
 * Create checkbox control
 */
PropertyEditor.prototype.createCheckbox = function (propertyDef, currentValue) {
    var self = this;

    var checkbox = DOMUtils.createElement('input', {
        attributes: {
            type: 'checkbox',
            id: 'prop-' + propertyDef.name
        },
        className: 'property-checkbox'
    });

    // Set checked state based on current value
    checkbox.checked = this.isTruthyValue(currentValue);

    DOMUtils.addEventListener(checkbox, 'change', function () {
        var value = checkbox.checked ? propertyDef.name : '';
        self.updateElementProperty(propertyDef, value);
    });

    return checkbox;
};

/**
 * Update element property
 */
PropertyEditor.prototype.updateElementProperty = function (propertyDef, value) {
    if (!this.state.selectedElement || !this.state.selectedElementData) return;

    try {
        // Validate property value using ErrorHandler
        if (window.visualWebBuilder && window.visualWebBuilder.errorHandler) {
            var validation = window.visualWebBuilder.errorHandler.validateProperty(
                propertyDef.cssProperty || propertyDef.name,
                value,
                this.state.selectedElementData.type
            );

            if (!validation.isValid) {
                this.eventBus.emit('error:validation', {
                    error: new Error(validation.error),
                    field: propertyDef.label || propertyDef.name,
                    value: value,
                    property: propertyDef.name
                });
                return;
            }
        }

        var updateData = {};

        if (propertyDef.target === 'content') {
            // Validate content length
            if (value && value.length > 10000) {
                this.eventBus.emit('error:validation', {
                    error: new Error('Content is too long (maximum 10,000 characters)'),
                    field: propertyDef.label || propertyDef.name,
                    value: value,
                    property: propertyDef.name
                });
                return;
            }
            updateData.content = value;
        } else if (propertyDef.target === 'attribute') {
            // Validate attribute values
            if (propertyDef.name === 'name' && value && !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value)) {
                this.eventBus.emit('error:validation', {
                    error: new Error('Name must start with a letter and contain only letters, numbers, hyphens, and underscores'),
                    field: propertyDef.label || propertyDef.name,
                    value: value,
                    property: propertyDef.name
                });
                return;
            }

            updateData.attributes = {};
            updateData.attributes[propertyDef.name] = value;
        } else {
            // Default to style property
            updateData.styles = {};
            updateData.styles[propertyDef.cssProperty || propertyDef.name] = value;
        }

        // Check if we're in responsive mode and add responsive indicator
        if (window.visualWebBuilder && window.visualWebBuilder.responsiveManager) {
            var responsiveManager = window.visualWebBuilder.responsiveManager;
            var currentViewport = responsiveManager.getCurrentViewport();

            // Add responsive indicator if not in desktop mode
            if (currentViewport !== 'desktop' && updateData.styles) {
                this.addResponsivePropertyIndicator(propertyDef.name);
            }
        }

        // Emit property update event
        this.eventBus.emit('property:update', {
            element: this.state.selectedElement,
            elementData: this.state.selectedElementData,
            property: propertyDef.name,
            value: value,
            updateData: updateData,
            isResponsive: this.isResponsiveEdit()
        });

    } catch (error) {
        console.error('Error updating property:', error);
        this.eventBus.emit('error:validation', {
            error: error,
            field: propertyDef.label || propertyDef.name,
            value: value,
            property: propertyDef.name
        });
    }
};

/**
 * Get current property value from element
 */
PropertyEditor.prototype.getCurrentPropertyValue = function (propertyDef) {
    if (!this.state.selectedElementData) return '';

    if (propertyDef.target === 'content') {
        return this.state.selectedElementData.content || '';
    } else if (propertyDef.target === 'attribute') {
        return this.state.selectedElementData.attributes[propertyDef.name] || '';
    } else {
        // Style property
        var cssProperty = propertyDef.cssProperty || propertyDef.name;
        return this.state.selectedElementData.styles[cssProperty] || '';
    }
};

/**
 * Get properties for a specific group and element type
 */
PropertyEditor.prototype.getPropertiesForGroup = function (groupName, elementType) {
    var groupProperties = this.propertyDefinitions[groupName] || [];

    return groupProperties.filter(function (propertyDef) {
        if (!propertyDef.elementTypes) return true;
        return propertyDef.elementTypes.indexOf(elementType) !== -1 ||
            propertyDef.elementTypes.indexOf('*') !== -1;
    });
};

/**
 * Initialize property definitions
 */
PropertyEditor.prototype.initializePropertyDefinitions = function () {
    return {
        layout: [
            {
                name: 'width',
                label: 'Width',
                type: 'text',
                cssProperty: 'width',
                placeholder: 'auto, 100px, 50%',
                elementTypes: ['*']
            },
            {
                name: 'height',
                label: 'Height',
                type: 'text',
                cssProperty: 'height',
                placeholder: 'auto, 100px, 50%',
                elementTypes: ['*']
            },
            {
                name: 'margin',
                label: 'Margin',
                type: 'text',
                cssProperty: 'margin',
                placeholder: '10px, 10px 20px',
                elementTypes: ['*']
            },
            {
                name: 'padding',
                label: 'Padding',
                type: 'text',
                cssProperty: 'padding',
                placeholder: '10px, 10px 20px',
                elementTypes: ['*']
            }
        ],

        typography: [
            {
                name: 'font-size',
                label: 'Font Size',
                type: 'number',
                cssProperty: 'font-size',
                unit: 'px',
                min: '8',
                max: '72',
                elementTypes: ['paragraph', 'heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6', 'button', 'span', 'link', 'div']
            },
            {
                name: 'color',
                label: 'Text Color',
                type: 'color',
                cssProperty: 'color',
                elementTypes: ['paragraph', 'heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6', 'button', 'span', 'link', 'div']
            },
            {
                name: 'text-align',
                label: 'Text Align',
                type: 'select',
                cssProperty: 'text-align',
                options: [
                    { value: '', label: 'Default' },
                    { value: 'left', label: 'Left' },
                    { value: 'center', label: 'Center' },
                    { value: 'right', label: 'Right' }
                ],
                elementTypes: ['paragraph', 'heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6', 'button', 'div']
            }
        ],

        background: [
            {
                name: 'background-color',
                label: 'Background Color',
                type: 'color',
                cssProperty: 'background-color',
                elementTypes: ['*']
            }
        ],

        border: [
            {
                name: 'border-width',
                label: 'Border Width',
                type: 'number',
                cssProperty: 'border-width',
                unit: 'px',
                min: '0',
                max: '20',
                elementTypes: ['*']
            },
            {
                name: 'border-color',
                label: 'Border Color',
                type: 'color',
                cssProperty: 'border-color',
                elementTypes: ['*']
            }
        ],

        content: [
            {
                name: 'content',
                label: 'Text Content',
                type: 'textarea',
                target: 'content',
                rows: '3',
                elementTypes: ['paragraph', 'heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6', 'button', 'span', 'link', 'label']
            }
        ],

        form: [
            {
                name: 'placeholder',
                label: 'Placeholder',
                type: 'text',
                target: 'attribute',
                placeholder: 'Enter placeholder text...',
                elementTypes: ['input', 'textarea']
            },
            {
                name: 'required',
                label: 'Required',
                type: 'checkbox',
                target: 'attribute',
                elementTypes: ['input', 'textarea', 'select']
            },
            {
                name: 'name',
                label: 'Name',
                type: 'text',
                target: 'attribute',
                placeholder: 'field-name',
                elementTypes: ['input', 'textarea', 'select', 'checkbox', 'radio']
            },
            {
                name: 'value',
                label: 'Value',
                type: 'text',
                target: 'attribute',
                placeholder: 'field-value',
                elementTypes: ['input', 'checkbox', 'radio']
            },
            {
                name: 'type',
                label: 'Input Type',
                type: 'select',
                target: 'attribute',
                options: [
                    { value: 'text', label: 'Text' },
                    { value: 'email', label: 'Email' },
                    { value: 'password', label: 'Password' },
                    { value: 'number', label: 'Number' },
                    { value: 'tel', label: 'Phone' },
                    { value: 'url', label: 'URL' },
                    { value: 'date', label: 'Date' },
                    { value: 'time', label: 'Time' },
                    { value: 'datetime-local', label: 'Date & Time' }
                ],
                elementTypes: ['input']
            },
            {
                name: 'min',
                label: 'Minimum Value',
                type: 'text',
                target: 'attribute',
                placeholder: '0',
                elementTypes: ['input']
            },
            {
                name: 'max',
                label: 'Maximum Value',
                type: 'text',
                target: 'attribute',
                placeholder: '100',
                elementTypes: ['input']
            },
            {
                name: 'maxlength',
                label: 'Max Length',
                type: 'number',
                target: 'attribute',
                min: '1',
                elementTypes: ['input', 'textarea']
            },
            {
                name: 'rows',
                label: 'Rows',
                type: 'number',
                target: 'attribute',
                min: '1',
                max: '20',
                elementTypes: ['textarea']
            },
            {
                name: 'cols',
                label: 'Columns',
                type: 'number',
                target: 'attribute',
                min: '1',
                max: '100',
                elementTypes: ['textarea']
            },
            {
                name: 'multiple',
                label: 'Multiple Selection',
                type: 'checkbox',
                target: 'attribute',
                elementTypes: ['select']
            },
            {
                name: 'disabled',
                label: 'Disabled',
                type: 'checkbox',
                target: 'attribute',
                elementTypes: ['input', 'textarea', 'select', 'button', 'checkbox', 'radio']
            },
            {
                name: 'readonly',
                label: 'Read Only',
                type: 'checkbox',
                target: 'attribute',
                elementTypes: ['input', 'textarea']
            }
        ]
    };
};

/**
 * Update property controls to reflect current values
 */
PropertyEditor.prototype.updatePropertyControls = function () {
    // This method will be called when element data changes
    // For now, we'll just repopulate the groups
    if (this.state.selectedElement && this.state.selectedElementData) {
        this.populatePropertyGroups();
    }
};

/**
 * Utility methods
 */
PropertyEditor.prototype.capitalizeFirst = function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

PropertyEditor.prototype.extractNumericValue = function (value) {
    if (!value) return '';
    var match = value.toString().match(/^(\d*\.?\d+)/);
    return match ? match[1] : '';
};

PropertyEditor.prototype.normalizeColorValue = function (value) {
    if (!value) return null;

    // If it's already a hex color, return it
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        return value;
    }

    // For now, just return null for non-hex values
    return null;
};

PropertyEditor.prototype.isTruthyValue = function (value) {
    if (!value) return false;

    // Check for boolean attributes (presence indicates true)
    return value === 'true' || value === true || value === 'required' ||
        value === 'disabled' || value === 'readonly' || value === 'multiple' ||
        value === 'checked' || value === 'selected';
};

/**
 * Check if we're currently editing in responsive mode
 */
PropertyEditor.prototype.isResponsiveEdit = function () {
    if (!window.visualWebBuilder || !window.visualWebBuilder.responsiveManager) {
        return false;
    }

    var responsiveManager = window.visualWebBuilder.responsiveManager;
    return responsiveManager.getCurrentViewport() !== 'desktop';
};

/**
 * Add responsive property indicator
 */
PropertyEditor.prototype.addResponsivePropertyIndicator = function (propertyName) {
    var propertyControl = document.querySelector('.property-control[data-property="' + propertyName + '"]');
    if (!propertyControl) return;

    // Check if indicator already exists
    var existingIndicator = propertyControl.querySelector('.responsive-property-indicator');
    if (existingIndicator) return;

    // Create responsive indicator
    var indicator = DOMUtils.createElement('div', {
        className: 'responsive-property-indicator',
        title: 'This property has responsive values',
        styles: {
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '6px',
            height: '6px',
            background: '#e74c3c',
            borderRadius: '50%',
            zIndex: '10',
            animation: 'responsiveIndicatorPulse 2s infinite'
        }
    });

    // Make control relative positioned
    propertyControl.style.position = 'relative';
    propertyControl.appendChild(indicator);
};

/**
 * Remove responsive property indicator
 */
PropertyEditor.prototype.removeResponsivePropertyIndicator = function (propertyName) {
    var propertyControl = document.querySelector('.property-control[data-property="' + propertyName + '"]');
    if (!propertyControl) return;

    var indicator = propertyControl.querySelector('.responsive-property-indicator');
    if (indicator) {
        indicator.remove();
    }
};

/**
 * Update property controls for responsive editing
 */
PropertyEditor.prototype.updateResponsivePropertyControls = function () {
    if (!this.state.selectedElement || !window.visualWebBuilder || !window.visualWebBuilder.responsiveManager) {
        return;
    }

    var responsiveManager = window.visualWebBuilder.responsiveManager;
    var elementId = this.state.selectedElement.getAttribute('data-vwb-id');
    var responsiveStyles = responsiveManager.getResponsiveStyles(elementId);
    var currentViewport = responsiveManager.getCurrentViewport();

    // Update property values for current viewport
    if (responsiveStyles[currentViewport]) {
        var styles = responsiveStyles[currentViewport];

        for (var property in styles) {
            this.updatePropertyControlValue(property, styles[property]);
        }
    }

    // Add indicators for properties with responsive values
    for (var viewport in responsiveStyles) {
        if (viewport !== 'desktop') {
            var viewportStyles = responsiveStyles[viewport];
            for (var prop in viewportStyles) {
                this.addResponsivePropertyIndicator(prop);
            }
        }
    }
};

/**
 * Update property control value
 */
PropertyEditor.prototype.updatePropertyControlValue = function (propertyName, value) {
    var propertyControl = document.querySelector('.property-control[data-property="' + propertyName + '"]');
    if (!propertyControl) return;

    var input = propertyControl.querySelector('.property-input, .property-select, .property-textarea');
    if (!input) return;

    // Update input value based on type
    if (input.type === 'color') {
        var colorValue = this.normalizeColorValue(value);
        if (colorValue) {
            input.value = colorValue;
        }
    } else if (input.type === 'number') {
        input.value = this.extractNumericValue(value);
    } else {
        input.value = value || '';
    }

    // Update color text input if it exists
    var colorText = propertyControl.querySelector('.property-color-text');
    if (colorText) {
        colorText.value = value || '';
    }
};

/**
 * Clean up resources
 */
PropertyEditor.prototype.destroy = function () {
    if (!this.initialized) return;

    // Clear property groups
    this.clearPropertyGroups();

    // Reset state
    this.state = {
        selectedElement: null,
        selectedElementData: null,
        activePropertyGroup: null
    };

    this.initialized = false;
    console.log('PropertyEditor destroyed');
};