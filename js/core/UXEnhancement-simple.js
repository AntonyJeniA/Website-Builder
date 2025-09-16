/**
 * UXEnhancement - Simplified User Experience Enhancement Module
 * 
 * This is a simplified version that avoids immediate DOM access issues.
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
        console.log('Initializing UX Enhancement (Simple)...');
        
        // Validate dependencies
        if (!this.eventBus) {
            throw new Error('EventBus is required for UXEnhancement');
        }
        
        // Check user preferences
        this.checkUserPreferences();
        
        // Initialize animations (CSS only)
        this.initializeAnimations();
        
        // Set up keyboard shortcuts (delayed)
        this.setupKeyboardShortcuts();
        
        // Initialize tooltips (delayed)
        this.initializeTooltips();
        
        // Set up accessibility features (delayed)
        this.setupAccessibility();
        
        // Set up event listeners
        this.setupEventListeners();
        
        this.initialized = true;
        console.log('UX Enhancement (Simple) initialized successfully');
        
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
};

/**
 * Initialize smooth animations and transitions (CSS only)
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
    
    console.log('CSS animations initialized');
};

/**
 * Set up keyboard shortcuts (delayed until DOM is ready)
 */
UXEnhancement.prototype.setupKeyboardShortcuts = function() {
    var self = this;
    
    // Register shortcuts but don't set up listeners yet
    this.registerShortcut('ctrl+s', 'Save project', function(e) {
        e.preventDefault();
        self.eventBus.emit('action:save');
        console.log('Save shortcut triggered');
    });
    
    this.registerShortcut('ctrl+o', 'Open project', function(e) {
        e.preventDefault();
        self.eventBus.emit('action:load');
        console.log('Open shortcut triggered');
    });
    
    this.registerShortcut('ctrl+e', 'Export project', function(e) {
        e.preventDefault();
        self.eventBus.emit('action:export');
        console.log('Export shortcut triggered');
    });
    
    this.registerShortcut('f1', 'Show help', function(e) {
        e.preventDefault();
        console.log('Help shortcut triggered');
    });
    
    this.registerShortcut('escape', 'Deselect/Exit', function(e) {
        self.eventBus.emit('action:deselect');
    });
    
    // Set up keyboard listener when DOM is ready
    var setupKeyboardListener = function() {
        document.addEventListener('keydown', function(e) {
            self.handleKeyDown(e);
        });
        console.log('Keyboard shortcuts activated');
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupKeyboardListener);
    } else {
        setupKeyboardListener();
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
        .replace(/cmd/g, 'ctrl')
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
 * Initialize tooltips system (delayed)
 */
UXEnhancement.prototype.initializeTooltips = function() {
    var self = this;
    
    var setupTooltips = function() {
        // Simple tooltip setup - just log for now
        console.log('Tooltips system ready');
        
        // Set up basic tooltip event listeners
        document.addEventListener('mouseover', function(e) {
            var element = e.target.closest('[data-tooltip]');
            if (element) {
                console.log('Tooltip hover:', element.getAttribute('data-tooltip'));
            }
        });
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupTooltips);
    } else {
        setupTooltips();
    }
};

/**
 * Set up accessibility features (delayed)
 */
UXEnhancement.prototype.setupAccessibility = function() {
    var self = this;
    
    var setupA11y = function() {
        console.log('Accessibility features ready');
        
        // Create live region for announcements
        var liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'vwb-announcements';
        document.body.appendChild(liveRegion);
        
        self.liveRegion = liveRegion;
        console.log('Screen reader live region created');
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupA11y);
    } else {
        setupA11y();
    }
};

/**
 * Set up event listeners
 */
UXEnhancement.prototype.setupEventListeners = function() {
    var self = this;
    
    // Listen for application events
    this.eventBus.on('app:initialized', function() {
        console.log('UX Enhancement: App initialized');
    });
    
    console.log('UX Enhancement event listeners set up');
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
 * Clean up resources
 */
UXEnhancement.prototype.destroy = function() {
    if (!this.initialized) return;
    
    // Clear shortcuts
    this.shortcuts.clear();
    
    // Remove live region
    if (this.liveRegion && this.liveRegion.parentNode) {
        this.liveRegion.parentNode.removeChild(this.liveRegion);
    }
    
    // Reset state
    this.initialized = false;
    
    console.log('UX Enhancement (Simple) destroyed');
};