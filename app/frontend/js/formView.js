/**
 * Form View Handler for Crossy Application
 */

export class FormView {
    constructor() {
        this.elements = {
            // Vehicle fields
            licensePlate: document.getElementById('licensePlate'),
            vehicleType: document.getElementById('vehicleType'),
            ownerName: document.getElementById('ownerName'),
            registrationState: document.getElementById('registrationState'),
            expirationDate: document.getElementById('expirationDate'),
            passengerCount: document.getElementById('passengerCount'),
            
            // Crossing fields
            timestamp: document.getElementById('timestamp'),
            checkpoint: document.getElementById('checkpoint'),
            direction: document.getElementById('direction'),
            laneAssignment: document.getElementById('laneAssignment'),
            crossingPurpose: document.getElementById('crossingPurpose'),
            secondaryInspection: document.getElementById('secondaryInspection'),
            
            // Cargo fields
            cargoSection: document.getElementById('cargoSection'),
            manifestId: document.getElementById('manifestId'),
            cargoType: document.getElementById('cargoType'),
            containerId: document.getElementById('containerId'),
            hazardousMaterial: document.getElementById('hazardousMaterial')
        };
        
        this.initializeListeners();
    }
    
    initializeListeners() {
        // Listen for crossing purpose changes to show/hide cargo section
        this.elements.crossingPurpose.addEventListener('change', () => {
            this.toggleCargoSection();
        });
    }
    
    toggleCargoSection() {
        const purpose = this.elements.crossingPurpose.value;
        if (purpose === 'shipping') {
            this.elements.cargoSection.style.display = 'block';
        } else {
            this.elements.cargoSection.style.display = 'none';
        }
    }
    
    async populateDropdowns() {
        try {
            // Fetch and populate states
            const statesResponse = await fetch('/api/states');
            const statesData = await statesResponse.json();
            this.populateSelect(this.elements.registrationState, statesData.states);
            
            // Fetch and populate checkpoints
            const checkpointsResponse = await fetch('/api/checkpoints');
            const checkpointsData = await checkpointsResponse.json();
            this.populateSelect(this.elements.checkpoint, checkpointsData.checkpoints);
            
            // Fetch and populate cargo types
            const cargoResponse = await fetch('/api/cargo-types');
            const cargoData = await cargoResponse.json();
            this.populateSelect(this.elements.cargoType, cargoData.cargo_types);
        } catch (error) {
            console.error('Error populating dropdowns:', error);
        }
    }
    
    populateSelect(selectElement, options) {
        // Keep the first option (placeholder)
        const firstOption = selectElement.querySelector('option');
        selectElement.innerHTML = '';
        if (firstOption) {
            selectElement.appendChild(firstOption);
        }
        
        // Add options
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            selectElement.appendChild(optionElement);
        });
    }
    
    populateForm(data) {
        // Populate vehicle details
        if (data.vehicle) {
            this.elements.licensePlate.value = data.vehicle.license_plate_number || '';
            this.elements.vehicleType.value = data.vehicle.vehicle_type || '';
            this.elements.ownerName.value = data.vehicle.owner_name || '';
            this.elements.passengerCount.value = data.vehicle.passenger_count || 0;
            
            if (data.vehicle.registration_details) {
                this.elements.registrationState.value = data.vehicle.registration_details.state || '';
                this.elements.expirationDate.value = data.vehicle.registration_details.expiration_date || '';
            }
        }
        
        // Populate crossing event
        if (data.crossing) {
            // Convert ISO timestamp to datetime-local format
            if (data.crossing.timestamp) {
                const timestamp = this.isoToDatetimeLocal(data.crossing.timestamp);
                this.elements.timestamp.value = timestamp;
            }
            
            this.elements.checkpoint.value = data.crossing.interior_checkpoints || '';
            this.elements.direction.value = data.crossing.direction || '';
            this.elements.laneAssignment.value = data.crossing.lane_assignment || '';
            this.elements.crossingPurpose.value = data.crossing.crossing_purpose || '';
            this.elements.secondaryInspection.checked = data.crossing.secondary_inspection_flag || false;
        }
        
        // Toggle cargo section based on purpose
        this.toggleCargoSection();
        
        // Populate cargo if present
        if (data.cargo) {
            this.elements.manifestId.value = data.cargo.manifest_id || '';
            this.elements.cargoType.value = data.cargo.cargo_type || '';
            this.elements.containerId.value = data.cargo.container_id || '';
            this.elements.hazardousMaterial.checked = data.cargo.hazardous_material || false;
        } else {
            this.clearCargo();
        }
    }
    
    getFormData() {
        const data = {
            vehicle: {
                license_plate_number: this.elements.licensePlate.value,
                vehicle_type: this.elements.vehicleType.value,
                owner_name: this.elements.ownerName.value,
                registration_details: {
                    state: this.elements.registrationState.value,
                    expiration_date: this.elements.expirationDate.value
                },
                passenger_count: parseInt(this.elements.passengerCount.value) || 0
            },
            crossing: {
                timestamp: this.datetimeLocalToISO(this.elements.timestamp.value),
                interior_checkpoints: this.elements.checkpoint.value,
                direction: this.elements.direction.value,
                lane_assignment: parseInt(this.elements.laneAssignment.value) || 1,
                crossing_purpose: this.elements.crossingPurpose.value,
                secondary_inspection_flag: this.elements.secondaryInspection.checked
            },
            cargo: null
        };
        
        // Include cargo if purpose is shipping
        if (this.elements.crossingPurpose.value === 'shipping') {
            data.cargo = {
                manifest_id: this.elements.manifestId.value,
                cargo_type: this.elements.cargoType.value,
                hazardous_material: this.elements.hazardousMaterial.checked,
                container_id: this.elements.containerId.value
            };
        }
        
        return data;
    }
    
    validateForm() {
        const errors = [];
        
        // Validate license plate format
        const licensePlatePattern = /^[A-Z]{2}-[A-Z]{3}-[0-9]{3}$/;
        if (!licensePlatePattern.test(this.elements.licensePlate.value.toUpperCase())) {
            errors.push('License plate must be in format XX-YYY-123');
        }
        
        // Validate required fields
        if (!this.elements.vehicleType.value) {
            errors.push('Vehicle type is required');
        }
        
        if (!this.elements.ownerName.value.trim()) {
            errors.push('Owner name is required');
        }
        
        if (!this.elements.registrationState.value) {
            errors.push('Registration state is required');
        }
        
        if (!this.elements.expirationDate.value) {
            errors.push('Expiration date is required');
        }
        
        // Validate passenger count
        const passengerCount = parseInt(this.elements.passengerCount.value);
        if (isNaN(passengerCount) || passengerCount < 0) {
            errors.push('Passenger count must be a non-negative number');
        }
        
        // Validate crossing fields
        if (!this.elements.timestamp.value) {
            errors.push('Timestamp is required');
        }
        
        if (!this.elements.checkpoint.value) {
            errors.push('Checkpoint is required');
        }
        
        if (!this.elements.direction.value) {
            errors.push('Direction is required');
        }
        
        const lane = parseInt(this.elements.laneAssignment.value);
        if (isNaN(lane) || lane < 1 || lane > 10) {
            errors.push('Lane assignment must be between 1 and 10');
        }
        
        if (!this.elements.crossingPurpose.value) {
            errors.push('Crossing purpose is required');
        }
        
        // Validate cargo if shipping
        if (this.elements.crossingPurpose.value === 'shipping') {
            if (!this.elements.manifestId.value.trim()) {
                errors.push('Manifest ID is required for shipping');
            }
            
            if (!this.elements.cargoType.value) {
                errors.push('Cargo type is required for shipping');
            }
            
            if (!this.elements.containerId.value.trim()) {
                errors.push('Container ID is required for shipping');
            }
            
            if (this.elements.containerId.value.length !== 10) {
                errors.push('Container ID must be 10 characters');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    clearForm() {
        // Clear vehicle fields
        this.elements.licensePlate.value = '';
        this.elements.vehicleType.value = '';
        this.elements.ownerName.value = '';
        this.elements.registrationState.value = '';
        this.elements.expirationDate.value = '';
        this.elements.passengerCount.value = '';
        
        // Clear crossing fields
        this.elements.timestamp.value = '';
        this.elements.checkpoint.value = '';
        this.elements.direction.value = '';
        this.elements.laneAssignment.value = '';
        this.elements.crossingPurpose.value = '';
        this.elements.secondaryInspection.checked = false;
        
        // Clear cargo fields
        this.clearCargo();
        
        // Hide cargo section
        this.elements.cargoSection.style.display = 'none';
    }
    
    clearCargo() {
        this.elements.manifestId.value = '';
        this.elements.cargoType.value = '';
        this.elements.containerId.value = '';
        this.elements.hazardousMaterial.checked = false;
    }
    
    isoToDatetimeLocal(isoString) {
        if (!isoString) return '';
        // Convert ISO 8601 to datetime-local format (YYYY-MM-DDTHH:mm)
        return isoString.substring(0, 16);
    }
    
    datetimeLocalToISO(datetimeLocal) {
        if (!datetimeLocal) return '';
        // Convert datetime-local to ISO 8601 format
        return datetimeLocal + ':00Z';
    }
}

