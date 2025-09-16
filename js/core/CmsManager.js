/**
 * CmsManager - Handles CMS-related business logic
 *
 * This manager is responsible for creating, retrieving, updating, and deleting
 * pages (or posts) for the CMS functionality. It interacts with the StorageManager
 * to persist the page data.
 */
function CmsManager(storageManager) {
    this.storageManager = storageManager;
    this.pages = [];
    this.initialized = false;
}

/**
 * Initialize the CmsManager
 */
CmsManager.prototype.init = function() {
    if (this.initialized) {
        console.warn('CmsManager already initialized');
        return;
    }
    console.log('Initializing CmsManager...');
    this.loadPages();
    this.initialized = true;
    console.log('CmsManager initialized successfully');
};

/**
 * Load pages from the storage manager
 */
CmsManager.prototype.loadPages = function() {
    // This will be adapted to use the new StorageManager method
    const data = this.storageManager.loadSiteData();
    this.pages = (data && data.pages) ? data.pages : [];
    console.log('Pages loaded:', this.pages.length);
};

/**
 * Get all pages
 * @returns {Array} A list of page objects
 */
CmsManager.prototype.getPages = function() {
    return this.pages;
};

/**
 * Get a specific page by its ID
 * @param {string} pageId - The ID of the page to retrieve
 * @returns {Object|null} The page object or null if not found
 */
CmsManager.prototype.getPage = function(pageId) {
    return this.pages.find(p => p.id === pageId) || null;
};

/**
 * Create a new page
 * @param {string} pageName - The name for the new page
 * @returns {Object} The newly created page object
 */
CmsManager.prototype.createPage = function(pageName) {
    if (!pageName || pageName.trim() === '') {
        throw new Error('Page name cannot be empty.');
    }

    const newPage = {
        id: this.generateUniqueId(pageName),
        name: pageName.trim(),
        content: null, // Initially empty content
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    this.pages.push(newPage);
    this.saveAllPages();
    console.log('Page created:', newPage);
    return newPage;
};

/**
 * Save the content of a specific page
 * @param {string} pageId - The ID of the page to save
 * @param {Object} pageContent - The JSON content of the page from the builder
 * @returns {boolean} True if saved successfully, false otherwise
 */
CmsManager.prototype.savePageContent = function(pageId, pageContent) {
    const page = this.getPage(pageId);
    if (page) {
        page.content = pageContent;
        page.updatedAt = new Date().toISOString();
        this.saveAllPages();
        console.log('Page content saved for:', pageId);
        return true;
    }
    console.error('Failed to save page content: Page not found with ID', pageId);
    return false;
};

/**
 * Delete a page by its ID
 * @param {string} pageId - The ID of the page to delete
 * @returns {boolean} True if deleted successfully, false otherwise
 */
CmsManager.prototype.deletePage = function(pageId) {
    const pageIndex = this.pages.findIndex(p => p.id === pageId);
    if (pageIndex > -1) {
        const deletedPage = this.pages.splice(pageIndex, 1);
        this.saveAllPages();
        console.log('Page deleted:', deletedPage);
        return true;
    }
    console.error('Failed to delete page: Page not found with ID', pageId);
    return false;
};

/**
 * Persist all pages to the storage manager
 */
CmsManager.prototype.saveAllPages = function() {
    const siteData = { pages: this.pages };
    this.storageManager.saveSiteData(siteData);
};

/**
 * Generate a unique ID for a page, often based on its name (slug)
 * @param {string} pageName - The name of the page
 * @returns {string} A unique ID
 */
CmsManager.prototype.generateUniqueId = function(pageName) {
    const baseSlug = pageName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let uniqueId = baseSlug;
    let counter = 1;
    // Ensure the ID is unique
    while (this.pages.some(p => p.id === uniqueId)) {
        uniqueId = `${baseSlug}-${counter}`;
        counter++;
    }
    return uniqueId;
};
