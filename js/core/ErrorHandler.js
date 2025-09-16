/**
 * ErrorHandler - Centralized Error Handling and User Feedback System
 * 
 * This class provides centralized error handling, user notifications,
 * validation, loading states, and browser compatibility fallbacks.
 */

function ErrorHandler(eventBus) {
    this.eventBus = eventBus;
    this.initialized = false;
    
    // Configuration
    this.config = {
        notificationDuration: {
            error: 5000,
            warning: 4000,
            success: 3000,
            info: 3000
        },
        maxNotifications: 5,
        retryAttempts: 3,
        retryDelay: 1000
    };
    
    // State
    this.state = {
        activeNotifications: [],
        loadingStates: new Map(),
        errorCounts: new Map(),
        browserCapabilities: null
    };
    
    // DOM elements
    this.elements = {
        notificationContainer: null,
        loadingOverlay: null
    };
}

/**
 * Initialize the error handler
 */
ErrorHandler.prototype.init = function() {
    if (this.initialized) {
        console.warn('ErrorHandler already initialized');
        return;
    }

    try {
        console.log('Initializing ErrorHandler...');
        
        // Detect browser capabilities
        this.detectBrowserCapabilities();
        
        // Create notification system
        this.createNotificationSystem();
        
        // Create loading overlay system
        this.createLoadingOverlay();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up global error handlers
        this.setupGlobalErrorHandlers();
        
        this.initialized = true;
        console.log('ErrorHandler initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize ErrorHandler:', error);
        throw error;
    }
};

/**
 * Detect browser capabilities for fallbacks
 */
ErrorHandler.prototype.detectBrowserCapabilities = function() {
    this.state.browserCapabilities = {
        dragAndDrop: this.checkDragAndDropSupport(),
        localStorage: this.checkLocalStorageSupport(),
        colorInput: this.checkColorInputSupport(),
        flexbox: this.checkFlexboxSupport(),
        grid: this.checkGridSupport(),
        customProperties: this.checkCustomPropertiesSupport()
    };
    
    console.log('Browser capabilities detected:', this.state.browserCapabilities);
};

/**
 * Check drag and drop support
 */
ErrorHandler.prototype.checkDragAndDropSupport = function() {
    var div = document.createElement('div');
    return ('draggable' in div) && ('ondragstart' in div) && ('ondrop' in div);
};

/**
 * Check localStorage support
 */
ErrorHandler.prototype.checkLocalStorageSupport = function() {
    try {
        var test = 'vwb-test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
};

/**
 * Check color input support
 */
ErrorHandler.prototype.checkColorInputSupport = function() {
    var input = document.createElement('input');
    input.type = 'color';
    return input.type === 'color';
};

/**
 * Check flexbox support
 */
ErrorHandler.prototype.checkFlexboxSupport = function() {
    var div = document.createElement('div');
    div.style.display = 'flex';
    return div.style.display === 'flex';
};

/**
 * Check CSS Grid support
 */
ErrorHandler.prototype.checkGridSupport = function() {
    var div = document.createElement('div');
    div.style.display = 'grid';
    return div.style.display === 'grid';
};

/**
 * Check CSS custom properties support
 */
ErrorHandler.prototype.checkCustomPropertiesSupport = function() {
    return window.CSS && CSS.supports && CSS.supports('color', 'var(--test)');
};

/**
 * Create notification system
 */
ErrorHandler.prototype.createNotificationSystem = function() {
    this.elements.notificationContainer = DOMUtils.createElement('div', {
        className: 'vwb-notification-container',
        styles: {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '10000',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'none'
        }
    });
    
    document.body.appendChild(this.elements.notificationContainer);
};

/**
 * Create loading overlay system
 */
ErrorHandler.prototype.createLoadingOverlay = function() {
    this.elements.loadingOverlay = DOMUtils.createElement('div', {
        className: 'vwb-loading-overlay',
        styles: {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: '9999',
            display: 'none',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column'
        }
    });
    
    var spinner = DOMUtils.createElement('div', {
        className: 'vwb-loading-spinner',
        styles: {
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'vwb-spin 1s linear infinite',
            marginBottom: '16px'
        }
    });
    
    var loadingText = DOMUtils.createElement('div', {
        className: 'vwb-loading-text',
        textContent: 'Loading...',
        styles: {
            color: 'white',
            fontSize: '16px',
            fontWeight: '500'
        }
    });
    
    this.elements.loadingOverlay.appendChild(spinner);
    this.elements.loadingOverlay.appendChild(loadingText);
    
    // Add CSS animation
    this.addSpinnerAnimation();
    
    document.body.appendChild(this.elements.loadingOverlay);
};

/**
 * Add spinner animation CSS
 */
ErrorHandler.prototype.addSpinnerAnimation = function() {
    var style = document.createElement('style');
    style.textContent = `
        @keyframes vwb-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
};

/**
 * Set up event listeners
 */
ErrorHandler.prototype.setupEventListeners = function() {
    var self = this;
    
    // Listen for error events from other components
    this.eventBus.on('error:drag-drop', function(data) {
        self.handleDragDropError(data);
    });
    
    this.eventBus.on('error:validation', function(data) {
        self.handleValidationError(data);
    });
    
    this.eventBus.on('error:storage', function(data) {
        self.handleStorageError(data);
    });
    
    this.eventBus.on('error:export', function(data) {
        self.handleExportError(data);
    });
    
    // Listen for loading state events
    this.eventBus.on('loading:start', function(data) {
        self.showLoadingState(data.operation, data.message);
    });
    
    this.eventBus.on('loading:end', function(data) {
        self.hideLoadingState(data.operation);
    });
    
    // Listen for success events
    this.eventBus.on('success:save', function(data) {
        self.showNotification('Project saved successfully', 'success');
    });
    
    this.eventBus.on('success:load', function(data) {
        self.showNotification('Project loaded successfully', 'success');
    });
    
    this.eventBus.on('success:export', function(data) {
        self.showNotification('Export completed successfully', 'success');
    });
};

/**
 * Set up global error handlers
 */
ErrorHandler.prototype.setupGlobalErrorHandlers = function() {
    var self = this;
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        self.handleUnhandledError(event.reason, 'Promise rejection');
        event.preventDefault();
    });
    
    // Handle global JavaScript errors
    window.addEventListener('error', function(event) {
        console.error('Global JavaScript error:', event.error);
        self.handleUnhandledError(event.error, 'JavaScript error');
    });
};

/**
 * Handle drag and drop errors
 */
ErrorHandler.prototype.handleDragDropError = function(data) {
    var error = data.error;
    var operation = data.operation || 'drag and drop';
    
    console.error('Drag and drop error:', error);
    
    // Check if it's a browser compatibility issue
    if (!this.state.browserCapabilities.dragAndDrop) {
        this.showNotification(
            'Your browser does not support drag and drop. Please use a modern browser.',
            'error'
        );
        this.provideDragDropFallback();
        return;
    }
    
    // Handle specific drag and drop errors
    var message = 'Failed to ' + operation;
    if (error.message) {
        if (error.message.includes('Invalid drop target')) {
            message = 'Cannot drop element here. Try dropping on a container element.';
        } else if (error.message.includes('Invalid element type')) {
            message = 'Invalid element type. Please select a valid element from the library.';
        } else if (error.message.includes('Drop zone not found')) {
            message = 'No valid drop zone found. Make sure you\'re dropping on the canvas.';
        }
    }
    
    this.showNotification(message, 'error');
    
    // Increment error count for this operation
    this.incrementErrorCount('drag-drop');
    
    // If too many errors, suggest troubleshooting
    if (this.getErrorCount('drag-drop') >= 3) {
        this.showTroubleshootingTips('drag-drop');
    }
};

/**
 * Handle validation errors
 */
ErrorHandler.prototype.handleValidationError = function(data) {
    var error = data.error;
    var field = data.field;
    var value = data.value;
    
    console.error('Validation error:', error, 'Field:', field, 'Value:', value);
    
    var message = 'Invalid value';
    if (field) {
        message = 'Invalid value for ' + field;
    }
    
    if (error.message) {
        message = error.message;
    }
    
    this.showNotification(message, 'warning');
};

/**
 * Handle storage errors
 */
ErrorHandler.prototype.handleStorageError = function(data) {
    var error = data.error;
    var operation = data.operation || 'storage operation';
    
    console.error('Storage error:', error);
    
    // Check if it's a localStorage issue
    if (!this.state.browserCapabilities.localStorage) {
        this.showNotification(
            'Local storage is not available. Your projects cannot be saved.',
            'error'
        );
        this.provideStorageFallback();
        return;
    }
    
    // Handle quota exceeded errors
    if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        this.showNotification(
            'Storage quota exceeded. Please delete some old projects to free up space.',
            'error'
        );
        this.eventBus.emit('storage:quota-exceeded');
        return;
    }
    
    // Handle corrupted data errors
    if (error.message.includes('Invalid project data') || error.message.includes('JSON')) {
        this.showNotification(
            'Project data is corrupted and cannot be loaded.',
            'error'
        );
        return;
    }
    
    var message = 'Failed to ' + operation;
    if (error.message) {
        message = error.message;
    }
    
    this.showNotification(message, 'error');
};

/**
 * Handle export errors
 */
ErrorHandler.prototype.handleExportError = function(data) {
    var error = data.error;
    var exportType = data.exportType || 'export';
    
    console.error('Export error:', error);
    
    var message = 'Failed to ' + exportType;
    if (error.message) {
        if (error.message.includes('Empty canvas')) {
            message = 'Cannot export empty canvas. Please add some elements first.';
        } else if (error.message.includes('Invalid HTML')) {
            message = 'Generated HTML is invalid. Please check your elements.';
        } else {
            message = error.message;
        }
    }
    
    this.showNotification(message, 'error');
};

/**
 * Handle unhandled errors
 */
ErrorHandler.prototype.handleUnhandledError = function(error, context) {
    console.error('Unhandled error in', context, ':', error);
    
    // Don't show notifications for every unhandled error to avoid spam
    var errorKey = 'unhandled-' + context;
    this.incrementErrorCount(errorKey);
    
    if (this.getErrorCount(errorKey) <= 2) {
        this.showNotification(
            'An unexpected error occurred. Please refresh the page if problems persist.',
            'error'
        );
    }
};

/**
 * Show notification to user
 */
ErrorHandler.prototype.showNotification = function(message, type, duration) {
    type = type || 'info';
    duration = duration || this.config.notificationDuration[type];
    
    // Remove oldest notification if we have too many
    if (this.state.activeNotifications.length >= this.config.maxNotifications) {
        var oldest = this.state.activeNotifications.shift();
        this.removeNotification(oldest);
    }
    
    var notification = this.createNotificationElement(message, type);
    this.elements.notificationContainer.appendChild(notification);
    this.state.activeNotifications.push(notification);
    
    // Animate in
    setTimeout(function() {
        DOMUtils.setStyles(notification, {
            opacity: '1',
            transform: 'translateX(0)'
        });
    }, 10);
    
    // Auto remove
    var self = this;
    setTimeout(function() {
        self.removeNotification(notification);
    }, duration);
    
    return notification;
};

/**
 * Create notification element
 */
ErrorHandler.prototype.createNotificationElement = function(message, type) {
    var colors = {
        error: '#e74c3c',
        warning: '#f39c12',
        success: '#27ae60',
        info: '#3498db'
    };
    
    var icons = {
        error: '✕',
        warning: '⚠',
        success: '✓',
        info: 'ℹ'
    };
    
    var notification = DOMUtils.createElement('div', {
        className: 'vwb-notification vwb-notification-' + type,
        styles: {
            backgroundColor: colors[type] || colors.info,
            color: 'white',
            padding: '12px 16px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '300px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease',
            pointerEvents: 'auto',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        }
    });
    
    var icon = DOMUtils.createElement('span', {
        className: 'vwb-notification-icon',
        textContent: icons[type] || icons.info,
        styles: {
            fontSize: '16px',
            flexShrink: '0'
        }
    });
    
    var messageElement = DOMUtils.createElement('span', {
        className: 'vwb-notification-message',
        textContent: message,
        styles: {
            flex: '1',
            wordBreak: 'break-word'
        }
    });
    
    notification.appendChild(icon);
    notification.appendChild(messageElement);
    
    // Click to dismiss
    var self = this;
    DOMUtils.addEventListener(notification, 'click', function() {
        self.removeNotification(notification);
    });
    
    return notification;
};

/**
 * Remove notification
 */
ErrorHandler.prototype.removeNotification = function(notification) {
    if (!notification || !notification.parentNode) return;
    
    // Remove from active list
    var index = this.state.activeNotifications.indexOf(notification);
    if (index !== -1) {
        this.state.activeNotifications.splice(index, 1);
    }
    
    // Animate out
    DOMUtils.setStyles(notification, {
        opacity: '0',
        transform: 'translateX(100%)'
    });
    
    // Remove from DOM
    setTimeout(function() {
        DOMUtils.removeElement(notification);
    }, 300);
};

/**
 * Show loading state
 */
ErrorHandler.prototype.showLoadingState = function(operation, message) {
    operation = operation || 'default';
    message = message || 'Loading...';
    
    this.state.loadingStates.set(operation, {
        message: message,
        startTime: Date.now()
    });
    
    // Update loading text
    var loadingText = this.elements.loadingOverlay.querySelector('.vwb-loading-text');
    if (loadingText) {
        loadingText.textContent = message;
    }
    
    // Show overlay
    this.elements.loadingOverlay.style.display = 'flex';
    
    console.log('Loading state started:', operation, message);
};

/**
 * Hide loading state
 */
ErrorHandler.prototype.hideLoadingState = function(operation) {
    operation = operation || 'default';
    
    var loadingState = this.state.loadingStates.get(operation);
    if (loadingState) {
        var duration = Date.now() - loadingState.startTime;
        console.log('Loading state ended:', operation, 'Duration:', duration + 'ms');
        this.state.loadingStates.delete(operation);
    }
    
    // Hide overlay if no more loading states
    if (this.state.loadingStates.size === 0) {
        this.elements.loadingOverlay.style.display = 'none';
    }
};

/**
 * Validate element property value
 */
ErrorHandler.prototype.validateProperty = function(propertyName, value, elementType) {
    try {
        // Basic validation rules
        var validationRules = {
            'width': this.validateSizeValue,
            'height': this.validateSizeValue,
            'margin': this.validateSizeValue,
            'padding': this.validateSizeValue,
            'font-size': this.validatePositiveNumber,
            'border-width': this.validatePositiveNumber,
            'color': this.validateColor,
            'background-color': this.validateColor,
            'border-color': this.validateColor
        };
        
        var validator = validationRules[propertyName];
        if (validator) {
            return validator.call(this, value);
        }
        
        // Default validation - just check if it's not empty for required fields
        return { isValid: true };
        
    } catch (error) {
        return {
            isValid: false,
            error: 'Validation failed: ' + error.message
        };
    }
};

/**
 * Validate size value (width, height, margin, padding)
 */
ErrorHandler.prototype.validateSizeValue = function(value) {
    if (!value || value === 'auto' || value === 'inherit') {
        return { isValid: true };
    }
    
    // Check for valid CSS size units
    var sizePattern = /^(\d*\.?\d+)(px|em|rem|%|vh|vw|pt|pc|in|cm|mm|ex|ch|vmin|vmax)?$/;
    var match = value.match(sizePattern);
    
    if (!match) {
        return {
            isValid: false,
            error: 'Invalid size value. Use numbers with units like px, %, em, etc.'
        };
    }
    
    var number = parseFloat(match[1]);
    if (isNaN(number) || number < 0) {
        return {
            isValid: false,
            error: 'Size values must be positive numbers'
        };
    }
    
    return { isValid: true };
};

/**
 * Validate positive number
 */
ErrorHandler.prototype.validatePositiveNumber = function(value) {
    if (!value) return { isValid: true };
    
    var number = parseFloat(value);
    if (isNaN(number)) {
        return {
            isValid: false,
            error: 'Value must be a number'
        };
    }
    
    if (number < 0) {
        return {
            isValid: false,
            error: 'Value must be positive'
        };
    }
    
    return { isValid: true };
};

/**
 * Validate color value
 */
ErrorHandler.prototype.validateColor = function(value) {
    if (!value) return { isValid: true };
    
    // Check hex colors
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value)) {
        return { isValid: true };
    }
    
    // Check named colors (basic set)
    var namedColors = ['red', 'green', 'blue', 'white', 'black', 'yellow', 'orange', 'purple', 'pink', 'gray', 'grey', 'transparent'];
    if (namedColors.indexOf(value.toLowerCase()) !== -1) {
        return { isValid: true };
    }
    
    // Check rgb/rgba
    if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(value)) {
        return { isValid: true };
    }
    
    return {
        isValid: false,
        error: 'Invalid color value. Use hex (#ff0000), named colors (red), or rgb(255,0,0)'
    };
};

/**
 * Increment error count for operation
 */
ErrorHandler.prototype.incrementErrorCount = function(operation) {
    var count = this.state.errorCounts.get(operation) || 0;
    this.state.errorCounts.set(operation, count + 1);
};

/**
 * Get error count for operation
 */
ErrorHandler.prototype.getErrorCount = function(operation) {
    return this.state.errorCounts.get(operation) || 0;
};

/**
 * Show troubleshooting tips
 */
ErrorHandler.prototype.showTroubleshootingTips = function(operation) {
    var tips = {
        'drag-drop': 'Try refreshing the page, or use a different browser if drag and drop continues to fail.',
        'storage': 'Clear your browser cache or try using a different browser if storage issues persist.',
        'export': 'Make sure your canvas has elements before exporting, and try a simpler layout if export fails.'
    };
    
    var tip = tips[operation] || 'Try refreshing the page if problems persist.';
    this.showNotification('Tip: ' + tip, 'info', 6000);
};

/**
 * Provide drag and drop fallback
 */
ErrorHandler.prototype.provideDragDropFallback = function() {
    // Emit event to enable alternative interaction methods
    this.eventBus.emit('fallback:drag-drop-disabled');
    
    this.showNotification(
        'Alternative: Double-click elements in the library to add them to the canvas.',
        'info',
        5000
    );
};

/**
 * Provide storage fallback
 */
ErrorHandler.prototype.provideStorageFallback = function() {
    // Emit event to enable export-based workflow
    this.eventBus.emit('fallback:storage-disabled');
    
    this.showNotification(
        'Alternative: Use the export feature to save your work as files.',
        'info',
        5000
    );
};

/**
 * Get browser capabilities
 */
ErrorHandler.prototype.getBrowserCapabilities = function() {
    return this.state.browserCapabilities;
};

/**
 * Check if feature is supported
 */
ErrorHandler.prototype.isFeatureSupported = function(feature) {
    return this.state.browserCapabilities && this.state.browserCapabilities[feature];
};

/**
 * Clean up resources
 */
ErrorHandler.prototype.destroy = function() {
    if (!this.initialized) return;
    
    // Clear all notifications
    this.state.activeNotifications.forEach(function(notification) {
        DOMUtils.removeElement(notification);
    });
    
    // Remove DOM elements
    DOMUtils.removeElement(this.elements.notificationContainer);
    DOMUtils.removeElement(this.elements.loadingOverlay);
    
    // Clear state
    this.state.activeNotifications = [];
    this.state.loadingStates.clear();
    this.state.errorCounts.clear();
    
    this.initialized = false;
    console.log('ErrorHandler destroyed');
};