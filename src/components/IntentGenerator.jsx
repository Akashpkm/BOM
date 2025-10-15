import React, { useState, useMemo, useEffect } from 'react';
import "./IntentGenerator.css"

const IntentGenerator = ({ bomData, isOpen, onClose, onPrint }) => {
  const [selectedProducts, setSelectedProducts] = useState({});
  const [quantities, setQuantities] = useState({});
  const [selectedVendors, setSelectedVendors] = useState({});
  const [intentData, setIntentData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 12; // Reduced for better performance

  // Get unique categories for filter
  const categories = useMemo(() => {
    return [...new Set(bomData.map(item => item.category).filter(Boolean))];
  }, [bomData]);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return bomData.filter(product => {
      const matchesSearch = searchTerm === '' || 
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productDescription?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [bomData, searchTerm, selectedCategory]);

  // Paginate products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const handleProductSelect = (productId, checked) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: checked
    }));
    
    if (!checked) {
      setQuantities(prev => {
        const newQuantities = { ...prev };
        delete newQuantities[productId];
        return newQuantities;
      });
      setSelectedVendors(prev => {
        const newVendors = { ...prev };
        delete newVendors[productId];
        return newVendors;
      });
    } else {
      setQuantities(prev => ({
        ...prev,
        [productId]: 1
      }));
      // Set first vendor as default if available
      const product = bomData.find(p => p.id === productId);
      if (product && product.vendors && product.vendors.length > 0) {
        setSelectedVendors(prev => ({
          ...prev,
          [productId]: product.vendors[0].name
        }));
      }
    }
  };

  const handleQuantityChange = (productId, quantity) => {
    const qty = Math.max(1, parseInt(quantity) || 1);
    setQuantities(prev => ({
      ...prev,
      [productId]: qty
    }));
  };

  const handleVendorChange = (productId, vendorName) => {
    setSelectedVendors(prev => ({
      ...prev,
      [productId]: vendorName
    }));
  };

  const generateIntent = async () => {
    const selectedCount = Object.values(selectedProducts).filter(Boolean).length;
    if (selectedCount === 0) {
      alert('Please select at least one product.');
      return;
    }

    setIsLoading(true);
    
    // Simulate processing time for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const generatedData = Object.keys(selectedProducts)
      .filter(productId => selectedProducts[productId])
      .map((productId, index) => {
        const product = bomData.find(p => p.id === productId);
        const quantity = quantities[productId] || 1;
        const price = parseFloat(product.approxPrice) || 0;
        const total = quantity * price;
        const vendorName = selectedVendors[productId] || 
          (product.vendors && product.vendors.length > 0 ? product.vendors[0].name : 'No Vendor');

        return {
          sno: index + 1,
          partNumber: product.itemCode || '-',
          sku: product.sku || '-',
          productDescription: product.productDescription || '-',
          quantity: quantity,
          vendorName: vendorName,
          price: price,
          total: total
        };
      });

    setIntentData(generatedData);
    setShowPreview(true);
    setIsLoading(false);
  };

  const calculateGrandTotal = () => {
    return intentData.reduce((total, item) => total + item.total, 0);
  };

  const calculateCurrentTotal = () => {
    return Object.keys(selectedProducts)
      .filter(id => selectedProducts[id])
      .reduce((total, productId) => {
        const product = bomData.find(p => p.id === productId);
        const quantity = quantities[productId] || 1;
        const price = parseFloat(product?.approxPrice) || 0;
        return total + (price * quantity);
      }, 0);
  };

  const handlePrint = () => {
    onPrint(intentData);
  };

  const clearAllSelections = () => {
    setSelectedProducts({});
    setQuantities({});
    setSelectedVendors({});
    setIntentData([]);
    setShowPreview(false);
  };

  const selectAllOnPage = () => {
    const newSelected = { ...selectedProducts };
    paginatedProducts.forEach(product => {
      newSelected[product.id] = true;
      if (!quantities[product.id]) {
        setQuantities(prev => ({ ...prev, [product.id]: 1 }));
      }
      if (!selectedVendors[product.id] && product.vendors && product.vendors.length > 0) {
        setSelectedVendors(prev => ({ ...prev, [product.id]: product.vendors[0].name }));
      }
    });
    setSelectedProducts(newSelected);
  };

  const deselectAllOnPage = () => {
    const newSelected = { ...selectedProducts };
    paginatedProducts.forEach(product => {
      delete newSelected[product.id];
    });
    setSelectedProducts(newSelected);
  };

  const selectedCount = Object.values(selectedProducts).filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay intent-generator-modal">
      <div className="modal-content xlarge-modal">
        <div className="modal-header">
          <div className="modal-title-section">
            <div className="title-icon">
              <i className="fas fa-file-invoice-dollar"></i>
            </div>
            <div className="title-content">
              <h2>Generate Purchase Intent</h2>
              <p className="modal-subtitle">Select products and vendors to create purchase order</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          {/* Quick Stats Bar */}
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-number">{filteredProducts.length}</span>
              <span className="stat-label">Available Products</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{selectedCount}</span>
              <span className="stat-label">Selected Items</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">₹{calculateCurrentTotal().toFixed(2)}</span>
              <span className="stat-label">Current Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{categories.length}</span>
              <span className="stat-label">Categories</span>
            </div>
          </div>

          {/* Product Selection Section */}
          <div className="selection-section">
            <div className="section-header">
              <div className="section-title">
                <h3><i className="fas fa-boxes"></i> Product Selection</h3>
                <span className="section-subtitle">
                  Page {currentPage} of {totalPages} • {paginatedProducts.length} products
                </span>
              </div>
              <div className="selection-actions">
                <div className="bulk-actions">
                  <button className="btn btn-outline btn-sm" onClick={selectAllOnPage}>
                    <i className="fas fa-check-square"></i> Select Page
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={deselectAllOnPage}>
                    <i className="fas fa-times-circle"></i> Deselect Page
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={clearAllSelections}>
                    <i className="fas fa-broom"></i> Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Filters */}
            <div className="filters-container">
              <div className="filters-row">
                <div className="search-filter">
                  <i className="fas fa-search search-icon"></i>
                  <input
                    type="text"
                    placeholder="Search by SKU, Item Code, or Description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  {searchTerm && (
                    <button 
                      className="clear-search"
                      onClick={() => setSearchTerm('')}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
                
                <div className="category-filter">
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down select-arrow"></i>
                </div>

                <div className="view-toggle">
                  <button 
                    className={`view-btn ${!showPreview ? 'active' : ''}`}
                    onClick={() => setShowPreview(false)}
                  >
                    <i className="fas fa-th-list"></i> Selection
                  </button>
                  <button 
                    className={`view-btn ${showPreview ? 'active' : ''}`}
                    onClick={() => setShowPreview(true)}
                    disabled={intentData.length === 0}
                  >
                    <i className="fas fa-file-alt"></i> Preview
                  </button>
                </div>
              </div>
              
              <div className="filter-info">
                Showing {filteredProducts.length} products
                {searchTerm && ` matching "${searchTerm}"`}
                {selectedCategory && ` in ${selectedCategory}`}
              </div>
            </div>

            {/* Products Grid with Toggle View */}
            <div className={`products-container ${showPreview ? 'hidden' : ''}`}>
              <div className="products-grid">
                {paginatedProducts.map(product => (
                  <div 
                    key={product.id} 
                    className={`product-select-card ${selectedProducts[product.id] ? 'selected' : ''}`}
                  >
                    <div className="product-select-header">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={!!selectedProducts[product.id]}
                          onChange={(e) => handleProductSelect(product.id, e.target.checked)}
                        />
                        <span className="checkmark"></span>
                      </label>
                      <div className="product-info">
                        <div className="product-main">
                          <div className="product-codes">
                            <strong className="product-sku">{product.sku || 'No SKU'}</strong>
                            <span className="product-manufacture">{product.itemCode || 'No Item Code'}</span>
                          </div>
                          <div className="product-price-tag">
                            ₹{parseFloat(product.approxPrice || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="product-description">
                          {product.productDescription || 'No description available'}
                        </div>
                        <div className="product-meta">
                          <span className="product-category">{product.category || 'Uncategorized'}</span>
                          <div className="vendor-count">
                            <i className="fas fa-users"></i>
                            {product.vendors?.length || 0} vendors
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {selectedProducts[product.id] && (
                      <div className="product-details">
                        <div className="detail-row">
                          <label>Quantity:</label>
                          <div className="quantity-controls">
                            <button 
                              className="qty-btn"
                              onClick={() => handleQuantityChange(product.id, (quantities[product.id] || 1) - 1)}
                            >
                              <i className="fas fa-minus"></i>
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={quantities[product.id] || 1}
                              onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                              className="quantity-input"
                            />
                            <button 
                              className="qty-btn"
                              onClick={() => handleQuantityChange(product.id, (quantities[product.id] || 1) + 1)}
                            >
                              <i className="fas fa-plus"></i>
                            </button>
                          </div>
                        </div>
                        
                        <div className="detail-row">
                          <label>Vendor:</label>
                          <select
                            value={selectedVendors[product.id] || ''}
                            onChange={(e) => handleVendorChange(product.id, e.target.value)}
                            className="vendor-select"
                          >
                            <option value="">Select Vendor</option>
                            {product.vendors && product.vendors.map((vendor, index) => (
                              <option key={index} value={vendor.name}>
                                {vendor.name} {vendor.phone ? `(${vendor.phone})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="calculation">
                          <span>Unit: <strong>₹{(parseFloat(product.approxPrice) || 0).toFixed(2)}</strong></span>
                          <span>Total: <strong>₹{((parseFloat(product.approxPrice) || 0) * (quantities[product.id] || 1)).toFixed(2)}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="pagination-container">
                  <div className="pagination-info">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                  </div>
                  <div className="pagination">
                    <button 
                      className="btn btn-outline btn-sm pagination-btn"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <i className="fas fa-angle-double-left"></i>
                    </button>
                    <button 
                      className="btn btn-outline btn-sm pagination-btn"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <i className="fas fa-chevron-left"></i> Prev
                    </button>
                    
                    <div className="page-numbers">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button 
                      className="btn btn-outline btn-sm pagination-btn"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next <i className="fas fa-chevron-right"></i>
                    </button>
                    <button 
                      className="btn btn-outline btn-sm pagination-btn"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="fas fa-angle-double-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Generated Intent Preview */}
            {showPreview && intentData.length > 0 && (
              <div className="intent-preview">
                <div className="section-header">
                  <div className="section-title">
                    <h3><i className="fas fa-eye"></i> Intent Preview</h3>
                    <span className="section-subtitle">
                      {intentData.length} items • Total: ₹{calculateGrandTotal().toFixed(2)}
                    </span>
                  </div>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowPreview(false)}
                  >
                    <i className="fas fa-edit"></i> Back to Selection
                  </button>
                </div>
                <div className="preview-table-container">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th width="5%">S.NO</th>
                        <th width="15%">MANUFACTURE</th>
                        <th width="12%">SKU</th>
                        <th width="25%">DESCRIPTION</th>
                        <th width="18%">VENDOR NAME</th>
                        <th width="8%">QTY</th>
                        <th width="8%">PRICE (₹)</th>
                        <th width="9%">TOTAL (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {intentData.map((item, index) => (
                        <tr key={index}>
                          <td className="text-center">{item.sno}</td>
                          <td className="text-nowrap">{item.partNumber}</td>
                          <td className="text-nowrap">{item.sku}</td>
                          <td className="text-left description-cell">{item.productDescription}</td>
                          <td className="text-left vendor-cell">{item.vendorName}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-right">₹{item.price.toFixed(2)}</td>
                          <td className="text-right">₹{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="total-row">
                        <td colSpan="6" className="text-right"><strong>Grand Total:</strong></td>
                        <td colSpan="2" className="text-right total-amount">
                          <strong>₹{calculateGrandTotal().toFixed(2)}</strong>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-info">
            {selectedCount > 0 && (
              <div className="selection-summary">
                <span className="selected-count">
                  <i className="fas fa-check-circle"></i>
                  {selectedCount} products selected
                </span>
                <span className="total-amount">
                  Total: <strong>₹{calculateCurrentTotal().toFixed(2)}</strong>
                </span>
              </div>
            )}
          </div>
          
          <div className="footer-actions">
            <button className="btn btn-outline" onClick={onClose}>
              <i className="fas fa-times"></i> Cancel
            </button>
            <button 
              className="btn btn-primary generate-btn"
              onClick={generateIntent}
              disabled={selectedCount === 0 || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="btn-spinner"></div>
                  Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-cogs"></i> 
                  {showPreview ? 'Regenerate Intent' : 'Generate Intent'}
                </>
              )}
            </button>
            {intentData.length > 0 && (
              <button className="btn btn-success" onClick={handlePrint}>
                <i className="fas fa-print"></i> Print Intent
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntentGenerator;