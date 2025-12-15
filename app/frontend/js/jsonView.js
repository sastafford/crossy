/**
 * JSON View Handler for Crossy Application
 */

export class JsonView {
    constructor() {
        this.elements = {
            vehicleJson: document.getElementById('vehicleJson'),
            crossingJson: document.getElementById('crossingJson'),
            cargoJson: document.getElementById('cargoJson'),
            cargoJsonSection: document.getElementById('cargoJsonSection'),
            cargoJsonNote: document.getElementById('cargoJsonNote')
        };
    }
    
    populateJson(data) {
        try {
            // Populate vehicle JSON
            if (data.vehicle) {
                this.elements.vehicleJson.value = JSON.stringify(data.vehicle, null, 2);
            }
            
            // Populate crossing JSON
            if (data.crossing) {
                this.elements.crossingJson.value = JSON.stringify(data.crossing, null, 2);
            }
            
            // Populate cargo JSON or show empty message
            if (data.cargo) {
                this.elements.cargoJson.value = JSON.stringify(data.cargo, null, 2);
                this.elements.cargoJsonNote.textContent = '';
            } else {
                this.elements.cargoJson.value = '';
                this.elements.cargoJsonNote.textContent = 'No cargo data (crossing purpose is not "shipping")';
            }
        } catch (error) {
            console.error('Error populating JSON view:', error);
        }
    }
    
    getJsonData() {
        try {
            const data = {
                vehicle: null,
                crossing: null,
                cargo: null
            };
            
            // Parse vehicle JSON
            if (this.elements.vehicleJson.value.trim()) {
                data.vehicle = JSON.parse(this.elements.vehicleJson.value);
            }
            
            // Parse crossing JSON
            if (this.elements.crossingJson.value.trim()) {
                data.crossing = JSON.parse(this.elements.crossingJson.value);
            }
            
            // Parse cargo JSON if present
            if (this.elements.cargoJson.value.trim()) {
                data.cargo = JSON.parse(this.elements.cargoJson.value);
            }
            
            return data;
        } catch (error) {
            throw new Error(`Invalid JSON: ${error.message}`);
        }
    }
    
    validateJson() {
        const errors = [];
        
        try {
            // Validate vehicle JSON
            if (this.elements.vehicleJson.value.trim()) {
                const vehicle = JSON.parse(this.elements.vehicleJson.value);
                
                // Check required fields
                if (!vehicle.license_plate_number) {
                    errors.push('Vehicle: license_plate_number is required');
                }
                if (!vehicle.vehicle_type) {
                    errors.push('Vehicle: vehicle_type is required');
                }
                if (!vehicle.owner_name) {
                    errors.push('Vehicle: owner_name is required');
                }
                if (!vehicle.registration_details) {
                    errors.push('Vehicle: registration_details is required');
                } else {
                    if (!vehicle.registration_details.state) {
                        errors.push('Vehicle: registration_details.state is required');
                    }
                    if (!vehicle.registration_details.expiration_date) {
                        errors.push('Vehicle: registration_details.expiration_date is required');
                    }
                }
                if (vehicle.passenger_count === undefined || vehicle.passenger_count === null) {
                    errors.push('Vehicle: passenger_count is required');
                }
                if (vehicle.passenger_count < 0) {
                    errors.push('Vehicle: passenger_count must be non-negative');
                }
            } else {
                errors.push('Vehicle JSON is empty');
            }
        } catch (e) {
            errors.push(`Vehicle JSON is invalid: ${e.message}`);
        }
        
        try {
            // Validate crossing JSON
            if (this.elements.crossingJson.value.trim()) {
                const crossing = JSON.parse(this.elements.crossingJson.value);
                
                // Check required fields
                if (!crossing.timestamp) {
                    errors.push('Crossing: timestamp is required');
                }
                if (!crossing.interior_checkpoints) {
                    errors.push('Crossing: interior_checkpoints is required');
                }
                if (!crossing.direction) {
                    errors.push('Crossing: direction is required');
                }
                if (crossing.lane_assignment === undefined || crossing.lane_assignment === null) {
                    errors.push('Crossing: lane_assignment is required');
                }
                if (crossing.lane_assignment < 1 || crossing.lane_assignment > 10) {
                    errors.push('Crossing: lane_assignment must be between 1 and 10');
                }
                if (!crossing.crossing_purpose) {
                    errors.push('Crossing: crossing_purpose is required');
                }
                if (crossing.secondary_inspection_flag === undefined || crossing.secondary_inspection_flag === null) {
                    errors.push('Crossing: secondary_inspection_flag is required');
                }
            } else {
                errors.push('Crossing JSON is empty');
            }
        } catch (e) {
            errors.push(`Crossing JSON is invalid: ${e.message}`);
        }
        
        try {
            // Validate cargo JSON if present
            if (this.elements.cargoJson.value.trim()) {
                const cargo = JSON.parse(this.elements.cargoJson.value);
                
                // Check required fields
                if (!cargo.manifest_id) {
                    errors.push('Cargo: manifest_id is required');
                }
                if (!cargo.cargo_type) {
                    errors.push('Cargo: cargo_type is required');
                }
                if (cargo.hazardous_material === undefined || cargo.hazardous_material === null) {
                    errors.push('Cargo: hazardous_material is required');
                }
                if (!cargo.container_id) {
                    errors.push('Cargo: container_id is required');
                }
            }
        } catch (e) {
            errors.push(`Cargo JSON is invalid: ${e.message}`);
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    clearJson() {
        this.elements.vehicleJson.value = '';
        this.elements.crossingJson.value = '';
        this.elements.cargoJson.value = '';
        this.elements.cargoJsonNote.textContent = '';
    }
    
    formatJson() {
        // Re-format JSON with proper indentation
        try {
            if (this.elements.vehicleJson.value.trim()) {
                const vehicle = JSON.parse(this.elements.vehicleJson.value);
                this.elements.vehicleJson.value = JSON.stringify(vehicle, null, 2);
            }
            
            if (this.elements.crossingJson.value.trim()) {
                const crossing = JSON.parse(this.elements.crossingJson.value);
                this.elements.crossingJson.value = JSON.stringify(crossing, null, 2);
            }
            
            if (this.elements.cargoJson.value.trim()) {
                const cargo = JSON.parse(this.elements.cargoJson.value);
                this.elements.cargoJson.value = JSON.stringify(cargo, null, 2);
            }
        } catch (error) {
            console.error('Error formatting JSON:', error);
        }
    }
}

