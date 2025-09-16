/**
 * Visual Web Builder - Main Application Entry Point (Fixed)
 * 
 * This is the main entry point for the Visual Web Builder application.
 * It initializes the core application controller using vanilla JavaScript.
 */

/**
 * Initialize the application when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting Visual Web Builder initialization...');

    try {
        // Validate that all required classes are available
        console.log('Checking dependencies...');

        if (typeof EventBus === 'undefined') {
            throw new Error('EventBus class not found. Make sure js/utils/EventBus.js is loaded.');
        }

        if (typeof DOMUtils === 'undefined') {
            throw new Error('DOMUtils not found. Make sure js/utils/DOMUtils.js is loaded.');
        }

        if (typeof VisualWebBuilder === 'undefined') {
            throw new Error('VisualWebBuilder class not found. Make sure js/core/VisualWebBuilder.js is loaded.');
        }

        console.log('✓ All dependencies found');

        // Validate DOM structure
        console.log('Checking DOM structure...');

        var requiredElements = [
            '.app-container',
            '.app-header',
            '.left-panel',
            '.center-panel',
            '.right-panel',
            '#main-canvas'
        ];

        var missingElements = [];
        for (var i = 0; i < requiredElements.length; i++) {
            if (!document.querySelector(requiredElements[i])) {
                missingElements.push(requiredElements[i]);
            }
        }

        if (missingElements.length > 0) {
            throw new Error('Missing required DOM elements: ' + missingElements.join(', '));
        }

        console.log('✓ DOM structure validated');

        // Initialize the main application
        console.log('Creating VisualWebBuilder instance...');
        var app = new VisualWebBuilder();
        console.log('✓ VisualWebBuilder instance created');

        console.log('Initializing VisualWebBuilder...');
        app.init();
        console.log('✓ VisualWebBuilder initialized successfully');
        
        // Make the app instance globally available for debugging
        window.visualWebBuilder = app;
        
        console.log('🎉 Visual Web Builder initialized successfully!');

        // Show success notification
        setTimeout(function() {
            if (app.showNotification) {
                app.showNotification('Visual Web Builder loaded successfully!', 'success', 3000);
            }
        }, 500);

    } catch (error) {
        console.error('❌ Failed to initialize Visual Web Builder:', error);
        console.error('Error stack:', error.stack);
        
        // Show detailed error message to user
        showInitializationError(error);
    }
});

/**
 * Show initialization error to user
 */
function showInitializationError(error) {
    // Remove any existing error messages
    var existingError = document.querySelector('.vwb-init-error');
    if (existingError) {
        existingError.remove();
    }

    // Create error message element
    var errorContainer = document.createElement('div');
    errorContainer.className = 'vwb-init-error';
    errorContainer.innerHTML =
        '<div class="error-content">' +
            '<h2>🚫 Application Error</h2>' +
            '<p><strong>Failed to initialize the Visual Web Builder.</strong></p>' +
            '<p>Error: ' + (error.message || 'Unknown error') + '</p>' +
            '<div class="error-actions">' +
                '<button onclick="location.reload()" class="btn-reload">🔄 Refresh Page</button>' +
                '<button onclick="toggleErrorDetails()" class="btn-details">📋 Show Details</button>' +
            '</div>' +
            '<details class="error-details" style="display: none;">' +
                '<summary>Technical Details</summary>' +
                '<pre class="error-stack">' + (error.stack || 'No stack trace available') + '</pre>' +
            '</details>' +
        '</div>';

    // Add error styles
    errorContainer.style.cssText =
        'position: fixed;' +
        'top: 0;' +
        'left: 0;' +
        'width: 100%;' +
        'height: 100%;' +
        'background: rgba(0, 0, 0, 0.8);' +
        'display: flex;' +
        'align-items: center;' +
        'justify-content: center;' +
        'z-index: 10000;' +
        'font-family: system-ui, -apple-system, sans-serif;';

    // Style the error content
    var style = document.createElement('style');
    style.textContent = `
        .vwb-init-error .error-content {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            text-align: center;
        }
        
        .vwb-init-error h2 {
            color: #e74c3c;
            margin: 0 0 1rem 0;
            font-size: 1.5rem;
        }
        
        .vwb-init-error p {
            margin: 0.5rem 0;
            color: #333;
            line-height: 1.5;
        }

        .vwb-init-error .error-actions {
            margin: 1.5rem 0;
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }

        .vwb-init-error button {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
        }

        .vwb-init-error .btn-reload {
            background: #3498db;
            color: white;
        }

        .vwb-init-error .btn-reload:hover {
            background: #2980b9;
        }

        .vwb-init-error .btn-details {
            background: #95a5a6;
            color: white;
        }

        .vwb-init-error .btn-details:hover {
            background: #7f8c8d;
        }

        .vwb-init-error .error-details {
            text-align: left;
            margin-top: 1rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 4px;
        }

        .vwb-init-error .error-stack {
            font-family: 'Courier New', monospace;
            font-size: 0.8rem;
            white-space: pre-wrap;
            word-break: break-all;
            margin: 0;
            color: #666;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(errorContainer);
}

/**
 * Toggle error details visibility
 */
function toggleErrorDetails() {
    var details = document.querySelector('.error-details');
    if (details) {
        if (details.style.display === 'none') {
            details.style.display = 'block';
        } else {
            details.style.display = 'none';
        }
    }
}

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

/**
 * Handle global errors
 */
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

/**
 * Log browser information for debugging
 */
console.log('Browser info:', {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine
});

console.log('Document ready state:', document.readyState);
console.log('Window loaded:', document.readyState === 'complete');