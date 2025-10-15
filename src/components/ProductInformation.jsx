import React from 'react';
import "./ProductInformation.css"

const ProductInformation = ({ productInfo, setProductInfo, bomData }) => {
  const uniqueSkus = [...new Set(bomData.map(item => item.sku).filter(Boolean))];

  const handleSkuSelect = (selectedSku) => {
    const item = bomData.find(item => item.sku === selectedSku);
    if (item) {
      setProductInfo({
        itemCode: item.itemCode || '',
        sku: selectedSku,
        productDescription: item.productDescription || '',
        category: item.category || '',
        approxPrice: item.approxPrice || '',
        orderLink: item.orderLink || ''
      });
    }
  };

  const clearForm = () => {
    setProductInfo({
      itemCode: '',
      sku: '',
      productDescription: '',
      category: '',
      approxPrice: '',
      orderLink: ''
    });
  };

  return (
    <div className="card product-info-card">
      <div className="card-header card-header-enhanced">
        <div className="header-content">
          <div className="header-icon">
            <i className="fas fa-cube"></i>
          </div>
          <div className="header-text">
            <h2>Product Information</h2>
            <p className="subtitle">Enter product details and specifications</p>
          </div>
        </div>
        <button 
          className="btn btn-outline btn-clear"
          onClick={clearForm}
          type="button"
        >
          <i className="fas fa-eraser"></i> Clear
        </button>
      </div>

      <div className="card-body">
        <div className="form-grid three-column">
          <div className="form-group floating-label">
            <input
              type="text"
              id="itemCode"
              value={productInfo.itemCode}
              onChange={(e) => setProductInfo({...productInfo, itemCode: e.target.value})}
              placeholder=" "
              className="form-input-modern"
              required
            />
            <label htmlFor="itemCode" className="floating-label-text">ITEM CODE</label>
            <div className="input-underline"></div>
          </div>

          <div className="form-group">
            <label htmlFor="skuDropdown" className="form-label-modern">SELECT SKU</label>
            <div className="select-wrapper">
              <select 
                id="skuDropdown"
                onChange={(e) => handleSkuSelect(e.target.value)}
                value=""
                className="form-select-modern"
              >
                <option value="">Choose from existing SKUs</option>
                {uniqueSkus.map(sku => (
                  <option key={sku} value={sku}>{sku}</option>
                ))}
              </select>
              <i className="fas fa-chevron-down select-arrow"></i>
            </div>
          </div>

          <div className="form-group floating-label">
            <input
              type="text"
              id="sku"
              value={productInfo.sku}
              onChange={(e) => setProductInfo({...productInfo, sku: e.target.value})}
              placeholder=" "
              className="form-input-modern"
              required
            />
            <label htmlFor="sku" className="floating-label-text">SKU NUMBER</label>
            <div className="input-underline"></div>
          </div>
        </div>

        <div className="form-grid two-column">
          <div className="form-group floating-label">
            <input
              type="text"
              id="category"
              value={productInfo.category}
              onChange={(e) => setProductInfo({...productInfo, category: e.target.value})}
              placeholder=" "
              className="form-input-modern"
            />
            <label htmlFor="category" className="floating-label-text">CATEGORY</label>
            <div className="input-underline"></div>
          </div>

          <div className="form-group floating-label">
            <input
              type="number"
              id="approxPrice"
              value={productInfo.approxPrice}
              onChange={(e) => setProductInfo({...productInfo, approxPrice: e.target.value})}
              placeholder=" "
              className="form-input-modern"
              step="0.01"
              min="0"
            />
            <label htmlFor="approxPrice" className="floating-label-text">APPROX. PRICE (₹)</label>
            <div className="input-underline"></div>
          </div>
        </div>

        <div className="form-group floating-label">
          <input
            type="url"
            id="orderLink"
            value={productInfo.orderLink}
            onChange={(e) => setProductInfo({...productInfo, orderLink: e.target.value})}
            placeholder=" "
            className="form-input-modern"
          />
          <label htmlFor="orderLink" className="floating-label-text">ORDER LINK (URL)</label>
          <div className="input-underline"></div>
        </div>

        <div className="form-group floating-label">
          <textarea
            id="productDescription"
            value={productInfo.productDescription}
            onChange={(e) => setProductInfo({...productInfo, productDescription: e.target.value})}
            placeholder=" "
            rows="3"
            className="form-textarea-modern"
            required
          />
          <label htmlFor="productDescription" className="floating-label-text">PRODUCT DESCRIPTION</label>
          <div className="input-underline"></div>
        </div>

        <div className="form-status">
          <div className="status-indicator">
            <div className={`status-dot ${productInfo.sku && productInfo.itemCode ? 'complete' : 'incomplete'}`}></div>
            <span className="status-text">
              {productInfo.sku && productInfo.itemCode ? 'Product information complete' : 'Product information incomplete'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductInformation;