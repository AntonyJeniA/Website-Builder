/**
 * Visual Web Builder - Main Application Entry Point
 * 
 * This is the main entry point for the Visual Web Builder application.
 * It initializes the core application controller using vanilla JavaScript.
 */

/**
 * Initialize the application when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize the main application
        var app = new VisualWebBuilder();
        app.init();
        
        // Make the app instance globally available for debugging
        window.visualWebBuilder = app;
        
        console.log('Visual Web Builder initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Visual Web Builder:', error);
        console.error('Error stack:', error.stack);
        
        // Show user-friendly error message
        var errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = 
            '<h2>Application Error</h2>' +
            '<p>Failed to initialize the Visual Web Builder. Please refresh the page and try again.</p>' +
            '<details>' +
                '<summary>Technical Details</summary>' +
                '<pre>' + error.message + '\n\nStack:\n' + (error.stack || 'No stack trace available') + '</pre>' +
            '</details>' +
            '<button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Refresh Page</button>';
        
        // Add error styles
        errorMessage.style.cssText = 
            'position: fixed;' +
            'top: 50%;' +
            'left: 50%;' +
            'transform: translate(-50%, -50%);' +
            'background: white;' +
            'padding: 2rem;' +
            'border-radius: 8px;' +
            'box-shadow: 0 4px 20px rgba(0,0,0,0.3);' +
            'max-width: 600px;' +
            'z-index: 10000;' +
            'font-family: system-ui, sans-serif;' +
            'max-height: 80vh;' +
            'overflow-y: auto;';
        
        document.body.appendChild(errorMessage);
    }
});

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