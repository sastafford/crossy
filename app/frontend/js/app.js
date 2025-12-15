/**
 * Main Application Logic for Crossy
 */

import { FormView } from './formView.js';
import { JsonView } from './jsonView.js';
import { ViewTab } from './viewTab.js';
import { ResetTab } from './resetTab.js';

class CrossyApp {
    constructor() {
        this.formView = new FormView();
        this.jsonView = new JsonView();
        
        // Initialize ViewTab with error handling
        try {
            this.viewTab = new ViewTab();
            console.log('ViewTab initialized successfully');
        } catch (error) {
            console.error('Error initializing ViewTab:', error);
            this.viewTab = null;
            // Don't break the app if ViewTab fails to initialize
        }
        
        // Initialize ResetTab with error handling
        try {
            this.resetTab = new ResetTab();
            console.log('ResetTab initialized successfully');
        } catch (error) {
            console.error('Error initializing ResetTab:', error);
            this.resetTab = null;
            // Don't break the app if ResetTab fails to initialize
        }
        
        this.currentView = 'form';
        this.currentData = null;
        
        this.elements = {
            viewFormBtn: document.getElementById('viewForm'),
            viewJsonBtn: document.getElementById('viewJson'),
            generateBtn: document.getElementById('generateBtn'),
            submitBtn: document.getElementById('submitBtn'),
            formView: document.getElementById('formView'),
            jsonView: document.getElementById('jsonView'),
            mongodbIndicator: document.getElementById('mongodbIndicator'),
            mongodbStatus: document.getElementById('mongodbStatus'),
            notificationToast: document.getElementById('notificationToast'),
            toastTitle: document.getElementById('toastTitle'),
            toastBody: document.getElementById('toastBody'),
            createTab: document.getElementById('create-tab'),
            viewTabBtn: document.getElementById('view-tab')
        };
        
        this.toast = new bootstrap.Toast(this.elements.notificationToast);
        
        this.initializeEventListeners();
        this.initialize();
    }
    
    async initialize() {
        // Check MongoDB connection
        await this.checkMongoDBConnection();
        
        // Populate form dropdowns
        await this.formView.populateDropdowns();
        
        console.log('Crossy application initialized');
    }
    
    initializeEventListeners() {
        // View toggle buttons (within Create tab)
        this.elements.viewFormBtn.addEventListener('change', () => {
            if (this.elements.viewFormBtn.checked) {
                this.switchToFormView();
            }
        });
        
        this.elements.viewJsonBtn.addEventListener('change', () => {
            if (this.elements.viewJsonBtn.checked) {
                this.switchToJsonView();
            }
        });
        
        // Generate button
        this.elements.generateBtn.addEventListener('click', () => {
            this.generateRecord();
        });
        
        // Submit button
        this.elements.submitBtn.addEventListener('click', () => {
            this.submitRecord();
        });
        
        // Tab switching (Bootstrap handles the display, but we can listen for events)
        if (this.elements.viewTabBtn) {
            this.elements.viewTabBtn.addEventListener('shown.bs.tab', () => {
                // View tab is now active - verify elements are accessible
                console.log('View tab activated');
                const viewPane = document.getElementById('view-pane');
                if (viewPane) {
                    console.log('View pane found, classes:', viewPane.className);
                    // Verify ViewTab elements are accessible
                    if (this.viewTab) {
                        console.log('ViewTab instance exists');
                        // Re-check elements when tab becomes visible
                        this.viewTab.ensureElements();
                        // Re-initialize listeners to ensure they're attached
                        this.viewTab.initializeListeners();
                        console.log('ViewTab elements:', {
                            collectionSelect: !!this.viewTab.elements.collectionSelect,
                            documentSelect: !!this.viewTab.elements.documentSelect,
                            documentViewer: !!this.viewTab.elements.documentViewer,
                            documentViewerNote: !!this.viewTab.elements.documentViewerNote,
                            prevPageBtn: !!this.viewTab.elements.prevPageBtn,
                            nextPageBtn: !!this.viewTab.elements.nextPageBtn,
                            paginationInfo: !!this.viewTab.elements.paginationInfo
                        });
                    } else {
                        console.warn('ViewTab instance is null');
                    }
                } else {
                    console.error('View pane element not found!');
                }
            });
        }
        
        if (this.elements.createTab) {
            this.elements.createTab.addEventListener('shown.bs.tab', () => {
                // Create tab is now active
                console.log('Create tab activated');
            });
        }
    }
    
    async checkMongoDBConnection() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            
            this.updateMongoDBStatus(data.mongodb_connected);
        } catch (error) {
            console.error('Error checking MongoDB connection:', error);
            this.updateMongoDBStatus(false);
        }
    }
    
    updateMongoDBStatus(connected) {
        const indicator = this.elements.mongodbIndicator;
        const status = this.elements.mongodbStatus;
        
        // Remove spinner if present
        indicator.innerHTML = '';
        
        // Create circle indicator
        const circle = document.createElement('span');
        circle.className = 'circle ' + (connected ? 'connected' : 'disconnected');
        indicator.appendChild(circle);
        
        // Update status text
        status.textContent = connected ? 'Connected' : 'Disconnected';
    }
    
    switchToFormView() {
        // Sync data from JSON to form if in JSON view
        if (this.currentView === 'json') {
            try {
                const jsonData = this.jsonView.getJsonData();
                this.currentData = jsonData;
                this.formView.populateForm(jsonData);
            } catch (error) {
                console.error('Error syncing from JSON to form:', error);
                this.showNotification('Error', 'Invalid JSON format. Please fix errors before switching views.', 'error');
                // Revert to JSON view
                this.elements.viewJsonBtn.checked = true;
                return;
            }
        }
        
        this.currentView = 'form';
        this.elements.formView.style.display = 'block';
        this.elements.jsonView.style.display = 'none';
    }
    
    switchToJsonView() {
        // Sync data from form to JSON
        const formData = this.formView.getFormData();
        this.currentData = formData;
        this.jsonView.populateJson(formData);
        
        this.currentView = 'json';
        this.elements.formView.style.display = 'none';
        this.elements.jsonView.style.display = 'block';
    }
    
    async generateRecord() {
        try {
            // Show loading state
            this.elements.generateBtn.disabled = true;
            this.elements.generateBtn.textContent = 'Generating...';
            
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate record');
            }
            
            const data = await response.json();
            this.currentData = data;
            
            // Update current view
            if (this.currentView === 'form') {
                this.formView.populateForm(data);
            } else {
                this.jsonView.populateJson(data);
            }
            
            console.log('Generated record:', data);
            
        } catch (error) {
            console.error('Error generating record:', error);
            this.showNotification('Error', 'Failed to generate record. Please try again.', 'error');
        } finally {
            // Reset button state
            this.elements.generateBtn.disabled = false;
            this.elements.generateBtn.textContent = 'Generate';
        }
    }
    
    async submitRecord() {
        try {
            // Get data from current view
            let data;
            let validation;
            
            if (this.currentView === 'form') {
                validation = this.formView.validateForm();
                if (!validation.valid) {
                    this.showNotification('Validation Error', validation.errors.join('<br>'), 'error');
                    return;
                }
                data = this.formView.getFormData();
            } else {
                validation = this.jsonView.validateJson();
                if (!validation.valid) {
                    this.showNotification('Validation Error', validation.errors.join('<br>'), 'error');
                    return;
                }
                data = this.jsonView.getJsonData();
            }
            
            // Show loading state
            this.elements.submitBtn.disabled = true;
            this.elements.submitBtn.textContent = 'Submitting...';
            
            // Submit to backend
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Failed to submit record');
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Show success notification
                let message = '';
                if (result.files_created && result.files_created.length > 0) {
                    message += `Saved to filesystem: ${result.files_created.join(', ')}`;
                }
                if (result.mongodb_saved) {
                    message += (message ? ' | ' : '') + 'Saved to MongoDB';
                }
                
                this.showNotification('Success', message || result.message, 'success');
                
                // Clear the form after successful submission
                this.clearAll();
                
            } else {
                this.showNotification('Warning', result.message, 'warning');
            }
            
        } catch (error) {
            console.error('Error submitting record:', error);
            this.showNotification('Error', 'Failed to submit record. Please try again.', 'error');
        } finally {
            // Reset button state
            this.elements.submitBtn.disabled = false;
            this.elements.submitBtn.textContent = 'SUBMIT';
        }
    }
    
    clearAll() {
        this.currentData = null;
        this.formView.clearForm();
        this.jsonView.clearJson();
    }
    
    showNotification(title, message, type = 'info') {
        // Set toast class based on type
        this.elements.notificationToast.className = 'toast';
        this.elements.notificationToast.classList.add(type);
        
        // Set content
        this.elements.toastTitle.textContent = title;
        this.elements.toastBody.innerHTML = message;
        
        // Show toast
        this.toast.show();
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.crossyApp = new CrossyApp();
});

