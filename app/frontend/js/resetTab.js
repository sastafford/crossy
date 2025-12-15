/**
 * Reset Tab Handler for Crossy Application
 * Handles resetting MongoDB collections
 */

export class ResetTab {
    constructor() {
        this.elements = {
            resetBtn: document.getElementById('resetBtn'),
            resetStatus: document.getElementById('resetStatus')
        };
        
        // Verify elements exist
        if (!this.elements.resetBtn) {
            console.error('ResetTab: Missing resetBtn element');
        }
        if (!this.elements.resetStatus) {
            console.error('ResetTab: Missing resetStatus element');
        }
        
        // Initialize listeners if elements exist
        if (this.elements.resetBtn) {
            this.initializeListeners();
        }
    }
    
    initializeListeners() {
        // Listen for reset button clicks
        if (this.elements.resetBtn && !this.elements.resetBtn.hasAttribute('data-listener-attached')) {
            this.elements.resetBtn.addEventListener('click', () => {
                this.handleReset();
            });
            this.elements.resetBtn.setAttribute('data-listener-attached', 'true');
        }
    }
    
    async handleReset() {
        // Confirm reset action
        const confirmed = confirm(
            'Are you sure you want to reset all collections?\n\n' +
            'This will permanently delete all documents from:\n' +
            '• Vehicle\n' +
            '• Crossing\n' +
            '• Cargo Manifest\n\n' +
            'This action cannot be undone.'
        );
        
        if (!confirmed) {
            return;
        }
        
        // Show loading state
        if (this.elements.resetBtn) {
            this.elements.resetBtn.disabled = true;
            this.elements.resetBtn.textContent = 'Resetting...';
        }
        
        if (this.elements.resetStatus) {
            this.elements.resetStatus.innerHTML = '<div class="text-info">Resetting collections...</div>';
        }
        
        try {
            const response = await fetch('/api/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(errorData.detail || `Failed to reset collections: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Show success message
            if (this.elements.resetStatus) {
                this.elements.resetStatus.innerHTML = 
                    '<div class="text-success"><strong>Success!</strong> All collections have been reset.</div>';
            }
            
            // Show notification toast if available
            if (window.crossyApp && window.crossyApp.showNotification) {
                window.crossyApp.showNotification(
                    'Success', 
                    'All collections have been reset successfully', 
                    'success'
                );
            }
            
        } catch (error) {
            console.error('Error resetting collections:', error);
            
            // Show error message
            if (this.elements.resetStatus) {
                this.elements.resetStatus.innerHTML = 
                    `<div class="text-danger"><strong>Error:</strong> ${error.message}</div>`;
            }
            
            // Show notification toast if available
            if (window.crossyApp && window.crossyApp.showNotification) {
                window.crossyApp.showNotification(
                    'Error', 
                    `Failed to reset collections: ${error.message}`, 
                    'error'
                );
            }
        } finally {
            // Reset button state
            if (this.elements.resetBtn) {
                this.elements.resetBtn.disabled = false;
                this.elements.resetBtn.textContent = 'Reset';
            }
        }
    }
}



