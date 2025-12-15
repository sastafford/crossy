/**
 * View Tab Handler for Crossy Application
 * Handles browsing and viewing documents from MongoDB collections
 */

export class ViewTab {
    constructor() {
        this.elements = {
            collectionSelect: document.getElementById('collectionSelect'),
            documentSelect: document.getElementById('documentSelect'),
            documentViewer: document.getElementById('documentViewer'),
            documentViewerNote: document.getElementById('documentViewerNote'),
            collectionStatusNote: document.getElementById('collectionStatusNote'),
            prevPageBtn: document.getElementById('prevPageBtn'),
            nextPageBtn: document.getElementById('nextPageBtn'),
            paginationInfo: document.getElementById('paginationInfo'),
            saveDocumentBtn: document.getElementById('saveDocumentBtn'),
            deleteDocumentBtn: document.getElementById('deleteDocumentBtn')
        };
        
        // Verify all elements exist
        const missingElements = [];
        if (!this.elements.collectionSelect) missingElements.push('collectionSelect');
        if (!this.elements.documentSelect) missingElements.push('documentSelect');
        if (!this.elements.documentViewer) missingElements.push('documentViewer');
        if (!this.elements.documentViewerNote) missingElements.push('documentViewerNote');
        if (!this.elements.prevPageBtn) missingElements.push('prevPageBtn');
        if (!this.elements.nextPageBtn) missingElements.push('nextPageBtn');
        if (!this.elements.paginationInfo) missingElements.push('paginationInfo');
        
        if (missingElements.length > 0) {
            console.error('ViewTab: Missing required elements:', missingElements);
            console.error('ViewTab: Make sure the View tab HTML is properly loaded');
            // Don't throw - allow the app to continue, but log the error
        }
        
        this.currentCollection = null;
        this.currentDocumentId = null;
        this.documents = [];
        this.pagination = {
            skip: 0,
            limit: 20,
            totalCount: 0
        };
        
        // Only initialize listeners if elements exist
        if (this.elements.collectionSelect && this.elements.documentSelect) {
            this.initializeListeners();
        } else {
            console.warn('ViewTab: Cannot initialize listeners - required elements missing');
        }
    }
    
    initializeListeners() {
        // Re-check elements before setting up listeners
        this.ensureElements();
        
        // Listen for collection selection changes
        if (this.elements.collectionSelect && !this.elements.collectionSelect.hasAttribute('data-listener-attached')) {
            this.elements.collectionSelect.addEventListener('change', () => {
                this.handleCollectionChange();
            });
            this.elements.collectionSelect.setAttribute('data-listener-attached', 'true');
        }
        
        // Listen for document selection changes
        if (this.elements.documentSelect && !this.elements.documentSelect.hasAttribute('data-listener-attached')) {
            this.elements.documentSelect.addEventListener('change', () => {
                this.handleDocumentChange();
            });
            this.elements.documentSelect.setAttribute('data-listener-attached', 'true');
        }
        
        // Listen for pagination button clicks
        if (this.elements.prevPageBtn && !this.elements.prevPageBtn.hasAttribute('data-listener-attached')) {
            this.elements.prevPageBtn.addEventListener('click', () => {
                this.goToPreviousPage();
            });
            this.elements.prevPageBtn.setAttribute('data-listener-attached', 'true');
        }
        
        if (this.elements.nextPageBtn && !this.elements.nextPageBtn.hasAttribute('data-listener-attached')) {
            this.elements.nextPageBtn.addEventListener('click', () => {
                this.goToNextPage();
            });
            this.elements.nextPageBtn.setAttribute('data-listener-attached', 'true');
        }
        
        // Listen for save button clicks
        if (this.elements.saveDocumentBtn && !this.elements.saveDocumentBtn.hasAttribute('data-listener-attached')) {
            this.elements.saveDocumentBtn.addEventListener('click', () => {
                this.saveDocument();
            });
            this.elements.saveDocumentBtn.setAttribute('data-listener-attached', 'true');
        }
        
        // Listen for delete button clicks
        if (this.elements.deleteDocumentBtn && !this.elements.deleteDocumentBtn.hasAttribute('data-listener-attached')) {
            this.elements.deleteDocumentBtn.addEventListener('click', () => {
                this.deleteDocument();
            });
            this.elements.deleteDocumentBtn.setAttribute('data-listener-attached', 'true');
        }
        
        // Listen for changes in the document viewer to enable/disable save button
        if (this.elements.documentViewer && !this.elements.documentViewer.hasAttribute('data-listener-attached')) {
            this.elements.documentViewer.addEventListener('input', () => {
                this.updateSaveButtonState();
            });
            this.elements.documentViewer.setAttribute('data-listener-attached', 'true');
        }
    }
    
    ensureElements() {
        // Re-check all elements to ensure they're available
        if (!this.elements.collectionSelect) {
            this.elements.collectionSelect = document.getElementById('collectionSelect');
        }
        if (!this.elements.documentSelect) {
            this.elements.documentSelect = document.getElementById('documentSelect');
        }
        if (!this.elements.documentViewer) {
            this.elements.documentViewer = document.getElementById('documentViewer');
        }
        if (!this.elements.documentViewerNote) {
            this.elements.documentViewerNote = document.getElementById('documentViewerNote');
        }
        if (!this.elements.collectionStatusNote) {
            this.elements.collectionStatusNote = document.getElementById('collectionStatusNote');
        }
        if (!this.elements.prevPageBtn) {
            this.elements.prevPageBtn = document.getElementById('prevPageBtn');
        }
        if (!this.elements.nextPageBtn) {
            this.elements.nextPageBtn = document.getElementById('nextPageBtn');
        }
        if (!this.elements.paginationInfo) {
            this.elements.paginationInfo = document.getElementById('paginationInfo');
        }
        if (!this.elements.saveDocumentBtn) {
            this.elements.saveDocumentBtn = document.getElementById('saveDocumentBtn');
        }
        if (!this.elements.deleteDocumentBtn) {
            this.elements.deleteDocumentBtn = document.getElementById('deleteDocumentBtn');
        }
    }
    
    async handleCollectionChange() {
        // Re-check elements in case they weren't available during initialization
        if (!this.elements.collectionSelect) {
            this.elements.collectionSelect = document.getElementById('collectionSelect');
        }
        if (!this.elements.documentSelect) {
            this.elements.documentSelect = document.getElementById('documentSelect');
        }
        
        if (!this.elements.collectionSelect || !this.elements.documentSelect) {
            console.error('ViewTab: Required elements missing for collection change', {
                collectionSelect: !!this.elements.collectionSelect,
                documentSelect: !!this.elements.documentSelect
            });
            return;
        }
        
        const collectionName = this.elements.collectionSelect.value;
        console.log('ViewTab: Collection changed to:', collectionName);
        
        if (!collectionName) {
            // Reset state
            this.currentCollection = null;
            this.documents = [];
            this.pagination.skip = 0;
            this.pagination.totalCount = 0;
            if (this.elements.documentSelect) {
                this.elements.documentSelect.disabled = true;
                this.elements.documentSelect.innerHTML = '<option value="">Select a collection first...</option>';
            }
            if (this.elements.collectionStatusNote) {
                this.elements.collectionStatusNote.textContent = '';
            }
            this.updatePaginationUI();
            this.clearViewer();
            return;
        }
        
        this.currentCollection = collectionName;
        this.pagination.skip = 0; // Reset to first page
        await this.loadDocuments(collectionName);
    }
    
    async loadDocuments(collectionName) {
        // Re-check elements in case they weren't available during initialization
        if (!this.elements.documentSelect) {
            this.elements.documentSelect = document.getElementById('documentSelect');
        }
        if (!this.elements.documentViewerNote) {
            this.elements.documentViewerNote = document.getElementById('documentViewerNote');
        }
        
        if (!this.elements.documentSelect || !this.elements.documentViewerNote) {
            console.error('ViewTab: Required elements missing for loading documents', {
                documentSelect: !!this.elements.documentSelect,
                documentViewerNote: !!this.elements.documentViewerNote
            });
            return;
        }
        
        try {
            // Show loading state
            this.elements.documentSelect.disabled = true;
            this.elements.documentSelect.innerHTML = '<option value="">Loading documents...</option>';
            if (this.elements.collectionStatusNote) {
                this.elements.collectionStatusNote.textContent = 'Loading documents...';
            }
            this.updatePaginationUI();
            
            const skip = this.pagination.skip;
            const limit = this.pagination.limit;
            const url = `/api/collections/${collectionName}?skip=${skip}&limit=${limit}`;
            console.log('ViewTab: Fetching documents from:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('ViewTab: API error response:', response.status, errorText);
                if (response.status === 503) {
                    throw new Error('MongoDB is not connected. Please check your connection.');
                }
                throw new Error(`Failed to load documents: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('ViewTab: Received data from API:', data);
            
            // Handle both possible response formats for backward compatibility
            this.documents = data.documents || [];
            this.pagination.totalCount = data.total_count || data.totalCount || 0;
            console.log(`ViewTab: Parsed ${this.documents.length} documents (${this.pagination.totalCount} total)`);
            
            // Populate document select
            this.populateDocumentSelect(this.documents);
            
            // Update pagination UI
            this.updatePaginationUI();
            
            // Clear viewer
            this.clearViewer();
            
            if (this.documents.length === 0) {
                if (this.elements.collectionStatusNote) {
                    this.elements.collectionStatusNote.textContent = 'No documents found in this collection';
                }
            } else {
                if (this.elements.collectionStatusNote) {
                    this.elements.collectionStatusNote.textContent = `Showing ${this.documents.length} document(s). Select one to view.`;
                }
            }
            
        } catch (error) {
            console.error('Error loading documents:', error);
            if (this.elements.documentSelect) {
                this.elements.documentSelect.disabled = true;
                this.elements.documentSelect.innerHTML = `<option value="">Error: ${error.message}</option>`;
            }
            if (this.elements.collectionStatusNote) {
                this.elements.collectionStatusNote.textContent = `Error: ${error.message}`;
            }
            this.updatePaginationUI();
            this.clearViewer();
        }
    }
    
    populateDocumentSelect(documents) {
        // Re-check element in case it wasn't available during initialization
        if (!this.elements.documentSelect) {
            this.elements.documentSelect = document.getElementById('documentSelect');
        }
        
        if (!this.elements.documentSelect) {
            console.error('ViewTab: documentSelect element missing');
            return;
        }
        
        this.elements.documentSelect.innerHTML = '<option value="">Select a document...</option>';
        
        if (documents.length === 0) {
            this.elements.documentSelect.disabled = true;
            console.log('ViewTab: No documents to populate, keeping dropdown disabled');
            return;
        }
        
        documents.forEach((doc) => {
            const option = document.createElement('option');
            // Handle both _id as string or object
            const docId = doc._id ? (typeof doc._id === 'string' ? doc._id : String(doc._id)) : null;
            option.value = docId || '';
            // Show document ID prominently
            option.textContent = docId || 'Unknown ID';
            this.elements.documentSelect.appendChild(option);
        });
        
        // Enable the dropdown after populating
        this.elements.documentSelect.disabled = false;
        console.log(`ViewTab: Populated ${documents.length} documents, dropdown enabled`);
    }
    
    async handleDocumentChange() {
        const documentId = this.elements.documentSelect.value;
        
        if (!documentId || !this.currentCollection) {
            this.clearViewer();
            return;
        }
        
        await this.loadDocument(this.currentCollection, documentId);
    }
    
    async loadDocument(collectionName, documentId) {
        if (!this.elements.documentViewer || !this.elements.documentViewerNote) {
            console.error('ViewTab: Required elements missing for loading document');
            return;
        }
        
        try {
            // Show loading state
            this.elements.documentViewer.value = '';
            this.elements.documentViewerNote.textContent = 'Loading document...';
            this.updateSaveButtonState();
            
            const response = await fetch(`/api/collections/${collectionName}/${documentId}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Document not found');
                }
                if (response.status === 503) {
                    throw new Error('MongoDB is not connected. Please check your connection.');
                }
                throw new Error(`Failed to load document: ${response.statusText}`);
            }
            
            const document = await response.json();
            
            // Store current document ID
            this.currentDocumentId = documentId;
            
            // Display formatted JSON
            this.displayJson(document);
            
            if (this.elements.documentViewerNote) {
                this.elements.documentViewerNote.textContent = 'Document loaded successfully';
                this.elements.documentViewerNote.className = 'form-text mt-2';
            }
            
            this.updateSaveButtonState();
            
        } catch (error) {
            console.error('Error loading document:', error);
            if (this.elements.documentViewer) {
                this.elements.documentViewer.value = '';
            }
            if (this.elements.documentViewerNote) {
                this.elements.documentViewerNote.textContent = `Error: ${error.message}`;
            }
            this.currentDocumentId = null;
            this.updateSaveButtonState();
        }
    }
    
    displayJson(document) {
        if (!this.elements.documentViewer) {
            console.error('ViewTab: documentViewer element missing');
            return;
        }
        
        try {
            // Format JSON with proper indentation
            const formattedJson = JSON.stringify(document, null, 2);
            this.elements.documentViewer.value = formattedJson;
        } catch (error) {
            console.error('Error formatting JSON:', error);
            this.elements.documentViewer.value = 'Error formatting JSON';
            if (this.elements.documentViewerNote) {
                this.elements.documentViewerNote.textContent = `Error: ${error.message}`;
            }
        }
    }
    
    clearViewer() {
        if (this.elements.documentViewer) {
            this.elements.documentViewer.value = '';
        }
        if (this.elements.documentViewerNote) {
            this.elements.documentViewerNote.textContent = 'No document selected';
        }
        this.currentDocumentId = null;
        this.updateSaveButtonState();
    }
    
    updateSaveButtonState() {
        if (!this.elements.saveDocumentBtn) {
            return;
        }
        
        // Enable save button only if a document is loaded and viewer has content
        const hasDocument = this.currentDocumentId && this.currentCollection;
        const hasContent = this.elements.documentViewer && this.elements.documentViewer.value.trim().length > 0;
        
        this.elements.saveDocumentBtn.disabled = !(hasDocument && hasContent);
        
        // Enable delete button only if a document is loaded
        if (this.elements.deleteDocumentBtn) {
            this.elements.deleteDocumentBtn.disabled = !hasDocument;
        }
    }
    
    async saveDocument() {
        if (!this.currentCollection || !this.currentDocumentId) {
            this.showError('No document selected');
            return;
        }
        
        if (!this.elements.documentViewer) {
            this.showError('Document viewer not available');
            return;
        }
        
        const jsonText = this.elements.documentViewer.value.trim();
        if (!jsonText) {
            this.showError('Document is empty');
            return;
        }
        
        // Validate JSON
        let documentData;
        try {
            documentData = JSON.parse(jsonText);
        } catch (error) {
            this.showError(`Invalid JSON: ${error.message}`);
            return;
        }
        
        // Show loading state
        if (this.elements.saveDocumentBtn) {
            this.elements.saveDocumentBtn.disabled = true;
            this.elements.saveDocumentBtn.textContent = 'Saving...';
        }
        
        try {
            const response = await fetch(`/api/collections/${this.currentCollection}/${this.currentDocumentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(documentData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(errorData.detail || `Failed to save document: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Update the displayed document with the saved version
            if (result.document) {
                this.displayJson(result.document);
            }
            
            // Show success message
            if (this.elements.documentViewerNote) {
                this.elements.documentViewerNote.textContent = 'Document saved successfully';
                this.elements.documentViewerNote.className = 'form-text mt-2 text-success';
            }
            
            // Show notification toast if available
            if (window.crossyApp && window.crossyApp.showNotification) {
                window.crossyApp.showNotification('Success', 'Document updated successfully', 'success');
            }
            
        } catch (error) {
            console.error('Error saving document:', error);
            this.showError(`Failed to save document: ${error.message}`);
            
            // Show notification toast if available
            if (window.crossyApp && window.crossyApp.showNotification) {
                window.crossyApp.showNotification('Error', `Failed to save document: ${error.message}`, 'error');
            }
        } finally {
            // Reset button state
            if (this.elements.saveDocumentBtn) {
                this.elements.saveDocumentBtn.disabled = false;
                this.elements.saveDocumentBtn.textContent = 'Save Changes';
                this.updateSaveButtonState();
            }
        }
    }
    
    async deleteDocument() {
        if (!this.currentCollection || !this.currentDocumentId) {
            this.showError('No document selected');
            return;
        }
        
        // Confirm deletion
        if (!confirm(`Are you sure you want to delete this document?\n\nCollection: ${this.currentCollection}\nDocument ID: ${this.currentDocumentId}\n\nThis action cannot be undone.`)) {
            return;
        }
        
        // Show loading state
        if (this.elements.deleteDocumentBtn) {
            this.elements.deleteDocumentBtn.disabled = true;
            this.elements.deleteDocumentBtn.textContent = 'Deleting...';
        }
        
        try {
            const response = await fetch(`/api/collections/${this.currentCollection}/${this.currentDocumentId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(errorData.detail || `Failed to delete document: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Show success message
            if (this.elements.documentViewerNote) {
                this.elements.documentViewerNote.textContent = 'Document deleted successfully';
                this.elements.documentViewerNote.className = 'form-text mt-2 text-success';
            }
            
            // Show notification toast if available
            if (window.crossyApp && window.crossyApp.showNotification) {
                window.crossyApp.showNotification('Success', 'Document deleted successfully', 'success');
            }
            
            // Clear the viewer
            this.clearViewer();
            
            // Refresh the document list to remove the deleted document
            await this.loadDocuments(this.currentCollection);
            
            // Reset document select to empty
            if (this.elements.documentSelect) {
                this.elements.documentSelect.value = '';
            }
            
        } catch (error) {
            console.error('Error deleting document:', error);
            this.showError(`Failed to delete document: ${error.message}`);
            
            // Show notification toast if available
            if (window.crossyApp && window.crossyApp.showNotification) {
                window.crossyApp.showNotification('Error', `Failed to delete document: ${error.message}`, 'error');
            }
        } finally {
            // Reset button state
            if (this.elements.deleteDocumentBtn) {
                this.elements.deleteDocumentBtn.disabled = false;
                this.elements.deleteDocumentBtn.textContent = 'Delete';
                this.updateSaveButtonState();
            }
        }
    }
    
    showError(message) {
        if (this.elements.documentViewerNote) {
            this.elements.documentViewerNote.textContent = `Error: ${message}`;
            this.elements.documentViewerNote.className = 'form-text mt-2 text-danger';
        }
    }
    
    // Method to refresh current view (useful if data might have changed)
    async refresh() {
        if (this.currentCollection) {
            await this.loadDocuments(this.currentCollection);
        }
    }
    
    goToPreviousPage() {
        if (this.pagination.skip > 0) {
            this.pagination.skip = Math.max(0, this.pagination.skip - this.pagination.limit);
            if (this.currentCollection) {
                this.loadDocuments(this.currentCollection);
            }
        }
    }
    
    goToNextPage() {
        const maxSkip = Math.max(0, this.pagination.totalCount - this.pagination.limit);
        if (this.pagination.skip < maxSkip) {
            this.pagination.skip = Math.min(maxSkip, this.pagination.skip + this.pagination.limit);
            if (this.currentCollection) {
                this.loadDocuments(this.currentCollection);
            }
        }
    }
    
    updatePaginationUI() {
        if (!this.elements.prevPageBtn || !this.elements.nextPageBtn || !this.elements.paginationInfo) {
            return;
        }
        
        const { skip, limit, totalCount } = this.pagination;
        const currentPage = Math.floor(skip / limit) + 1;
        const totalPages = Math.ceil(totalCount / limit) || 1;
        const startItem = totalCount > 0 ? skip + 1 : 0;
        const endItem = Math.min(skip + limit, totalCount);
        
        // Update pagination info
        if (totalCount === 0) {
            this.elements.paginationInfo.textContent = 'No documents';
        } else {
            this.elements.paginationInfo.textContent = 
                `Showing ${startItem}-${endItem} of ${totalCount} (Page ${currentPage} of ${totalPages})`;
        }
        
        // Update button states
        this.elements.prevPageBtn.disabled = skip === 0;
        this.elements.nextPageBtn.disabled = skip + limit >= totalCount;
    }
}

