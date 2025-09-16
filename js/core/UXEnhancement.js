/**
 * UXEnhancement - User Experience Enhancement Module
 * 
 * This module handles UI polish, animations, keyboard shortcuts,
 * tooltips, accessibility features, and visual enhancements.
 */

function UXEnhancement(eventBus) {
    this.eventBus = eventBus;
    this.initialized = false;
    
    // Animation settings
    this.animations = {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        reducedMotion: false
    };
    
    // Keyboard shortcuts registry
    this.shortcuts = new Map();
    
    // Tooltip instances
    this.tooltips = new Map();
    
    // Focus management
    this.focusHistory = [];
    this.currentFocusIndex = -1;
    
    // Accessibility settings
    this.a11y = {
        announcements: true,
        highContrast: false,
        reducedMotion: false
    };
}

/**
 * Initialize the UX enhancement system
 */
UXEnhancement.prototype.init = function() {
    if (this.initialized) {
        console.warn('UXEnhancement already initialized');
        return;
    }

    try {
        console.log('Initializing UX Enhancement...');
        
        // Validate dependencies
        if (!this.eventBus) {
            throw new Error('EventBus is required for UXEnhancement');
        }
        
        // Check user preferences
        this.checkUserPreferences();
        
        // Initialize animations
        this.initializeAnimations();
        
        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Initialize tooltips
        this.initializeTooltips();
        
        // Set up accessibility features
        this.setupAccessibility();
        
        // Add visual polish
        this.addVisualPolish();
        
        // Set up event listeners
        this.setupEventListeners();
        
        this.initialized = true;
        console.log('UX Enhancement initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize UX Enhancement:', error);
        throw error;
    }
};

/**
 * Check user preferences for accessibility and motion
 */
UXEnhancement.prototype.checkUserPreferences = function() {
    // Check for reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.animations.reducedMotion = true;
        this.a11y.reducedMotion = true;
        console.log('Reduced motion preference detected');
    }
    
    // Check for high contrast preference
    if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
        this.a11y.highContrast = true;
        console.log('High contrast preference detected');
    }
    
    // Listen for preference changes
    var self = this;
    if (window.matchMedia) {
        var reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        reducedMotionQuery.addListener(function(e) {
            self.animations.reducedMotion = e.matches;
            self.a11y.reducedMotion = e.matches;
            self.updateAnimationSettings();
        });
        
        var highContrastQuery = window.matchMedia('(prefers-contrast: high)');
        highContrastQuery.addListener(function(e) {
            self.a11y.highContrast = e.matches;
            self.updateContrastSettings();
        });
    }
};

/**
 * Initialize smooth animations and transitions
 */
UXEnhancement.prototype.initializeAnimations = function() {
    // Add CSS custom properties for consistent animations
    var root = document.documentElement;
    
    if (!this.animations.reducedMotion) {
        root.style.setProperty('--vwb-transition-fast', '0.15s ' + this.animations.easing);
        root.style.setProperty('--vwb-transition-normal', '0.3s ' + this.animations.easing);
        root.style.setProperty('--vwb-transition-slow', '0.5s ' + this.animations.easing);
    } else {
        // Disable animations for reduced motion
        root.style.setProperty('--vwb-transition-fast', '0s');
        root.style.setProperty('--vwb-transition-normal', '0s');
        root.style.setProperty('--vwb-transition-slow', '0s');
    }
    
    // Add animation classes to existing elements (with DOM ready check)
    var self = this;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            self.enhanceExistingElements();
        });
    } else {
        this.enhanceExistingElements();
    }
};

/**
 * Enhance existing elements with animations
 */
UXEnhancement.prototype.enhanceExistingElements = function() {
    // Add smooth transitions to buttons
    var buttons = document.querySelectorAll('.btn, .viewport-btn, .element-item');
    for (var i = 0; i < buttons.length; i++) {
        this.addSmoothTransition(buttons[i]);
    }
    
    // Add transitions to panels
    var panels = document.querySelectorAll('.left-panel, .right-panel, .center-panel');
    for (var i = 0; i < panels.length; i++) {
        this.addSmoothTransition(panels[i], 'transform, opacity');
    }
    
    // Add transitions to property controls
    var controls = document.querySelectorAll('.property-input, .property-select, .property-textarea');
    for (var i = 0; i < controls.length; i++) {
        this.addSmoothTransition(controls[i], 'border-color, box-shadow, background-color');
    }
};

/**
 * Add smooth transition to an element
 */
UXEnhancement.prototype.addSmoothTransition = function(element, properties) {
    if (!element || this.animations.reducedMotion) return;
    
    properties = properties || 'all';
    element.style.transition = properties + ' var(--vwb-transition-normal)';
};

/**
 * Set up keyboard shortcuts
 */
UXEnhancement.prototype.setupKeyboardShortcuts = function() {
    var self = this;
    
    // Register common shortcuts
    this.registerShortcut('ctrl+s', 'Save project', function(e) {
        e.preventDefault();
        self.eventBus.emit('action:save');
        self.showShortcutFeedback('Project saved');
    });
    
    this.registerShortcut('ctrl+shift+s', 'Save as...', function(e) {
        e.preventDefault();
        self.eventBus.emit('action:save-as');
        self.showShortcutFeedback('Save as...');
    });
    
    this.registerShortcut('ctrl+o', 'Open project', function(e) {
        e.preventDefault();
        self.eventBus.emit('action:load');
        self.showShortcutFeedback('Open project');
    });
    
    this.registerShortcut('ctrl+e', 'Export project', function(e) {
        e.preventDefault();
        self.eventBus.emit('action:export');
        self.showShortcutFeedback('Export project');
    });
    
    this.registerShortcut('ctrl+shift+p', 'Preview in new window', function(e) {
        e.preventDefault();
        self.eventBus.emit('action:preview-window');
        self.showShortcutFeedback('Opening preview...');
    });
    
    this.registerShortcut('f5', 'Toggle demo mode', function(e) {
        e.preventDefault();
        self.eventBus.emit('action:demo-toggle');
        self.showShortcutFeedback('Demo mode toggled');
    });
    
    this.registerShortcut('escape', 'Deselect/Exit', function(e) {
        self.eventBus.emit('action:deselect');
    });
    
    this.registerShortcut('delete', 'Delete selected element', function(e) {
        self.eventBus.emit('action:delete-selected');
        self.showShortcutFeedback('Element deleted');
    });
    
    this.registerShortcut('ctrl+z', 'Undo', function(e) {
        e.preventDefault();
        self.eventBus.emit('action:undo');
        self.showShortcutFeedback('Undo');
    });
    
    this.registerShortcut('ctrl+y', 'Redo', function(e) {
        e.preventDefault();
        self.eventBus.emit('action:redo');
        self.showShortcutFeedback('Redo');
    });
    
    this.registerShortcut('ctrl+d', 'Duplicate selected element', function(e) {
        e.preventDefault();
        self.eventBus.emit('action:duplicate-selected');
        self.showShortcutFeedback('Element duplicated');
    });
    
    // Viewport shortcuts
    this.registerShortcut('ctrl+1', 'Desktop viewport', function(e) {
        e.preventDefault();
        self.eventBus.emit('viewport:change', { viewport: 'desktop' });
        self.showShortcutFeedback('Desktop viewport');
    });
    
    this.registerShortcut('ctrl+2', 'Tablet viewport', function(e) {
        e.preventDefault();
        self.eventBus.emit('viewport:change', { viewport: 'tablet' });
        self.showShortcutFeedback('Tablet viewport');
    });
    
    this.registerShortcut('ctrl+3', 'Mobile viewport', function(e) {
        e.preventDefault();
        self.eventBus.emit('viewport:change', { viewport: 'mobile' });
        self.showShortcutFeedback('Mobile viewport');
    });
    
    // Help shortcut
    this.registerShortcut('f1', 'Show help', function(e) {
        e.preventDefault();
        self.showKeyboardShortcutsHelp();
    });
    
    // Set up global keyboard listener
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            document.addEventListener('keydown', function(e) {
                self.handleKeyDown(e);
            });
        });
    } else {
        document.addEventListener('keydown', function(e) {
            self.handleKeyDown(e);
        });
    }
    
    console.log('Registered ' + this.shortcuts.size + ' keyboard shortcuts');
};

/**
 * Register a keyboard shortcut
 */
UXEnhancement.prototype.registerShortcut = function(keys, description, callback) {
    var normalizedKeys = this.normalizeShortcut(keys);
    this.shortcuts.set(normalizedKeys, {
        keys: keys,
        description: description,
        callback: callback
    });
};

/**
 * Normalize shortcut key combination
 */
UXEnhancement.prototype.normalizeShortcut = function(keys) {
    return keys.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/cmd/g, 'ctrl') // Normalize Cmd to Ctrl
        .split('+')
        .sort()
        .join('+');
};

/**
 * Handle keydown events
 */
UXEnhancement.prototype.handleKeyDown = function(event) {
    // Don't handle shortcuts when typing in inputs
    if (event.target.matches('input, textarea, [contenteditable]')) {
        return;
    }
    
    var keys = [];
    
    if (event.ctrlKey || event.metaKey) keys.push('ctrl');
    if (event.shiftKey) keys.push('shift');
    if (event.altKey) keys.push('alt');
    
    var key = event.key.toLowerCase();
    if (key !== 'control' && key !== 'shift' && key !== 'alt' && key !== 'meta') {
        keys.push(key);
    }
    
    var shortcut = keys.sort().join('+');
    var handler = this.shortcuts.get(shortcut);
    
    if (handler) {
        handler.callback(event);
    }
};

/**
 * Show shortcut feedback
 */
UXEnhancement.prototype.showShortcutFeedback = function(message) {
    this.showToast(message, 'info', 1500);
};

/**
 * Initialize tooltips system
 */
UXEnhancement.prototype.initializeTooltips = function() {
    var self = this;
    
    // Add tooltips to existing elements with title attributes (with DOM ready check)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            self.addTooltipsToExistingElements();
        });
    } else {
        this.addTooltipsToExistingElements();
    }
    
    // Set up tooltip event listeners
    document.addEventListener('mouseover', function(e) {
        self.handleTooltipMouseOver(e);
    });
    
    document.addEventListener('mouseout', function(e) {
        self.handleTooltipMouseOut(e);
    });
    
    document.addEventListener('focus', function(e) {
        self.handleTooltipFocus(e);
    }, true);
    
    document.addEventListener('blur', function(e) {
        self.handleTooltipBlur(e);
    }, true);
};

/**
 * Add tooltips to existing elements
 */
UXEnhancement.prototype.addTooltipsToExistingElements = function() {
    // Add tooltips to buttons
    var buttons = [
        { selector: '#save-btn', text: 'Save project (Ctrl+S)' },
        { selector: '#load-btn', text: 'Open project (Ctrl+O)' },
        { selector: '#export-btn', text: 'Export HTML/CSS (Ctrl+E)' },
        { selector: '#demo-btn', text: 'Toggle demo mode (F5)' },
        { selector: '#preview-window-btn', text: 'Open preview in new window (Ctrl+Shift+P)' }
    ];
    
    for (var i = 0; i < buttons.length; i++) {
        var btn = document.querySelector(buttons[i].selector);
        if (btn) {
            this.addTooltip(btn, buttons[i].text);
        }
    }
    
    // Add tooltips to viewport buttons
    var viewportButtons = document.querySelectorAll('.viewport-btn');
    for (var i = 0; i < viewportButtons.length; i++) {
        var btn = viewportButtons[i];
        var viewport = btn.dataset.viewport;
        var shortcut = viewport === 'desktop' ? 'Ctrl+1' : viewport === 'tablet' ? 'Ctrl+2' : 'Ctrl+3';
        this.addTooltip(btn, 'Switch to ' + viewport + ' view (' + shortcut + ')');
    }
    
    // Add tooltips to element library items
    var elementItems = document.querySelectorAll('.element-item');
    for (var i = 0; i < elementItems.length; i++) {
        var item = elementItems[i];
        var name = item.querySelector('.element-name');
        var description = item.querySelector('.element-description');
        if (name && description) {
            this.addTooltip(item, 'Drag to add ' + name.textContent + ' - ' + description.textContent);
        }
    }
};

/**
 * Add tooltip to an element
 */
UXEnhancement.prototype.addTooltip = function(element, text, options) {
    if (!element || !text) return;
    
    options = options || {};
    
    element.setAttribute('data-tooltip', text);
    element.setAttribute('data-tooltip-position', options.position || 'top');
    
    // Add ARIA label for accessibility
    if (!element.getAttribute('aria-label')) {
        element.setAttribute('aria-label', text);
    }
};

/**
 * Handle tooltip mouse over
 */
UXEnhancement.prototype.handleTooltipMouseOver = function(event) {
    var element = event.target.closest('[data-tooltip]');
    if (element && !this.tooltips.has(element)) {
        this.showTooltip(element);
    }
};

/**
 * Handle tooltip mouse out
 */
UXEnhancement.prototype.handleTooltipMouseOut = function(event) {
    var element = event.target.closest('[data-tooltip]');
    if (element) {
        this.hideTooltip(element);
    }
};

/**
 * Handle tooltip focus
 */
UXEnhancement.prototype.handleTooltipFocus = function(event) {
    var element = event.target.closest('[data-tooltip]');
    if (element && !this.tooltips.has(element)) {
        this.showTooltip(element);
    }
};

/**
 * Handle tooltip blur
 */
UXEnhancement.prototype.handleTooltipBlur = function(event) {
    var element = event.target.closest('[data-tooltip]');
    if (element) {
        this.hideTooltip(element);
    }
};

/**
 * Show tooltip
 */
UXEnhancement.prototype.showTooltip = function(element) {
    var text = element.getAttribute('data-tooltip');
    var position = element.getAttribute('data-tooltip-position') || 'top';
    
    if (!text) return;
    
    var tooltip = document.createElement('div');
    tooltip.className = 'vwb-tooltip vwb-tooltip-' + position;
    tooltip.textContent = text;
    tooltip.setAttribute('role', 'tooltip');
    tooltip.setAttribute('id', 'tooltip-' + Date.now());
    
    // Position tooltip
    this.positionTooltip(tooltip, element, position);
    
    // Add to DOM
    document.body.appendChild(tooltip);
    
    // Store reference
    this.tooltips.set(element, tooltip);
    
    // Add ARIA reference
    element.setAttribute('aria-describedby', tooltip.id);
    
    // Animate in
    if (!this.animations.reducedMotion) {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateY(' + (position === 'top' ? '10px' : '-10px') + ')';
        
        setTimeout(function() {
            tooltip.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0)';
        }, 10);
    }
};

/**
 * Position tooltip relative to element
 */
UXEnhancement.prototype.positionTooltip = function(tooltip, element, position) {
    var rect = element.getBoundingClientRect();
    var tooltipRect = { width: 200, height: 32 }; // Estimated size
    
    var styles = {
        position: 'fixed',
        zIndex: '10001',
        backgroundColor: 'rgba(44, 62, 80, 0.95)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        backdropFilter: 'blur(4px)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
    };
    
    switch (position) {
        case 'top':
            styles.left = (rect.left + rect.width / 2) + 'px';
            styles.top = (rect.top - 8) + 'px';
            styles.transform = 'translateX(-50%) translateY(-100%)';
            break;
        case 'bottom':
            styles.left = (rect.left + rect.width / 2) + 'px';
            styles.top = (rect.bottom + 8) + 'px';
            styles.transform = 'translateX(-50%)';
            break;
        case 'left':
            styles.left = (rect.left - 8) + 'px';
            styles.top = (rect.top + rect.height / 2) + 'px';
            styles.transform = 'translateX(-100%) translateY(-50%)';
            break;
        case 'right':
            styles.left = (rect.right + 8) + 'px';
            styles.top = (rect.top + rect.height / 2) + 'px';
            styles.transform = 'translateY(-50%)';
            break;
    }
    
    Object.assign(tooltip.style, styles);
};

/**
 * Hide tooltip
 */
UXEnhancement.prototype.hideTooltip = function(element) {
    var tooltip = this.tooltips.get(element);
    if (!tooltip) return;
    
    // Remove ARIA reference
    element.removeAttribute('aria-describedby');
    
    // Animate out and remove
    if (!this.animations.reducedMotion) {
        tooltip.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateY(' + (tooltip.classList.contains('vwb-tooltip-top') ? '10px' : '-10px') + ')';
        
        setTimeout(function() {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }, 200);
    } else {
        if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
        }
    }
    
    this.tooltips.delete(element);
};

/**
 * Set up accessibility features
 */
UXEnhancement.prototype.setupAccessibility = function() {
    var self = this;
    
    // Add ARIA labels and roles (with DOM ready check)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            self.addAriaLabels();
            self.setupKeyboardNavigation();
        });
    } else {
        this.addAriaLabels();
        this.setupKeyboardNavigation();
    }
    
    // Add screen reader announcements
    this.setupScreenReaderAnnouncements();
    
    // Set up focus management
    this.setupFocusManagement();
};

/**
 * Add ARIA labels and roles
 */
UXEnhancement.prototype.addAriaLabels = function() {
    // Main application
    var appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.setAttribute('role', 'application');
        appContainer.setAttribute('aria-label', 'Visual Web Builder');
    }
    
    // Header
    var header = document.querySelector('.app-header');
    if (header) {
        header.setAttribute('role', 'banner');
        header.setAttribute('aria-label', 'Application header');
    }
    
    // Main content
    var mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.setAttribute('role', 'main');
        mainContent.setAttribute('aria-label', 'Main workspace');
    }
    
    // Left panel
    var leftPanel = document.querySelector('.left-panel');
    if (leftPanel) {
        leftPanel.setAttribute('role', 'complementary');
        leftPanel.setAttribute('aria-label', 'Element library');
    }
    
    // Canvas
    var canvas = document.querySelector('#main-canvas');
    if (canvas) {
        canvas.setAttribute('role', 'region');
        canvas.setAttribute('aria-label', 'Design canvas');
        canvas.setAttribute('tabindex', '0');
    }
    
    // Right panel
    var rightPanel = document.querySelector('.right-panel');
    if (rightPanel) {
        rightPanel.setAttribute('role', 'complementary');
        rightPanel.setAttribute('aria-label', 'Property editor');
    }
    
    // Buttons
    var buttons = [
        { selector: '#save-btn', label: 'Save project' },
        { selector: '#load-btn', label: 'Load project' },
        { selector: '#export-btn', label: 'Export project' },
        { selector: '#demo-btn', label: 'Toggle demo mode' },
        { selector: '#preview-window-btn', label: 'Open preview window' }
    ];
    
    for (var i = 0; i < buttons.length; i++) {
        var btn = document.querySelector(buttons[i].selector);
        if (btn && !btn.getAttribute('aria-label')) {
            btn.setAttribute('aria-label', buttons[i].label);
        }
    }
    
    // Viewport controls
    var viewportButtons = document.querySelectorAll('.viewport-btn');
    for (var i = 0; i < viewportButtons.length; i++) {
        var btn = viewportButtons[i];
        var viewport = btn.dataset.viewport;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-label', 'Switch to ' + viewport + ' viewport');
    }
    
    // Element library items
    var elementItems = document.querySelectorAll('.element-item');
    for (var i = 0; i < elementItems.length; i++) {
        var item = elementItems[i];
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        
        var name = item.querySelector('.element-name');
        if (name && !item.getAttribute('aria-label')) {
            item.setAttribute('aria-label', 'Add ' + name.textContent + ' element');
        }
    }
};

/**
 * Set up keyboard navigation
 */
UXEnhancement.prototype.setupKeyboardNavigation = function() {
    var self = this;
    
    // Make element library items keyboard accessible
    var elementItems = document.querySelectorAll('.element-item');
    for (var i = 0; i < elementItems.length; i++) {
        elementItems[i].addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Simulate click for keyboard users
                self.eventBus.emit('element:keyboard-select', {
                    element: this,
                    elementType: this.dataset.elementType
                });
            }
        });
    }
    
    // Canvas keyboard navigation
    var canvas = document.querySelector('#main-canvas');
    if (canvas) {
        canvas.addEventListener('keydown', function(e) {
            self.handleCanvasKeyNavigation(e);
        });
    }
    
    // Tab trap for modal dialogs (if any)
    this.setupTabTrapping();
};

/**
 * Handle canvas keyboard navigation
 */
UXEnhancement.prototype.handleCanvasKeyNavigation = function(event) {
    var canvas = event.target;
    
    switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
            event.preventDefault();
            this.eventBus.emit('canvas:keyboard-navigate', {
                direction: event.key.replace('Arrow', '').toLowerCase(),
                shiftKey: event.shiftKey,
                ctrlKey: event.ctrlKey
            });
            break;
        
        case 'Enter':
            event.preventDefault();
            this.eventBus.emit('canvas:keyboard-activate');
            break;
        
        case 'Tab':
            // Allow natural tab navigation
            break;
    }
};

/**
 * Set up tab trapping for modals
 */
UXEnhancement.prototype.setupTabTrapping = function() {
    // This will be used when modal dialogs are implemented
    console.log('Tab trapping setup ready for modal dialogs');
};

/**
 * Set up screen reader announcements
 */
UXEnhancement.prototype.setupScreenReaderAnnouncements = function() {
    var self = this;
    
    // Create live region for announcements
    var liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'vwb-announcements';
    document.body.appendChild(liveRegion);
    
    this.liveRegion = liveRegion;
    
    // Listen for events that should be announced
    this.eventBus.on('element:created', function(data) {
        self.announce('Added ' + data.elementType + ' element to canvas');
    });
    
    this.eventBus.on('element:selected', function(data) {
        self.announce('Selected ' + data.elementType + ' element');
    });
    
    this.eventBus.on('element:deleted', function(data) {
        self.announce('Deleted ' + data.elementType + ' element');
    });
    
    this.eventBus.on('viewport:changed', function(data) {
        self.announce('Switched to ' + data.viewport + ' viewport');
    });
    
    this.eventBus.on('demo:toggled', function(data) {
        self.announce(data.isDemoMode ? 'Demo mode enabled' : 'Demo mode disabled');
    });
};

/**
 * Announce message to screen readers
 */
UXEnhancement.prototype.announce = function(message) {
    if (!this.a11y.announcements || !this.liveRegion) return;
    
    this.liveRegion.textContent = message;
    
    // Clear after announcement
    setTimeout(function() {
        if (this.liveRegion) {
            this.liveRegion.textContent = '';
        }
    }.bind(this), 1000);
};

/**
 * Set up focus management
 */
UXEnhancement.prototype.setupFocusManagement = function() {
    var self = this;
    
    // Track focus changes
    document.addEventListener('focusin', function(e) {
        self.handleFocusIn(e);
    });
    
    document.addEventListener('focusout', function(e) {
        self.handleFocusOut(e);
    });
    
    // Restore focus when needed
    this.eventBus.on('focus:restore', function(data) {
        self.restoreFocus(data.element);
    });
};

/**
 * Handle focus in events
 */
UXEnhancement.prototype.handleFocusIn = function(event) {
    var element = event.target;
    
    // Add focus history
    this.focusHistory.push(element);
    if (this.focusHistory.length > 10) {
        this.focusHistory.shift();
    }
    
    // Add visual focus indicator if needed
    if (element.matches('.vwb-canvas-element')) {
        element.classList.add('vwb-keyboard-focus');
    }
};

/**
 * Handle focus out events
 */
UXEnhancement.prototype.handleFocusOut = function(event) {
    var element = event.target;
    
    // Remove visual focus indicator
    if (element.matches('.vwb-canvas-element')) {
        element.classList.remove('vwb-keyboard-focus');
    }
};

/**
 * Restore focus to an element
 */
UXEnhancement.prototype.restoreFocus = function(element) {
    if (element && typeof element.focus === 'function') {
        element.focus();
    } else if (this.focusHistory.length > 0) {
        var lastFocused = this.focusHistory[this.focusHistory.length - 1];
        if (lastFocused && typeof lastFocused.focus === 'function') {
            lastFocused.focus();
        }
    }
};

/**
 * Add visual polish
 */
UXEnhancement.prototype.addVisualPolish = function() {
    // Add loading states
    this.addLoadingStates();
    
    // Add hover effects
    this.addHoverEffects();
    
    // Add focus indicators
    this.addFocusIndicators();
    
    // Add micro-interactions
    this.addMicroInteractions();
};

/**
 * Add loading states
 */
UXEnhancement.prototype.addLoadingStates = function() {
    var self = this;
    
    // Listen for loading events
    this.eventBus.on('loading:start', function(data) {
        self.showLoadingState(data.element, data.message);
    });
    
    this.eventBus.on('loading:end', function(data) {
        self.hideLoadingState(data.element);
    });
};

/**
 * Show loading state
 */
UXEnhancement.prototype.showLoadingState = function(element, message) {
    if (!element) return;
    
    element.classList.add('vwb-loading');
    element.setAttribute('aria-busy', 'true');
    
    if (message) {
        element.setAttribute('aria-label', message);
    }
    
    // Add loading spinner if it's a button
    if (element.matches('button')) {
        var originalText = element.textContent;
        element.dataset.originalText = originalText;
        element.innerHTML = '<span class="vwb-spinner"></span> ' + (message || 'Loading...');
    }
};

/**
 * Hide loading state
 */
UXEnhancement.prototype.hideLoadingState = function(element) {
    if (!element) return;
    
    element.classList.remove('vwb-loading');
    element.removeAttribute('aria-busy');
    
    // Restore button text
    if (element.matches('button') && element.dataset.originalText) {
        element.textContent = element.dataset.originalText;
        delete element.dataset.originalText;
    }
};

/**
 * Add hover effects
 */
UXEnhancement.prototype.addHoverEffects = function() {
    // Enhanced hover effects are handled via CSS
    // This method can be extended for JavaScript-based hover effects
    console.log('Enhanced hover effects applied via CSS');
};

/**
 * Add focus indicators
 */
UXEnhancement.prototype.addFocusIndicators = function() {
    // Enhanced focus indicators are handled via CSS and event listeners
    // This ensures keyboard users have clear visual feedback
    console.log('Enhanced focus indicators applied');
};

/**
 * Add micro-interactions
 */
UXEnhancement.prototype.addMicroInteractions = function() {
    var self = this;
    
    // Button click feedback
    document.addEventListener('click', function(e) {
        if (e.target.matches('button, .btn')) {
            self.addClickFeedback(e.target);
        }
    });
    
    // Element drop feedback
    this.eventBus.on('element:dropped', function(data) {
        self.addDropFeedback(data.element);
    });
};

/**
 * Add click feedback animation
 */
UXEnhancement.prototype.addClickFeedback = function(element) {
    if (this.animations.reducedMotion) return;
    
    element.style.transform = 'scale(0.95)';
    
    setTimeout(function() {
        element.style.transform = '';
    }, 150);
};

/**
 * Add drop feedback animation
 */
UXEnhancement.prototype.addDropFeedback = function(element) {
    if (this.animations.reducedMotion || !element) return;
    
    element.style.animation = 'vwb-drop-feedback 0.5s ease-out';
    
    setTimeout(function() {
        element.style.animation = '';
    }, 500);
};

/**
 * Show keyboard shortcuts help
 */
UXEnhancement.prototype.showKeyboardShortcutsHelp = function() {
    var helpContent = this.generateShortcutsHelpContent();
    this.showModal('Keyboard Shortcuts', helpContent);
};

/**
 * Generate shortcuts help content
 */
UXEnhancement.prototype.generateShortcutsHelpContent = function() {
    var shortcuts = Array.from(this.shortcuts.values());
    var html = '<div class="vwb-shortcuts-help">';
    
    var categories = {
        'File Operations': ['save', 'open', 'export'],
        'View Controls': ['preview', 'demo', 'viewport'],
        'Element Operations': ['delete', 'duplicate', 'undo', 'redo'],
        'Navigation': ['deselect', 'help']
    };
    
    for (var category in categories) {
        html += '<div class="vwb-shortcut-category">';
        html += '<h3>' + category + '</h3>';
        html += '<ul>';
        
        for (var i = 0; i < shortcuts.length; i++) {
            var shortcut = shortcuts[i];
            var keys = shortcut.keys.toUpperCase().replace(/CTRL/g, 'Ctrl').replace(/SHIFT/g, 'Shift');
            
            html += '<li>';
            html += '<span class="vwb-shortcut-keys">' + keys + '</span>';
            html += '<span class="vwb-shortcut-desc">' + shortcut.description + '</span>';
            html += '</li>';
        }
        
        html += '</ul>';
        html += '</div>';
    }
    
    html += '</div>';
    return html;
};

/**
 * Show modal dialog
 */
UXEnhancement.prototype.showModal = function(title, content) {
    var modal = document.createElement('div');
    modal.className = 'vwb-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'modal-title');
    modal.setAttribute('aria-modal', 'true');
    
    modal.innerHTML = 
        '<div class="vwb-modal-backdrop"></div>' +
        '<div class="vwb-modal-content">' +
            '<div class="vwb-modal-header">' +
                '<h2 id="modal-title">' + title + '</h2>' +
                '<button class="vwb-modal-close" aria-label="Close dialog">&times;</button>' +
            '</div>' +
            '<div class="vwb-modal-body">' + content + '</div>' +
        '</div>';
    
    document.body.appendChild(modal);
    
    // Focus management
    var closeBtn = modal.querySelector('.vwb-modal-close');
    closeBtn.focus();
    
    // Event listeners
    var self = this;
    closeBtn.addEventListener('click', function() {
        self.closeModal(modal);
    });
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal || e.target.classList.contains('vwb-modal-backdrop')) {
            self.closeModal(modal);
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            self.closeModal(modal);
        }
    });
    
    return modal;
};

/**
 * Close modal dialog
 */
UXEnhancement.prototype.closeModal = function(modal) {
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
    }
};

/**
 * Show toast notification
 */
UXEnhancement.prototype.showToast = function(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;
    
    var toast = document.createElement('div');
    toast.className = 'vwb-toast vwb-toast-' + type;
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    
    document.body.appendChild(toast);
    
    // Animate in
    if (!this.animations.reducedMotion) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        
        setTimeout(function() {
            toast.style.transition = 'all 0.3s ease';
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 10);
    }
    
    // Auto remove
    setTimeout(function() {
        if (toast.parentNode) {
            if (!this.animations.reducedMotion) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-20px)';
                setTimeout(function() {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            } else {
                toast.parentNode.removeChild(toast);
            }
        }
    }.bind(this), duration);
    
    return toast;
};

/**
 * Set up event listeners
 */
UXEnhancement.prototype.setupEventListeners = function() {
    var self = this;
    
    // Listen for application events
    this.eventBus.on('app:initialized', function() {
        self.announce('Visual Web Builder loaded and ready');
    });
    
    // Update animations when preferences change
    this.eventBus.on('preferences:changed', function(data) {
        if (data.reducedMotion !== undefined) {
            self.animations.reducedMotion = data.reducedMotion;
            self.updateAnimationSettings();
        }
    });
};

/**
 * Update animation settings
 */
UXEnhancement.prototype.updateAnimationSettings = function() {
    var root = document.documentElement;
    
    if (this.animations.reducedMotion) {
        root.style.setProperty('--vwb-transition-fast', '0s');
        root.style.setProperty('--vwb-transition-normal', '0s');
        root.style.setProperty('--vwb-transition-slow', '0s');
    } else {
        root.style.setProperty('--vwb-transition-fast', '0.15s ' + this.animations.easing);
        root.style.setProperty('--vwb-transition-normal', '0.3s ' + this.animations.easing);
        root.style.setProperty('--vwb-transition-slow', '0.5s ' + this.animations.easing);
    }
};

/**
 * Update contrast settings
 */
UXEnhancement.prototype.updateContrastSettings = function() {
    var body = document.body;
    
    if (this.a11y.highContrast) {
        body.classList.add('vwb-high-contrast');
    } else {
        body.classList.remove('vwb-high-contrast');
    }
};

/**
 * Clean up resources
 */
UXEnhancement.prototype.destroy = function() {
    if (!this.initialized) return;
    
    // Clear all tooltips
    this.tooltips.forEach(function(tooltip, element) {
        if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
        }
    });
    this.tooltips.clear();
    
    // Remove live region
    if (this.liveRegion && this.liveRegion.parentNode) {
        this.liveRegion.parentNode.removeChild(this.liveRegion);
    }
    
    // Clear shortcuts
    this.shortcuts.clear();
    
    // Reset state
    this.initialized = false;
    
    console.log('UX Enhancement destroyed');
};