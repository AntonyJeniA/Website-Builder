/**
 * DOMUtils - Utility functions for DOM manipulation and element creation
 * 
 * Provides a collection of utility functions for common DOM operations,
 * element creation, and manipulation tasks used throughout the application.
 */

var DOMUtils = {
    
    /**
     * Create a DOM element with specified attributes and content
     * @param {string} tagName - The HTML tag name
     * @param {object} options - Configuration options
     * @param {object} options.attributes - HTML attributes to set
     * @param {object} options.styles - CSS styles to apply
     * @param {string} options.className - CSS class names
     * @param {string} options.textContent - Text content
     * @param {string} options.innerHTML - HTML content
     * @param {HTMLElement} options.parent - Parent element to append to
     * @returns {HTMLElement} The created element
     */
    createElement: function(tagName, options) {
        options = options || {};
        
        if (!tagName || typeof tagName !== 'string') {
            throw new Error('Tag name is required and must be a string');
        }
        
        var element = document.createElement(tagName);
        
        // Set attributes
        if (options.attributes) {
            for (var attr in options.attributes) {
                if (options.attributes.hasOwnProperty(attr)) {
                    element.setAttribute(attr, options.attributes[attr]);
                }
            }
        }
        
        // Set CSS class
        if (options.className) {
            element.className = options.className;
        }
        
        // Set styles
        if (options.styles) {
            for (var style in options.styles) {
                if (options.styles.hasOwnProperty(style)) {
                    element.style[style] = options.styles[style];
                }
            }
        }
        
        // Set content
        if (options.textContent) {
            element.textContent = options.textContent;
        } else if (options.innerHTML) {
            element.innerHTML = options.innerHTML;
        }
        
        // Append to parent
        if (options.parent && options.parent.appendChild) {
            options.parent.appendChild(element);
        }
        
        return element;
    },
    
    /**
     * Find elements by selector with optional context
     * @param {string} selector - CSS selector
     * @param {HTMLElement} context - Optional context element (defaults to document)
     * @returns {NodeList} Found elements
     */
    findElements: function(selector, context) {
        context = context || document;
        return context.querySelectorAll(selector);
    },
    
    /**
     * Find a single element by selector with optional context
     * @param {string} selector - CSS selector
     * @param {HTMLElement} context - Optional context element (defaults to document)
     * @returns {HTMLElement|null} Found element or null
     */
    findElement: function(selector, context) {
        context = context || document;
        return context.querySelector(selector);
    },
    
    /**
     * Add CSS class(es) to an element
     * @param {HTMLElement} element - Target element
     * @param {string|string[]} classNames - Class name(s) to add
     */
    addClass: function(element, classNames) {
        if (!element || !element.classList) return;
        
        if (typeof classNames === 'string') {
            classNames = classNames.split(' ');
        }
        
        if (Array.isArray(classNames)) {
            for (var i = 0; i < classNames.length; i++) {
                if (classNames[i].trim()) {
                    element.classList.add(classNames[i].trim());
                }
            }
        }
    },
    
    /**
     * Remove CSS class(es) from an element
     * @param {HTMLElement} element - Target element
     * @param {string|string[]} classNames - Class name(s) to remove
     */
    removeClass: function(element, classNames) {
        if (!element || !element.classList) return;
        
        if (typeof classNames === 'string') {
            classNames = classNames.split(' ');
        }
        
        if (Array.isArray(classNames)) {
            for (var i = 0; i < classNames.length; i++) {
                if (classNames[i].trim()) {
                    element.classList.remove(classNames[i].trim());
                }
            }
        }
    },
    
    /**
     * Toggle CSS class(es) on an element
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name to toggle
     * @param {boolean} force - Optional force add/remove
     * @returns {boolean} True if class is now present
     */
    toggleClass: function(element, className, force) {
        if (!element || !element.classList) return false;
        
        if (typeof force !== 'undefined') {
            return element.classList.toggle(className, force);
        }
        
        return element.classList.toggle(className);
    },
    
    /**
     * Check if element has a CSS class
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name to check
     * @returns {boolean} True if element has the class
     */
    hasClass: function(element, className) {
        if (!element || !element.classList) return false;
        return element.classList.contains(className);
    },
    
    /**
     * Set multiple CSS styles on an element
     * @param {HTMLElement} element - Target element
     * @param {object} styles - Object with style properties
     */
    setStyles: function(element, styles) {
        if (!element || !element.style || !styles) return;
        
        for (var property in styles) {
            if (styles.hasOwnProperty(property)) {
                element.style[property] = styles[property];
            }
        }
    },
    
    /**
     * Get computed style value for an element
     * @param {HTMLElement} element - Target element
     * @param {string} property - CSS property name
     * @returns {string} Computed style value
     */
    getStyle: function(element, property) {
        if (!element) return '';
        
        var computedStyle = window.getComputedStyle(element);
        return computedStyle.getPropertyValue(property);
    },
    
    /**
     * Remove an element from the DOM
     * @param {HTMLElement} element - Element to remove
     */
    removeElement: function(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    },
    
    /**
     * Empty an element (remove all children)
     * @param {HTMLElement} element - Element to empty
     */
    empty: function(element) {
        if (!element) return;
        
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },
    
    /**
     * Get element position relative to the document
     * @param {HTMLElement} element - Target element
     * @returns {object} Object with x, y, width, height properties
     */
    getElementPosition: function(element) {
        if (!element) return { x: 0, y: 0, width: 0, height: 0 };
        
        var rect = element.getBoundingClientRect();
        var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        return {
            x: rect.left + scrollLeft,
            y: rect.top + scrollTop,
            width: rect.width,
            height: rect.height
        };
    },
    
    /**
     * Check if element is visible in viewport
     * @param {HTMLElement} element - Target element
     * @returns {boolean} True if element is visible
     */
    isElementVisible: function(element) {
        if (!element) return false;
        
        var rect = element.getBoundingClientRect();
        var windowHeight = window.innerHeight || document.documentElement.clientHeight;
        var windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= windowHeight &&
            rect.right <= windowWidth
        );
    },
    
    /**
     * Generate a unique ID for elements
     * @param {string} prefix - Optional prefix for the ID
     * @returns {string} Unique ID
     */
    generateUniqueId: function(prefix) {
        prefix = prefix || 'element';
        var timestamp = Date.now();
        var random = Math.floor(Math.random() * 1000);
        return prefix + '-' + timestamp + '-' + random;
    },
    
    /**
     * Sanitize HTML content to prevent XSS
     * @param {string} html - HTML content to sanitize
     * @returns {string} Sanitized HTML
     */
    sanitizeHTML: function(html) {
        if (typeof html !== 'string') return '';
        
        var tempDiv = document.createElement('div');
        tempDiv.textContent = html;
        return tempDiv.innerHTML;
    },
    
    /**
     * Create a document fragment with multiple elements
     * @param {HTMLElement[]} elements - Array of elements to add to fragment
     * @returns {DocumentFragment} Document fragment containing the elements
     */
    createFragment: function(elements) {
        var fragment = document.createDocumentFragment();
        
        if (Array.isArray(elements)) {
            for (var i = 0; i < elements.length; i++) {
                if (elements[i] && elements[i].nodeType) {
                    fragment.appendChild(elements[i]);
                }
            }
        }
        
        return fragment;
    },
    
    /**
     * Debounce function execution
     * @param {function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @param {boolean} immediate - Execute immediately on first call
     * @returns {function} Debounced function
     */
    debounce: function(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this;
            var args = arguments;
            
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            
            if (callNow) func.apply(context, args);
        };
    },
    
    /**
     * Throttle function execution
     * @param {function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {function} Throttled function
     */
    throttle: function(func, limit) {
        var inThrottle;
        return function() {
            var args = arguments;
            var context = this;
            
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(function() {
                    inThrottle = false;
                }, limit);
            }
        };
    },
    
    /**
     * Add event listener with optional delegation
     * @param {HTMLElement} element - Target element
     * @param {string} eventType - Event type (e.g., 'click', 'mouseover')
     * @param {function} handler - Event handler function
     * @param {string} selector - Optional selector for event delegation
     * @param {object} options - Optional event listener options
     */
    addEventListener: function(element, eventType, handler, selector, options) {
        if (!element || !eventType || !handler) return;
        
        if (selector) {
            // Event delegation
            var delegatedHandler = function(event) {
                var target = event.target;
                var delegateTarget = target.closest(selector);
                
                if (delegateTarget && element.contains(delegateTarget)) {
                    handler.call(delegateTarget, event);
                }
            };
            
            element.addEventListener(eventType, delegatedHandler, options);
            return delegatedHandler;
        } else {
            // Direct event listener
            element.addEventListener(eventType, handler, options);
            return handler;
        }
    },
    
    /**
     * Remove event listener
     * @param {HTMLElement} element - Target element
     * @param {string} eventType - Event type
     * @param {function} handler - Event handler function
     * @param {object} options - Optional event listener options
     */
    removeEventListener: function(element, eventType, handler, options) {
        if (element && eventType && handler) {
            element.removeEventListener(eventType, handler, options);
        }
    }
};

// Make DOMUtils available globally
if (typeof window !== 'undefined') {
    window.DOMUtils = DOMUtils;
}