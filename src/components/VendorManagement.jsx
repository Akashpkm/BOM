import React, { useState } from 'react';
import "./VendorManagement.css"

const VendorManagement = ({ vendors, setVendors }) => {
  const [newVendor, setNewVendor] = useState({ name: '', phone: '', address: '' });
  const [isExpanded, setIsExpanded] = useState(true);

  const addVendor = () => {
    if (!newVendor.name.trim()) {
      alert('Please enter vendor name');
      return;
    }

    const existingVendor = vendors.find(v => 
      v.name.toLowerCase() === newVendor.name.toLowerCase()
    );
    
    if (existingVendor) {
      alert('Vendor with this name already exists!');
      return;
    }

    setVendors([...vendors, { ...newVendor, id: Date.now() }]);
    setNewVendor({ name: '', phone: '', address: '' });
  };

  const updateVendor = (id, field, value) => {
    const updatedVendors = vendors.map(vendor => 
      vendor.id === id ? { ...vendor, [field]: value } : vendor
    );
    setVendors(updatedVendors);
  };

  const removeVendor = (id) => {
    if (!window.confirm('Are you sure you want to remove this vendor?')) {
      return;
    }
    setVendors(vendors.filter(vendor => vendor.id !== id));
  };

  const handleInputChange = (field, value) => {
    setNewVendor(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addVendor();
    }
  };

  return (
    <div className="card vendor-management-card">
      <div className="card-header card-header-enhanced">
        <div className="header-content">
          <div className="header-icon">
            <i className="fas fa-handshake"></i>
          </div>
          <div className="header-text">
            <h2>Vendor Management</h2>
            <p className="subtitle">Manage your supplier network</p>
          </div>
        </div>
        <div className="header-actions">
          <span className="badge badge-pill">{vendors.length} vendor(s)</span>
          <button 
            className="btn btn-icon"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="card-body">
          {/* Add New Vendor Form */}
          <div className="vendor-form-section">
            <div className="section-header">
              <h3><i className="fas fa-plus-circle"></i> Add New Vendor</h3>
              <div className="section-actions">
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => setNewVendor({ name: '', phone: '', address: '' })}
                >
                  <i className="fas fa-sync"></i> Reset
                </button>
              </div>
            </div>
            
            <div className="form-grid three-column">
              <div className="form-group floating-label">
                <input
                  type="text"
                  id="vendorName"
                  placeholder=" "
                  value={newVendor.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="form-input-modern"
                  required
                />
                <label htmlFor="vendorName" className="floating-label-text">Vendor Name *</label>
                <div className="input-underline"></div>
              </div>
              
              <div className="form-group floating-label">
                <input
                  type="text"
                  id="vendorPhone"
                  placeholder=" "
                  value={newVendor.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="form-input-modern"
                />
                <label htmlFor="vendorPhone" className="floating-label-text">Phone Number</label>
                <div className="input-underline"></div>
              </div>
              
              <div className="form-group">
                <button className="btn btn-primary btn-add-vendor" onClick={addVendor}>
                  <i className="fas fa-plus"></i>
                  Add Vendor
                </button>
              </div>
            </div>
            
            <div className="form-group floating-label">
              <input
                type="text"
                id="vendorAddress"
                placeholder=" "
                value={newVendor.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                onKeyPress={handleKeyPress}
                className="form-input-modern"
              />
              <label htmlFor="vendorAddress" className="floating-label-text">Address</label>
              <div className="input-underline"></div>
            </div>
          </div>

          {/* Vendors List */}
          <div className="vendor-list-section">
            <div className="section-header">
              <h3><i className="fas fa-list-check"></i> Vendor Directory</h3>
              <span className="vendor-count">{vendors.length} vendors</span>
            </div>
            
            {vendors.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <i className="fas fa-users"></i>
                </div>
                <h4>No Vendors Added</h4>
                <p>Start by adding your first vendor using the form above.</p>
              </div>
            ) : (
              <div className="vendors-grid">
                {vendors.map((vendor, index) => (
                  <div key={vendor.id} className="vendor-card">
                    <div className="vendor-card-header">
                      <div className="vendor-avatar">
                        {vendor.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="vendor-info">
                        <h4 className="vendor-name">{vendor.name || 'Unnamed Vendor'}</h4>
                        <span className="vendor-id">Vendor #{index + 1}</span>
                      </div>
                      <button 
                        className="btn btn-icon btn-danger"
                        onClick={() => removeVendor(vendor.id)}
                        title="Remove vendor"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    
                    <div className="vendor-details">
                      <div className="detail-item">
                        <i className="fas fa-phone"></i>
                        <input
                          type="text"
                          value={vendor.phone}
                          onChange={(e) => updateVendor(vendor.id, 'phone', e.target.value)}
                          placeholder="Add phone number"
                          className="vendor-input"
                        />
                      </div>
                      
                      <div className="detail-item">
                        <i className="fas fa-map-marker-alt"></i>
                        <textarea
                          value={vendor.address}
                          onChange={(e) => updateVendor(vendor.id, 'address', e.target.value)}
                          placeholder="Add address"
                          rows="2"
                          className="vendor-textarea"
                        />
                      </div>
                    </div>
                    
                    <div className="vendor-card-footer">
                      <span className="last-updated">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Validation Message */}
          {vendors.length === 0 && (
            <div className="validation-message warning">
              <i className="fas fa-exclamation-circle"></i>
              <div className="message-content">
                <strong>Action Required</strong>
                <p>At least one vendor is required to save the record.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VendorManagement;