import React, { useState, useEffect } from 'react';
import ProductInformation from './components/ProductInformation';
import VendorManagement from './components/VendorManagement';
import BomDataTable from './components/BomDataTable';
import IntentGenerator from './components/IntentGenerator';
import './App.css';

const SHEETDB_URL = 'https://sheetdb.io/api/v1/za4jkitymn219';

function App() {
  const [bomData, setBomData] = useState([]);
  const [productInfo, setProductInfo] = useState({
    itemCode: '',
    sku: '',
    productDescription: '',
    category: '',
    approxPrice: '',
    orderLink: ''
  });
  const [vendors, setVendors] = useState([]);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showIntentGenerator, setShowIntentGenerator] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    loadBOMData();
  }, []);

  const loadBOMData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(SHEETDB_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      const parsedData = data.map(item => ({
        ...item,
        vendors: parseVendorsFromString(item.vendors)
      }));
      
      setBomData(parsedData);
      showStatus(`Loaded ${parsedData.length} records successfully`, 'success');
    } catch (error) {
      console.error('Error loading BOM data:', error);
      showStatus('Error loading BOM data: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const parseVendorsFromString = (vendorsString) => {
    if (!vendorsString) return [];
    
    try {
      if (typeof vendorsString === 'string') {
        return vendorsString.split('|').map(vendorStr => {
          const [name, phone, address] = vendorStr.split(',');
          return { name: name || '', phone: phone || '', address: address || '' };
        });
      }
      return vendorsString;
    } catch (error) {
      console.error('Error parsing vendors:', error);
      return [];
    }
  };

  const vendorsToString = (vendorsArray) => {
    if (!vendorsArray || !Array.isArray(vendorsArray)) return '';
    
    return vendorsArray.map(vendor => 
      `${vendor.name || ''},${vendor.phone || ''},${vendor.address || ''}`
    ).join('|');
  };

  const showStatus = (message, type = 'success') => {
    setStatus({ message, type });
    setTimeout(() => setStatus({ message: '', type: '' }), 5000);
  };

  const handleDeleteSuccess = (deletedId) => {
    setBomData(prevData => prevData.filter(item => item.id !== deletedId));
  };

  const editRecord = (record) => {
    setEditingId(record.id);
    
    setProductInfo({
      itemCode: record.itemCode || '',
      sku: record.sku || '',
      productDescription: record.productDescription || '',
      category: record.category || '',
      approxPrice: record.approxPrice || '',
      orderLink: record.orderLink || ''
    });
    
    setVendors(record.vendors && record.vendors.length > 0 ? record.vendors : []);
    showStatus('Editing record. Update and save changes.', 'info');
  };

  const generateNewId = () => {
    if (bomData.length === 0) return '1';
    
    const maxId = Math.max(...bomData.map(item => {
      const idNum = parseInt(item.id);
      return isNaN(idNum) ? 0 : idNum;
    }));
    
    return (maxId + 1).toString();
  };

  const saveAllData = async () => {
    if (!productInfo.itemCode || !productInfo.sku || !productInfo.productDescription) {
      showStatus('Please fill in all product information fields', 'error');
      return;
    }

    if (vendors.length === 0) {
      showStatus('Please add at least one vendor', 'error');
      return;
    }

    if (!editingId) {
      const existingSku = bomData.find(item => 
        item.sku === productInfo.sku && item.id !== editingId
      );
      if (existingSku) {
        showStatus('SKU already exists. Please use a unique SKU.', 'error');
        return;
      }
    }

    const confirmMessage = editingId 
      ? `Are you sure you want to update record ${editingId}?`
      : 'Are you sure you want to save this new record?';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsLoading(true);
    try {
      const dataToSave = {
        itemCode: productInfo.itemCode,
        sku: productInfo.sku,
        productDescription: productInfo.productDescription,
        category: productInfo.category,
        approxPrice: productInfo.approxPrice,
        orderLink: productInfo.orderLink,
        vendors: vendorsToString(vendors)
      };

      if (editingId) {
        const response = await fetch(`${SHEETDB_URL}/id/${editingId}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ data: dataToSave })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        await response.json();
        showStatus('Record updated successfully!', 'success');
      } else {
        const newId = generateNewId();
        const dataWithId = {
          ...dataToSave,
          id: newId
        };

        const response = await fetch(SHEETDB_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ data: dataWithId })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        await response.json();
        showStatus(`New record saved successfully with ID: ${newId}`, 'success');
      }
      
      resetForm();
      setTimeout(() => {
        loadBOMData();
      }, 1000);
    } catch (error) {
      console.error('Error saving data:', error);
      showStatus('Error saving data: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setProductInfo({ 
      itemCode: '', 
      sku: '', 
      productDescription: '',
      category: '',
      approxPrice: '',
      orderLink: ''
    });
    setVendors([]);
    setEditingId(null);
  };

  const cancelEdit = () => {
    resetForm();
    showStatus('Edit cancelled', 'info');
  };

  const handleGenerateIntent = () => {
    setShowIntentGenerator(true);
  };

  const handlePrintIntent = (intentData) => {
    const printWindow = window.open('', '_blank');
    const grandTotal = intentData.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>RAW MATERIAL INDIAN NOTE</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0;
            padding: 20px;
            color: #000;
            font-size: 12px;
          }
          .company-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .document-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            flex-wrap: wrap;
          }
          .doc-info-item {
            margin-right: 20px;
          }
          .doc-info-label {
            font-weight: bold;
          }
          .document-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin: 20px 0;
            text-decoration: underline;
          }
          .intent-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
            font-size: 10px;
            table-layout: fixed;
          }
          .intent-table th, .intent-table td { 
            border: 1px solid #000; 
            padding: 6px; 
            text-align: center; 
            word-wrap: break-word;
          }
          .intent-table th { 
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
          }
          .signature-box {
            text-align: center;
            width: 23%;
          }
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 40px;
            padding-top: 5px;
          }
          .text-left { text-align: left; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .total-row {
            font-weight: bold;
            background-color: #f8f8f8;
          }
          @media print {
            body { margin: 0; padding: 15px; }
            .company-header { margin-bottom: 15px; }
            .intent-table { font-size: 9px; }
            .page-break { page-break-after: always; }
          }
        </style>
      </head>
      <body>
        <div class="company-header">
          <div class="company-name">KINYA MEDICAL SYSTEMS & SOLUTION</div>
        </div>

        <div class="document-info">
          <div class="doc-info-item">
            <span class="doc-info-label">DOC NO.</span>
            <span>RMSC/P/OSP21/02</span>
          </div>
          <div class="doc-info-item">
            <span class="doc-info-label">ISSUE NO</span>
            <span>01</span>
          </div>
          <div class="doc-info-item">
            <span class="doc-info-label">REVISION NO.</span>
            <span>00</span>
          </div>
          <div class="doc-info-item">
            <span class="doc-info-label">DATE</span>
            <span>${new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div class="document-title">RAW MATERIAL INDIAN NOTE</div>

        <table class="intent-table">
          <thead>
            <tr>
              <th width="5%">S.NO</th>
              <th width="15%">MANUFACTURE</th>
              <th width="12%">SKU</th>
              <th width="18%">VENDOR NAME</th>
              <th width="8%">QUANTITY</th>
              <th width="10%">PRICE (₹)</th>
              <th width="12%">TOTAL (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${intentData.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.partNumber || '-'}</td>
                <td>${item.sku || '-'}</td>
                <td class="text-left">${item.vendorName || 'No Vendor'}</td>
                <td>${item.quantity}</td>
                <td class="text-right">${typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}</td>
                <td class="text-right">${typeof item.total === 'number' ? item.total.toFixed(2) : '0.00'}</td>
              </tr>
            `).join('')}
            
            ${Array.from({ length: Math.max(0, 15 - intentData.length) }).map((_, index) => `
              <tr>
                <td>${intentData.length + index + 1}</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            `).join('')}
            
            <tr class="total-row">
              <td colspan="6" class="text-right"><strong>GRAND TOTAL:</strong></td>
              <td class="text-right"><strong>₹${grandTotal.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="signature-section">
          <div class="signature-box">
            <div>Prepared By</div>
            <div class="signature-line"></div>
            <div>Name & Signature with date</div>
          </div>
          <div class="signature-box">
            <div>Department</div>
            <div class="signature-line"></div>
          </div>
          <div class="signature-box">
            <div>Approved by</div>
            <div class="signature-line"></div>
            <div>Name & Signature with date</div>
          </div>
          <div class="signature-box">
            <div>Processed By</div>
            <div class="signature-line"></div>
            <div>Name & Signature with date</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 1000);
          }
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="app">
      {/* Enhanced Header */}
      <header className="app-header">
        <div className="header-background"></div>
        <div className="container">
          <div className="header-content">
            <div className="header-brand">
              <div className="brand-icon">
                <i className="fas fa-boxes-stacked"></i>
              </div>
              <div className="brand-text">
                <h1>BOM Management System</h1>
                <p className="brand-subtitle">Streamline Your Bill of Materials Workflow</p>
              </div>
            </div>
            
            <div className="header-controls">
              <button 
                className="btn btn-icon btn-control"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <i className={`fas fa-${sidebarCollapsed ? 'panel-open' : 'panel-close'}`}></i>
              </button>
            </div>
          </div>

          {/* Enhanced Stats Bar */}
          <div className="stats-overview">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-database"></i>
              </div>
              <div className="stat-content">
                <span className="stat-number">{bomData.length}</span>
                <span className="stat-label">Total Products</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <span className="stat-number">{vendors.length}</span>
                <span className="stat-label">Active Vendors</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-tags"></i>
              </div>
              <div className="stat-content">
                <span className="stat-number">
                  {[...new Set(bomData.map(item => item.category))].length}
                </span>
                <span className="stat-label">Categories</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="stat-content">
                <span className="stat-number">
                  ₹{bomData.reduce((sum, item) => sum + (parseFloat(item.approxPrice) || 0), 0).toFixed(2)}
                </span>
                <span className="stat-label">Total Value</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Status Toast */}
        {status.message && (
          <div className={`status-toast status-${status.type}`}>
            <div className="status-icon">
              {status.type === 'success' && <i className="fas fa-check-circle"></i>}
              {status.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
              {status.type === 'info' && <i className="fas fa-info-circle"></i>}
            </div>
            <div className="status-content">
              <p>{status.message}</p>
            </div>
            <button 
              className="status-close"
              onClick={() => setStatus({ message: '', type: '' })}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {/* Editing Banner */}
        {editingId && (
          <div className="editing-banner">
            <div className="editing-content">
              <div className="editing-icon">
                <i className="fas fa-edit"></i>
              </div>
              <div className="editing-text">
                <h4>Editing Mode Active</h4>
                <p>You are currently updating Record ID: <strong>{editingId}</strong></p>
              </div>
            </div>
            <div className="editing-actions">
              <button className="btn btn-outline btn-sm" onClick={cancelEdit}>
                <i className="fas fa-times"></i> Cancel Edit
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Processing your request...</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="app-main">
          <div className={`content-grid ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Sidebar Section */}
            <div className="sidebar-column">
              <ProductInformation 
                productInfo={productInfo} 
                setProductInfo={setProductInfo} 
                bomData={bomData}
              />
              
              <VendorManagement 
                vendors={vendors} 
                setVendors={setVendors}
              />
            </div>
            
            {/* Main Content Section */}
            <div className="main-column">
              <BomDataTable 
                bomData={bomData} 
                loadBOMData={loadBOMData}
                onEditRecord={editRecord}
                onDeleteSuccess={handleDeleteSuccess}
                onGenerateIntent={handleGenerateIntent}
              />
            </div>
          </div>

          {/* Action Section */}
          <div className="action-section">
            <div className="action-header">
              <h3><i className="fas fa-rocket"></i> Quick Actions</h3>
              <div className="form-status">
                <div className="status-item">
                  <div className={`status-indicator ${productInfo.itemCode && productInfo.sku ? 'complete' : 'incomplete'}`}></div>
                  <span>Product Information</span>
                </div>
                <div className="status-item">
                  <div className={`status-indicator ${vendors.length > 0 ? 'complete' : 'incomplete'}`}></div>
                  <span>Vendor Management</span>
                </div>
                <div className="status-item">
                  <div className="status-indicator complete"></div>
                  <span>BOM Data ({bomData.length} records)</span>
                </div>
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                className="btn btn-primary btn-lg btn-save" 
                onClick={saveAllData}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="button-spinner"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    {editingId ? 'UPDATE RECORD' : 'SAVE ALL DATA'}
                  </>
                )}
              </button>
              
              <button 
                className="btn btn-outline btn-lg" 
                onClick={editingId ? cancelEdit : resetForm}
                disabled={isLoading}
              >
                <i className="fas fa-times"></i>
                {editingId ? 'CANCEL EDIT' : 'RESET FORM'}
              </button>

              <button 
                className="btn btn-secondary btn-refresh" 
                onClick={loadBOMData}
                disabled={isLoading}
              >
                <i className="fas fa-refresh"></i>
                Refresh Data
              </button>

              <button 
                className="btn btn-success btn-intent"
                onClick={handleGenerateIntent}
                disabled={bomData.length === 0}
              >
                <i className="fas fa-file-invoice-dollar"></i>
                Generate Intent
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Intent Generator Modal */}
      <IntentGenerator 
        bomData={bomData}
        isOpen={showIntentGenerator}
        onClose={() => setShowIntentGenerator(false)}
        onPrint={handlePrintIntent}
      />
    </div>
  );
}

export default App;