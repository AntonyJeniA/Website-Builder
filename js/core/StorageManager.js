/**
 * StorageManager - Project Save and Load System
 * 
 * This class manages project persistence using localStorage, including
 * project serialization to JSON format, loading functionality that reconstructs
 * canvas state, auto-save with debouncing, and project management UI.
 */

function StorageManager(canvasManager, eventBus) {
    this.canvasManager = canvasManager;
    this.eventBus = eventBus;
    this.initialized = false;
    
    // Storage configuration
    this.config = {
        storagePrefix: 'vwb-project-',
        projectListKey: 'vwb-project-list',
        currentProjectKey: 'vwb-current-project',
        autoSaveKey: 'vwb-autosave',
        autoSaveInterval: 30000, // 30 seconds
        maxProjects: 50
    };
    
    // Auto-save state
    this.autoSave = {
        enabled: true,
        timeout: null,
        debounceDelay: 2000, // 2 seconds
        lastSaveTime: null
    };
    
    // Current project state
    this.currentProject = {
        id: null,
        name: null,
        modified: false,
        data: null
    };
    
    // Project management UI elements
    this.ui = {
        saveDialog: null,
        loadDialog: null,
        projectList: null
    };
}

/**
 * Initialize the storage manager
 */
StorageManager.prototype.init = function() {
    if (this.initialized) {
        console.warn('StorageManager already initialized');
        return;
    }

    try {
        console.log('Initializing StorageManager...');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Create project management UI
        this.createProjectManagementUI();
        
        // Initialize auto-save
        this.initializeAutoSave();
        
        // Try to restore last session
        this.restoreLastSession();
        
        this.initialized = true;
        console.log('StorageManager initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize StorageManager:', error);
        throw error;
    }
};

/**
 * Save the entire site data (for CMS)
 * @param {Object} siteData - The site data object, typically { pages: [...] }
 */
StorageManager.prototype.saveSiteData = function(siteData) {
    try {
        const siteDataStr = JSON.stringify(siteData);
        localStorage.setItem('vwb-sitedata', siteDataStr);
        this.eventBus.emit('cms:data-saved');
        console.log('Site data saved successfully.');
    } catch (error) {
        console.error('Error saving site data:', error);
        this.eventBus.emit('error:storage', {
            error: error,
            operation: 'save site data'
        });
    }
};

/**
 * Load the entire site data (for CMS)
 * @returns {Object|null} The site data object or null if not found/error
 */
StorageManager.prototype.loadSiteData = function() {
    try {
        const siteDataStr = localStorage.getItem('vwb-sitedata');
        if (!siteDataStr) {
            return null;
        }
        return JSON.parse(siteDataStr);
    } catch (error) {
        console.error('Error loading site data:', error);
        this.eventBus.emit('error:storage', {
            error: error,
            operation: 'load site data'
        });
        return null;
    }
};

/**
 * Set up event listeners
 */
StorageManager.prototype.setupEventListeners = function() {
    var self = this;
    
    // Listen for save/load actions
    this.eventBus.on('action:save', function(data) {
        self.showSaveDialog();
    });
    
    this.eventBus.on('action:load', function(data) {
        self.showLoadDialog();
    });
    
    // Listen for canvas changes for auto-save
    this.eventBus.on('element:created', function(data) {
        self.markProjectModified();
        self.scheduleAutoSave();
    });
    
    this.eventBus.on('element:updated', function(data) {
        self.markProjectModified();
        self.scheduleAutoSave();
    });
    
    this.eventBus.on('element:deleted', function(data) {
        self.markProjectModified();
        self.scheduleAutoSave();
    });
    
    this.eventBus.on('canvas:cleared', function(data) {
        self.markProjectModified();
        self.scheduleAutoSave();
    });
    
    // Listen for application shutdown
    window.addEventListener('beforeunload', function(event) {
        self.handleBeforeUnload(event);
    });
};/**
 * C
reate project management UI dialogs
 */
StorageManager.prototype.createProjectManagementUI = function() {
    this.createSaveDialog();
    this.createLoadDialog();
};

/**
 * Create save dialog
 */
StorageManager.prototype.createSaveDialog = function() {
    var self = this;
    
    this.ui.saveDialog = DOMUtils.createElement('div', {
        className: 'vwb-modal vwb-save-dialog',
        styles: {
            display: 'none',
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: '10000',
            justifyContent: 'center',
            alignItems: 'center'
        }
    });
    
    var dialogContent = DOMUtils.createElement('div', {
        className: 'vwb-modal-content',
        styles: {
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            minWidth: '400px',
            maxWidth: '500px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }
    });
    
    var title = DOMUtils.createElement('h3', {
        textContent: 'Save Project',
        styles: {
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#2c3e50'
        }
    });
    
    var form = DOMUtils.createElement('form', {
        className: 'vwb-save-form'
    });
    
    var nameLabel = DOMUtils.createElement('label', {
        textContent: 'Project Name:',
        styles: {
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#34495e'
        }
    });
    
    var nameInput = DOMUtils.createElement('input', {
        attributes: {
            type: 'text',
            placeholder: 'Enter project name...',
            required: true
        },
        styles: {
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            marginBottom: '16px',
            boxSizing: 'border-box'
        }
    });
    
    var buttonContainer = DOMUtils.createElement('div', {
        styles: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
        }
    });
    
    var cancelButton = DOMUtils.createElement('button', {
        attributes: { type: 'button' },
        textContent: 'Cancel',
        styles: {
            padding: '10px 20px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white',
            color: '#666',
            cursor: 'pointer',
            fontSize: '14px'
        }
    });
    
    var saveButton = DOMUtils.createElement('button', {
        attributes: { type: 'submit' },
        textContent: 'Save',
        styles: {
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#3498db',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
        }
    });
    
    // Event listeners
    DOMUtils.addEventListener(cancelButton, 'click', function() {
        self.hideSaveDialog();
    });
    
    DOMUtils.addEventListener(form, 'submit', function(event) {
        event.preventDefault();
        var projectName = nameInput.value.trim();
        if (projectName) {
            self.saveProject(projectName);
            self.hideSaveDialog();
        }
    });
    
    // Close on backdrop click
    DOMUtils.addEventListener(this.ui.saveDialog, 'click', function(event) {
        if (event.target === self.ui.saveDialog) {
            self.hideSaveDialog();
        }
    });
    
    // Assemble dialog
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(saveButton);
    form.appendChild(nameLabel);
    form.appendChild(nameInput);
    form.appendChild(buttonContainer);
    dialogContent.appendChild(title);
    dialogContent.appendChild(form);
    this.ui.saveDialog.appendChild(dialogContent);
    
    // Store reference to input for focus
    this.ui.saveDialog.nameInput = nameInput;
    
    document.body.appendChild(this.ui.saveDialog);
};

/**
 * Create load dialog
 */
StorageManager.prototype.createLoadDialog = function() {
    var self = this;
    
    this.ui.loadDialog = DOMUtils.createElement('div', {
        className: 'vwb-modal vwb-load-dialog',
        styles: {
            display: 'none',
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: '10000',
            justifyContent: 'center',
            alignItems: 'center'
        }
    });
    
    var dialogContent = DOMUtils.createElement('div', {
        className: 'vwb-modal-content',
        styles: {
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            minWidth: '500px',
            maxWidth: '600px',
            maxHeight: '70vh',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column'
        }
    });
    
    var title = DOMUtils.createElement('h3', {
        textContent: 'Load Project',
        styles: {
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#2c3e50'
        }
    });
    
    var projectListContainer = DOMUtils.createElement('div', {
        className: 'vwb-project-list-container',
        styles: {
            flex: '1',
            overflowY: 'auto',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginBottom: '16px',
            minHeight: '200px'
        }
    });
    
    this.ui.projectList = DOMUtils.createElement('div', {
        className: 'vwb-project-list',
        styles: {
            padding: '8px'
        }
    });
    
    var buttonContainer = DOMUtils.createElement('div', {
        styles: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }
    });
    
    var leftButtons = DOMUtils.createElement('div', {
        styles: {
            display: 'flex',
            gap: '12px'
        }
    });
    
    var refreshButton = DOMUtils.createElement('button', {
        attributes: { type: 'button' },
        textContent: 'Refresh',
        styles: {
            padding: '8px 16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white',
            color: '#666',
            cursor: 'pointer',
            fontSize: '14px'
        }
    });
    
    var rightButtons = DOMUtils.createElement('div', {
        styles: {
            display: 'flex',
            gap: '12px'
        }
    });
    
    var cancelButton = DOMUtils.createElement('button', {
        attributes: { type: 'button' },
        textContent: 'Cancel',
        styles: {
            padding: '10px 20px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white',
            color: '#666',
            cursor: 'pointer',
            fontSize: '14px'
        }
    });
    
    // Event listeners
    DOMUtils.addEventListener(refreshButton, 'click', function() {
        self.refreshProjectList();
    });
    
    DOMUtils.addEventListener(cancelButton, 'click', function() {
        self.hideLoadDialog();
    });
    
    // Close on backdrop click
    DOMUtils.addEventListener(this.ui.loadDialog, 'click', function(event) {
        if (event.target === self.ui.loadDialog) {
            self.hideLoadDialog();
        }
    });
    
    // Assemble dialog
    projectListContainer.appendChild(this.ui.projectList);
    leftButtons.appendChild(refreshButton);
    rightButtons.appendChild(cancelButton);
    buttonContainer.appendChild(leftButtons);
    buttonContainer.appendChild(rightButtons);
    dialogContent.appendChild(title);
    dialogContent.appendChild(projectListContainer);
    dialogContent.appendChild(buttonContainer);
    this.ui.loadDialog.appendChild(dialogContent);
    
    document.body.appendChild(this.ui.loadDialog);
};

/**
 * Initialize auto-save functionality
 */
StorageManager.prototype.initializeAutoSave = function() {
    // Check if auto-save is enabled in settings
    var autoSaveEnabled = localStorage.getItem('vwb-autosave-enabled');
    if (autoSaveEnabled !== null) {
        this.autoSave.enabled = autoSaveEnabled === 'true';
    }
    
    console.log('Auto-save ' + (this.autoSave.enabled ? 'enabled' : 'disabled'));
};/**

 * Save project with given name
 */
StorageManager.prototype.saveProject = function(projectName) {
    // Show loading state
    this.eventBus.emit('loading:start', {
        operation: 'save-project',
        message: 'Saving project...'
    });
    
    try {
        // Validate project name
        if (!projectName || typeof projectName !== 'string' || projectName.trim().length === 0) {
            throw new Error('Project name is required');
        }
        
        if (projectName.length > 100) {
            throw new Error('Project name is too long (maximum 100 characters)');
        }
        
        // Generate project data
        var projectData = this.serializeProject(projectName);
        
        // Validate project data size
        var projectDataStr = JSON.stringify(projectData);
        if (projectDataStr.length > 5 * 1024 * 1024) { // 5MB limit
            throw new Error('Project is too large to save (maximum 5MB)');
        }
        
        // Generate unique project ID if new project
        if (!this.currentProject.id) {
            this.currentProject.id = this.generateProjectId();
        }
        
        projectData.id = this.currentProject.id;
        
        // Save to localStorage
        var storageKey = this.config.storagePrefix + projectData.id;
        localStorage.setItem(storageKey, projectDataStr);
        
        // Update project list
        this.updateProjectList(projectData);
        
        // Update current project state
        this.currentProject.name = projectName;
        this.currentProject.modified = false;
        this.currentProject.data = projectData;
        
        // Store current project reference
        localStorage.setItem(this.config.currentProjectKey, projectData.id);
        
        // Emit save event
        this.eventBus.emit('project:saved', {
            projectId: projectData.id,
            projectName: projectName,
            projectData: projectData
        });
        
        // Emit success event
        this.eventBus.emit('success:save', {
            projectName: projectName,
            projectId: projectData.id
        });
        
        console.log('Project saved:', projectName, 'ID:', projectData.id);
        return projectData;
        
    } catch (error) {
        console.error('Error saving project:', error);
        
        // Emit storage error event
        this.eventBus.emit('error:storage', { 
            error: error, 
            operation: 'save project',
            projectName: projectName
        });
        
        throw error;
    } finally {
        // Hide loading state
        this.eventBus.emit('loading:end', {
            operation: 'save-project'
        });
    }
};

/**
 * Load project by ID
 */
StorageManager.prototype.loadProject = function(projectId) {
    // Show loading state
    this.eventBus.emit('loading:start', {
        operation: 'load-project',
        message: 'Loading project...'
    });
    
    try {
        // Validate project ID
        if (!projectId || typeof projectId !== 'string') {
            throw new Error('Invalid project ID');
        }
        
        var storageKey = this.config.storagePrefix + projectId;
        var projectDataStr = localStorage.getItem(storageKey);
        
        if (!projectDataStr) {
            throw new Error('Project not found: ' + projectId);
        }
        
        var projectData;
        try {
            projectData = JSON.parse(projectDataStr);
        } catch (parseError) {
            throw new Error('Project data is corrupted and cannot be loaded');
        }
        
        // Validate project data
        if (!this.validateProjectData(projectData)) {
            throw new Error('Invalid project data structure');
        }
        
        // Clear current canvas
        this.canvasManager.clearCanvas();
        
        // Reconstruct canvas state
        this.reconstructCanvasState(projectData);
        
        // Update current project state
        this.currentProject.id = projectData.id;
        this.currentProject.name = projectData.name;
        this.currentProject.modified = false;
        this.currentProject.data = projectData;
        
        // Store current project reference
        localStorage.setItem(this.config.currentProjectKey, projectId);
        
        // Emit load event
        this.eventBus.emit('project:loaded', {
            projectId: projectId,
            projectData: projectData
        });
        
        // Emit success event
        this.eventBus.emit('success:load', {
            projectName: projectData.name,
            projectId: projectId
        });
        
        console.log('Project loaded:', projectData.name, 'ID:', projectId);
        return projectData;
        
    } catch (error) {
        console.error('Error loading project:', error);
        
        // Emit storage error event
        this.eventBus.emit('error:storage', { 
            error: error, 
            operation: 'load project',
            projectId: projectId
        });
        
        throw error;
    } finally {
        // Hide loading state
        this.eventBus.emit('loading:end', {
            operation: 'load-project'
        });
    }
};

/**
 * Serialize current project to JSON
 */
StorageManager.prototype.serializeProject = function(projectName) {
    var canvasState = this.canvasManager.state;
    var timestamp = new Date().toISOString();
    
    var projectData = {
        id: this.currentProject.id || null,
        name: projectName,
        version: '1.0',
        created: this.currentProject.data ? this.currentProject.data.created : timestamp,
        modified: timestamp,
        elements: {},
        rootElements: [],
        canvasSettings: {
            width: this.canvasManager.canvas.style.width || '100%',
            backgroundColor: this.canvasManager.canvas.style.backgroundColor || '#ffffff',
            viewport: 'desktop' // TODO: Get from app state
        },
        customCSS: '',
        responsiveData: this.serializeResponsiveData()
    };
    
    // Serialize elements
    for (var elementId in canvasState.elements) {
        var elementData = canvasState.elements[elementId];
        projectData.elements[elementId] = {
            id: elementData.id,
            type: elementData.type,
            content: elementData.content,
            styles: Object.assign({}, elementData.styles),
            attributes: Object.assign({}, elementData.attributes),
            children: elementData.children.slice(), // Copy array
            parent: elementData.parent
        };
    }
    
    // Copy root elements
    projectData.rootElements = canvasState.rootElements.slice();
    
    return projectData;
};

/**
 * Reconstruct canvas state from project data
 */
StorageManager.prototype.reconstructCanvasState = function(projectData) {
    var self = this;
    
    // Restore canvas settings
    if (projectData.canvasSettings) {
        var canvas = this.canvasManager.canvas;
        if (projectData.canvasSettings.backgroundColor) {
            canvas.style.backgroundColor = projectData.canvasSettings.backgroundColor;
        }
        if (projectData.canvasSettings.width) {
            canvas.style.width = projectData.canvasSettings.width;
        }
    }
    
    // Restore elements in correct order (parents before children)
    var elementsToCreate = [];
    var createdElements = {};
    
    // First pass: collect all elements
    for (var elementId in projectData.elements) {
        elementsToCreate.push(projectData.elements[elementId]);
    }
    
    // Sort by hierarchy (parents first)
    elementsToCreate.sort(function(a, b) {
        if (!a.parent && b.parent) return -1;
        if (a.parent && !b.parent) return 1;
        return 0;
    });
    
    // Create elements
    for (var i = 0; i < elementsToCreate.length; i++) {
        var elementData = elementsToCreate[i];
        this.recreateElement(elementData, createdElements);
    }
    
    // Update canvas manager state
    this.canvasManager.state.elements = projectData.elements;
    this.canvasManager.state.rootElements = projectData.rootElements.slice();
    this.canvasManager.state.nextElementId = this.getNextElementId(projectData.elements);
    
    // Restore responsive data
    this.restoreResponsiveData(projectData.responsiveData);
    
    console.log('Canvas state reconstructed with', elementsToCreate.length, 'elements');
};

/**
 * Recreate a single element from project data
 */
StorageManager.prototype.recreateElement = function(elementData, createdElements) {
    // Create DOM element
    var domElement = this.canvasManager.createDOMElement(elementData);
    
    // Find parent element if exists
    var parentElement = null;
    if (elementData.parent && createdElements[elementData.parent]) {
        parentElement = createdElements[elementData.parent];
    } else {
        parentElement = this.canvasManager.canvas;
    }
    
    // Append to parent
    parentElement.appendChild(domElement);
    
    // Store reference
    createdElements[elementData.id] = domElement;
    
    return domElement;
};

/**
 * Get next element ID from existing elements
 */
StorageManager.prototype.getNextElementId = function(elements) {
    var maxId = 0;
    for (var elementId in elements) {
        var match = elementId.match(/vwb-element-(\d+)/);
        if (match) {
            var id = parseInt(match[1], 10);
            if (id > maxId) {
                maxId = id;
            }
        }
    }
    return maxId + 1;
};

/**
 * Validate project data structure
 */
StorageManager.prototype.validateProjectData = function(projectData) {
    if (!projectData || typeof projectData !== 'object') {
        return false;
    }
    
    // Check required fields
    var requiredFields = ['id', 'name', 'version', 'created', 'modified', 'elements', 'rootElements'];
    for (var i = 0; i < requiredFields.length; i++) {
        if (!(requiredFields[i] in projectData)) {
            console.error('Missing required field:', requiredFields[i]);
            return false;
        }
    }
    
    // Validate elements structure
    if (typeof projectData.elements !== 'object') {
        return false;
    }
    
    // Validate root elements
    if (!Array.isArray(projectData.rootElements)) {
        return false;
    }
    
    return true;
};/*
*
 * Get list of saved projects
 */
StorageManager.prototype.getProjectList = function() {
    try {
        var projectListStr = localStorage.getItem(this.config.projectListKey);
        if (!projectListStr) {
            return [];
        }
        
        var projectList = JSON.parse(projectListStr);
        
        // Validate and clean up project list
        var validProjects = [];
        for (var i = 0; i < projectList.length; i++) {
            var project = projectList[i];
            var storageKey = this.config.storagePrefix + project.id;
            if (localStorage.getItem(storageKey)) {
                validProjects.push(project);
            }
        }
        
        // Update project list if cleaned up
        if (validProjects.length !== projectList.length) {
            this.saveProjectList(validProjects);
        }
        
        return validProjects;
        
    } catch (error) {
        console.error('Error getting project list:', error);
        return [];
    }
};

/**
 * Update project list with new/updated project
 */
StorageManager.prototype.updateProjectList = function(projectData) {
    var projectList = this.getProjectList();
    
    // Find existing project or add new one
    var existingIndex = -1;
    for (var i = 0; i < projectList.length; i++) {
        if (projectList[i].id === projectData.id) {
            existingIndex = i;
            break;
        }
    }
    
    var projectInfo = {
        id: projectData.id,
        name: projectData.name,
        created: projectData.created,
        modified: projectData.modified,
        elementCount: Object.keys(projectData.elements).length
    };
    
    if (existingIndex !== -1) {
        projectList[existingIndex] = projectInfo;
    } else {
        projectList.unshift(projectInfo); // Add to beginning
    }
    
    // Limit number of projects
    if (projectList.length > this.config.maxProjects) {
        var removedProjects = projectList.splice(this.config.maxProjects);
        // Clean up removed projects from storage
        for (var i = 0; i < removedProjects.length; i++) {
            this.deleteProjectData(removedProjects[i].id);
        }
    }
    
    this.saveProjectList(projectList);
};

/**
 * Save project list to localStorage
 */
StorageManager.prototype.saveProjectList = function(projectList) {
    try {
        localStorage.setItem(this.config.projectListKey, JSON.stringify(projectList));
    } catch (error) {
        console.error('Error saving project list:', error);
    }
};

/**
 * Delete project by ID
 */
StorageManager.prototype.deleteProject = function(projectId) {
    try {
        // Remove from storage
        this.deleteProjectData(projectId);
        
        // Remove from project list
        var projectList = this.getProjectList();
        var filteredList = projectList.filter(function(project) {
            return project.id !== projectId;
        });
        this.saveProjectList(filteredList);
        
        // Clear current project if it was deleted
        if (this.currentProject.id === projectId) {
            this.currentProject = {
                id: null,
                name: null,
                modified: false,
                data: null
            };
            localStorage.removeItem(this.config.currentProjectKey);
        }
        
        // Emit delete event
        this.eventBus.emit('project:deleted', { projectId: projectId });
        
        console.log('Project deleted:', projectId);
        return true;
        
    } catch (error) {
        console.error('Error deleting project:', error);
        return false;
    }
};

/**
 * Delete project data from localStorage
 */
StorageManager.prototype.deleteProjectData = function(projectId) {
    var storageKey = this.config.storagePrefix + projectId;
    localStorage.removeItem(storageKey);
};

/**
 * Generate unique project ID
 */
StorageManager.prototype.generateProjectId = function() {
    return 'project-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

/**
 * Mark current project as modified
 */
StorageManager.prototype.markProjectModified = function() {
    if (!this.currentProject.modified) {
        this.currentProject.modified = true;
        this.eventBus.emit('project:modified', {
            projectId: this.currentProject.id,
            projectName: this.currentProject.name
        });
    }
};

/**
 * Schedule auto-save
 */
StorageManager.prototype.scheduleAutoSave = function() {
    if (!this.autoSave.enabled) return;
    
    var self = this;
    
    // Clear existing timeout
    if (this.autoSave.timeout) {
        clearTimeout(this.autoSave.timeout);
    }
    
    // Schedule new auto-save
    this.autoSave.timeout = setTimeout(function() {
        self.performAutoSave();
    }, this.autoSave.debounceDelay);
};

/**
 * Perform auto-save
 */
StorageManager.prototype.performAutoSave = function() {
    if (!this.autoSave.enabled || !this.currentProject.modified) {
        return;
    }
    
    try {
        // Use current project name or default
        var projectName = this.currentProject.name || 'Untitled Project';
        
        // Save to auto-save slot
        var autoSaveData = this.serializeProject(projectName);
        autoSaveData.id = this.config.autoSaveKey;
        autoSaveData.isAutoSave = true;
        
        localStorage.setItem(this.config.autoSaveKey, JSON.stringify(autoSaveData));
        
        this.autoSave.lastSaveTime = new Date();
        
        console.log('Auto-save completed at', this.autoSave.lastSaveTime.toLocaleTimeString());
        
        this.eventBus.emit('project:auto-saved', {
            timestamp: this.autoSave.lastSaveTime,
            projectName: projectName
        });
        
    } catch (error) {
        console.error('Auto-save failed:', error);
    }
};

/**
 * Restore last session from auto-save or current project
 */
StorageManager.prototype.restoreLastSession = function() {
    try {
        // Try to restore from current project first
        var currentProjectId = localStorage.getItem(this.config.currentProjectKey);
        if (currentProjectId && currentProjectId !== this.config.autoSaveKey) {
            try {
                this.loadProject(currentProjectId);
                console.log('Restored last session from current project');
                return;
            } catch (error) {
                console.warn('Failed to restore current project, trying auto-save');
            }
        }
        
        // Try to restore from auto-save
        var autoSaveData = localStorage.getItem(this.config.autoSaveKey);
        if (autoSaveData) {
            var projectData = JSON.parse(autoSaveData);
            if (this.validateProjectData(projectData)) {
                this.reconstructCanvasState(projectData);
                this.currentProject.name = projectData.name;
                this.currentProject.modified = true; // Mark as modified since it's from auto-save
                console.log('Restored last session from auto-save');
                return;
            }
        }
        
        console.log('No previous session to restore');
        
    } catch (error) {
        console.error('Error restoring last session:', error);
    }
};

/**
 * Handle before unload event
 */
StorageManager.prototype.handleBeforeUnload = function(event) {
    if (this.currentProject.modified && this.autoSave.enabled) {
        // Perform final auto-save
        this.performAutoSave();
        
        // Show warning if project has unsaved changes
        if (this.currentProject.id && this.currentProject.modified) {
            var message = 'You have unsaved changes. Are you sure you want to leave?';
            event.returnValue = message;
            return message;
        }
    }
};/**

 * Show save dialog
 */
StorageManager.prototype.showSaveDialog = function() {
    if (!this.ui.saveDialog) return;
    
    // Pre-fill with current project name
    var nameInput = this.ui.saveDialog.nameInput;
    if (nameInput) {
        nameInput.value = this.currentProject.name || '';
        setTimeout(function() {
            nameInput.focus();
            nameInput.select();
        }, 100);
    }
    
    this.ui.saveDialog.style.display = 'flex';
};

/**
 * Hide save dialog
 */
StorageManager.prototype.hideSaveDialog = function() {
    if (this.ui.saveDialog) {
        this.ui.saveDialog.style.display = 'none';
    }
};

/**
 * Show load dialog
 */
StorageManager.prototype.showLoadDialog = function() {
    if (!this.ui.loadDialog) return;
    
    this.refreshProjectList();
    this.ui.loadDialog.style.display = 'flex';
};

/**
 * Hide load dialog
 */
StorageManager.prototype.hideLoadDialog = function() {
    if (this.ui.loadDialog) {
        this.ui.loadDialog.style.display = 'none';
    }
};

/**
 * Refresh project list in load dialog
 */
StorageManager.prototype.refreshProjectList = function() {
    if (!this.ui.projectList) return;
    
    var self = this;
    var projectList = this.getProjectList();
    
    // Clear existing list
    this.ui.projectList.innerHTML = '';
    
    if (projectList.length === 0) {
        var emptyMessage = DOMUtils.createElement('div', {
            textContent: 'No saved projects found.',
            styles: {
                padding: '20px',
                textAlign: 'center',
                color: '#666',
                fontStyle: 'italic'
            }
        });
        this.ui.projectList.appendChild(emptyMessage);
        return;
    }
    
    // Create project items
    for (var i = 0; i < projectList.length; i++) {
        var project = projectList[i];
        var projectItem = this.createProjectListItem(project);
        this.ui.projectList.appendChild(projectItem);
    }
};

/**
 * Create project list item
 */
StorageManager.prototype.createProjectListItem = function(project) {
    var self = this;
    
    var item = DOMUtils.createElement('div', {
        className: 'vwb-project-item',
        styles: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            border: '1px solid #eee',
            borderRadius: '4px',
            marginBottom: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease'
        }
    });
    
    var info = DOMUtils.createElement('div', {
        className: 'vwb-project-info',
        styles: {
            flex: '1'
        }
    });
    
    var name = DOMUtils.createElement('div', {
        className: 'vwb-project-name',
        textContent: project.name,
        styles: {
            fontSize: '16px',
            fontWeight: '500',
            color: '#2c3e50',
            marginBottom: '4px'
        }
    });
    
    var details = DOMUtils.createElement('div', {
        className: 'vwb-project-details',
        styles: {
            fontSize: '12px',
            color: '#666'
        }
    });
    
    var modifiedDate = new Date(project.modified).toLocaleDateString();
    var modifiedTime = new Date(project.modified).toLocaleTimeString();
    details.textContent = project.elementCount + ' elements • Modified ' + modifiedDate + ' at ' + modifiedTime;
    
    var actions = DOMUtils.createElement('div', {
        className: 'vwb-project-actions',
        styles: {
            display: 'flex',
            gap: '8px'
        }
    });
    
    var loadButton = DOMUtils.createElement('button', {
        textContent: 'Load',
        styles: {
            padding: '6px 12px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#3498db',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px'
        }
    });
    
    var deleteButton = DOMUtils.createElement('button', {
        textContent: 'Delete',
        styles: {
            padding: '6px 12px',
            border: '1px solid #e74c3c',
            borderRadius: '4px',
            backgroundColor: 'white',
            color: '#e74c3c',
            cursor: 'pointer',
            fontSize: '12px'
        }
    });
    
    // Event listeners
    DOMUtils.addEventListener(loadButton, 'click', function(event) {
        event.stopPropagation();
        self.loadProject(project.id);
        self.hideLoadDialog();
    });
    
    DOMUtils.addEventListener(deleteButton, 'click', function(event) {
        event.stopPropagation();
        if (confirm('Are you sure you want to delete "' + project.name + '"?')) {
            self.deleteProject(project.id);
            self.refreshProjectList();
        }
    });
    
    // Hover effects
    DOMUtils.addEventListener(item, 'mouseover', function() {
        item.style.backgroundColor = '#f8f9fa';
    });
    
    DOMUtils.addEventListener(item, 'mouseout', function() {
        item.style.backgroundColor = 'transparent';
    });
    
    // Double-click to load
    DOMUtils.addEventListener(item, 'dblclick', function() {
        self.loadProject(project.id);
        self.hideLoadDialog();
    });
    
    // Assemble item
    info.appendChild(name);
    info.appendChild(details);
    actions.appendChild(loadButton);
    actions.appendChild(deleteButton);
    item.appendChild(info);
    item.appendChild(actions);
    
    return item;
};

/**
 * Enable or disable auto-save
 */
StorageManager.prototype.setAutoSaveEnabled = function(enabled) {
    this.autoSave.enabled = enabled;
    localStorage.setItem('vwb-autosave-enabled', enabled.toString());
    
    if (enabled) {
        console.log('Auto-save enabled');
    } else {
        console.log('Auto-save disabled');
        if (this.autoSave.timeout) {
            clearTimeout(this.autoSave.timeout);
            this.autoSave.timeout = null;
        }
    }
};

/**
 * Get current project info
 */
StorageManager.prototype.getCurrentProject = function() {
    return {
        id: this.currentProject.id,
        name: this.currentProject.name,
        modified: this.currentProject.modified,
        lastSaveTime: this.autoSave.lastSaveTime
    };
};

/**
 * Serialize responsive data
 */
StorageManager.prototype.serializeResponsiveData = function() {
    // Check if ResponsiveManager is available
    if (!window.visualWebBuilder || !window.visualWebBuilder.responsiveManager) {
        return null;
    }
    
    var responsiveManager = window.visualWebBuilder.responsiveManager;
    return responsiveManager.exportResponsiveData();
};

/**
 * Restore responsive data
 */
StorageManager.prototype.restoreResponsiveData = function(responsiveData) {
    // Check if ResponsiveManager is available and data exists
    if (!window.visualWebBuilder || !window.visualWebBuilder.responsiveManager || !responsiveData) {
        return;
    }
    
    var responsiveManager = window.visualWebBuilder.responsiveManager;
    responsiveManager.importResponsiveData(responsiveData);
    
    console.log('Responsive data restored');
};

/**
 * Clean up resources
 */
StorageManager.prototype.destroy = function() {
    if (this.autoSave.timeout) {
        clearTimeout(this.autoSave.timeout);
    }
    
    // Remove UI elements
    if (this.ui.saveDialog) {
        DOMUtils.removeElement(this.ui.saveDialog);
    }
    if (this.ui.loadDialog) {
        DOMUtils.removeElement(this.ui.loadDialog);
    }
    
    this.initialized = false;
    console.log('StorageManager destroyed');
};