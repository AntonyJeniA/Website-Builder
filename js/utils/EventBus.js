/**
 * EventBus - Simple event system for component communication
 * 
 * Provides a centralized event system that allows components to communicate
 * without direct dependencies on each other.
 */

function EventBus() {
    this.events = {};
}

/**
 * Subscribe to an event
 * @param {string} eventName - Name of the event to listen for
 * @param {function} callback - Function to call when event is emitted
 * @param {object} options - Optional configuration
 * @returns {function} Unsubscribe function
 */
EventBus.prototype.on = function(eventName, callback, options) {
    options = options || {};
    
    if (typeof eventName !== 'string') {
        throw new Error('Event name must be a string');
    }
    
    if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
    }

    if (!this.events[eventName]) {
        this.events[eventName] = [];
    }

    var listener = {
        callback: callback,
        once: options.once || false,
        context: options.context || null
    };

    this.events[eventName].push(listener);

    // Return unsubscribe function
    var self = this;
    return function() {
        self.off(eventName, callback);
    };
};

/**
 * Subscribe to an event that will only fire once
 * @param {string} eventName - Name of the event to listen for
 * @param {function} callback - Function to call when event is emitted
 * @param {object} options - Optional configuration
 * @returns {function} Unsubscribe function
 */
EventBus.prototype.once = function(eventName, callback, options) {
    options = options || {};
    options.once = true;
    return this.on(eventName, callback, options);
};

/**
 * Unsubscribe from an event
 * @param {string} eventName - Name of the event to stop listening for
 * @param {function} callback - The callback function to remove
 */
EventBus.prototype.off = function(eventName, callback) {
    if (!this.events[eventName]) {
        return;
    }

    var listeners = this.events[eventName];
    for (var i = listeners.length - 1; i >= 0; i--) {
        if (listeners[i].callback === callback) {
            listeners.splice(i, 1);
            break;
        }
    }
    
    // Clean up empty event arrays
    if (listeners.length === 0) {
        delete this.events[eventName];
    }
};

/**
 * Remove all listeners for an event, or all events if no event name provided
 * @param {string} eventName - Optional event name to clear
 */
EventBus.prototype.clear = function(eventName) {
    if (eventName) {
        delete this.events[eventName];
    } else {
        this.events = {};
    }
};

/**
 * Emit an event to all subscribers
 * @param {string} eventName - Name of the event to emit
 * @param {*} data - Data to pass to event listeners
 * @returns {boolean} True if event had listeners, false otherwise
 */
EventBus.prototype.emit = function(eventName, data) {
    if (!this.events[eventName]) {
        return false;
    }

    var listeners = this.events[eventName].slice(); // Copy to avoid issues with modifications during iteration
    var hasListeners = false;

    for (var i = 0; i < listeners.length; i++) {
        var listener = listeners[i];
        try {
            // Call the callback with the provided context if available
            if (listener.context) {
                listener.callback.call(listener.context, data);
            } else {
                listener.callback(data);
            }
            
            hasListeners = true;

            // Remove one-time listeners
            if (listener.once) {
                this.off(eventName, listener.callback);
            }
        } catch (error) {
            console.error('Error in event listener for \'' + eventName + '\':', error);
        }
    }

    return hasListeners;
};

/**
 * Get the number of listeners for an event
 * @param {string} eventName - Name of the event
 * @returns {number} Number of listeners
 */
EventBus.prototype.listenerCount = function(eventName) {
    return this.events[eventName] ? this.events[eventName].length : 0;
};

/**
 * Get all event names that have listeners
 * @returns {string[]} Array of event names
 */
EventBus.prototype.eventNames = function() {
    return Object.keys(this.events);
};

/**
 * Get all listeners for an event
 * @param {string} eventName - Name of the event
 * @returns {function[]} Array of callback functions
 */
EventBus.prototype.listeners = function(eventName) {
    if (!this.events[eventName]) {
        return [];
    }
    
    var callbacks = [];
    for (var i = 0; i < this.events[eventName].length; i++) {
        callbacks.push(this.events[eventName][i].callback);
    }
    return callbacks;
};

/**
 * Create a promise that resolves when a specific event is emitted
 * @param {string} eventName - Name of the event to wait for
 * @param {number} timeout - Optional timeout in milliseconds
 * @returns {Promise} Promise that resolves with the event data
 */
EventBus.prototype.waitFor = function(eventName, timeout) {
    var self = this;
    return new Promise(function(resolve, reject) {
        var timeoutId;
        
        var unsubscribe = self.once(eventName, function(data) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            resolve(data);
        });

        if (timeout) {
            timeoutId = setTimeout(function() {
                unsubscribe();
                reject(new Error('Timeout waiting for event \'' + eventName + '\''));
            }, timeout);
        }
    });
};

/**
 * Debug method to log all current event listeners
 */
EventBus.prototype.debug = function() {
    console.group('EventBus Debug Info');
    console.log('Total events:', Object.keys(this.events).length);
    
    for (var eventName in this.events) {
        if (this.events.hasOwnProperty(eventName)) {
            console.log(eventName + ': ' + this.events[eventName].length + ' listener(s)');
        }
    }
    
    console.groupEnd();
};