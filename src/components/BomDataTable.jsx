import React, { useState } from 'react';
import "./BomDataTable.css";

const BomDataTable = ({ bomData, loadBOMData, onEditRecord, onDeleteSuccess, onGenerateIntent }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // ... (keep existing deleteRecord function)
  const deleteRecord = async (item) => {
    if (!window.confirm(`Are you sure you want to delete record ${item.id}?`)) {
      return;
    }

    setDeletingId(item.id);
    
    try {
      console.log('Attempting to delete record with ID:', item.id);
      
      const response = await fetch(`https://sheetdb.io/api/v1/za4jkitymn219/id/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Delete failed with status: ${response.status}, details: ${errorText}`);
      }

      const result = await response.json();
      console.log('Delete successful:', result);

      // Update local state immediately for better UX
      if (onDeleteSuccess) {
        onDeleteSuccess(item.id);
      }
      
      // Show success message
      alert(`Record ${item.id} deleted successfully!`);
      
      // Optional: Refresh data from server to ensure consistency
      setTimeout(() => {
        loadBOMData();
      }, 500);
      
    } catch (error) {
      console.error('Error deleting record:', error);
      
      let errorMessage = 'Error deleting record. ';
      if (error.message.includes('400')) {
        errorMessage += 'The server rejected the request. Please check if the record exists.';
      } else if (error.message.includes('404')) {
        errorMessage += 'Record not found. It may have been already deleted.';
      } else if (error.message.includes('500')) {
        errorMessage += 'Server error. Please try again later.';
      } else {
        errorMessage += 'Please check console for details.';
      }
      
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return bomData;
    
    return [...bomData].sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [bomData, sortConfig]);

  const filteredData = sortedData.filter(item =>
    Object.values(item).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <i className="fas fa-sort" style={{ opacity: 0.3 }}></i>;
    }
    return (
      <i 
        className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}
        style={{ color: 'var(--secondary-color)' }}
      ></i>
    );
  };

  // Function to display vendors in a formatted way
  const renderVendors = (vendors) => {
    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      return '-';
    }

    return (
      <div className="vendors-display">
        {vendors.map((vendor, index) => (
          <div key={index} className="vendor-item">
            <div><strong>{vendor.name || 'Unnamed Vendor'}</strong></div>
            <div>{vendor.phone || 'No phone'}</div>
            <div className="vendor-address">{vendor.address || 'No address'}</div>
            {index < vendors.length - 1 && <hr className="vendor-separator" />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2><i className="fas fa-table icon"></i>BOM Data ({filteredData.length} records)</h2>
        <div className="header-actions">
          <div className="search-container" style={{ minWidth: '250px', marginRight: '15px' }}>
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className="btn btn-primary"
            onClick={onGenerateIntent}
            title="Generate Purchase Intent"
          >
            <i className="fas fa-file-invoice"></i> Generate Intent
          </button>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                ID <SortIcon columnKey="id" />
              </th>
              <th onClick={() => handleSort('itemCode')} style={{ cursor: 'pointer' }}>
                ITEM CODE <SortIcon columnKey="itemCode" />
              </th>
              <th onClick={() => handleSort('sku')} style={{ cursor: 'pointer' }}>
                SKU <SortIcon columnKey="sku" />
              </th>
              <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                CATEGORY <SortIcon columnKey="category" />
              </th>
              <th onClick={() => handleSort('productDescription')} style={{ cursor: 'pointer' }}>
                DESCRIPTION <SortIcon columnKey="productDescription" />
              </th>
              <th onClick={() => handleSort('approxPrice')} style={{ cursor: 'pointer' }}>
                PRICE (₹) <SortIcon columnKey="approxPrice" />
              </th>
              <th>ORDER LINK</th>
              <th>VENDORS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>
                    {item.id || '-'}
                  </span>
                </td>
                <td>{item.itemCode || '-'}</td>
                <td>
                  <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                    {item.sku || '-'}
                  </span>
                </td>
                <td>
                  <span className="category-tag">{item.category || '-'}</span>
                </td>
                <td>{item.productDescription || '-'}</td>
                <td>
                  {item.approxPrice ? `₹${parseFloat(item.approxPrice).toFixed(2)}` : '-'}
                </td>
                <td>
                  {item.orderLink ? (
                    <a href={item.orderLink} target="_blank" rel="noopener noreferrer" className="order-link">
                      <i className="fas fa-external-link-alt"></i> Order
                    </a>
                  ) : '-'}
                </td>
                <td style={{ maxWidth: '300px' }}>
                  {renderVendors(item.vendors)}
                </td>
                <td>
                  <button 
                    className="btn btn-warning btn-sm"
                    onClick={() => onEditRecord(item)}
                    title="Edit record"
                    disabled={deletingId === item.id}
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteRecord(item)}
                    title="Delete record"
                    disabled={deletingId === item.id}
                    style={{ marginLeft: '5px' }}
                  >
                    {deletingId === item.id ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-trash"></i>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredData.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            color: '#6c757d',
            fontStyle: 'italic'
          }}>
            {searchTerm ? 'No records found matching your search.' : 'No records available.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default BomDataTable;