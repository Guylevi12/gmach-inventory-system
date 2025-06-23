import React, { useState } from 'react';
import BarcodeScanner from "../BarcodeScanner";
import { getItemByItemId } from '@/services/firebase/itemsService';
import ScanResultModal from './ScanResultModal';

const NewLoanModal = ({
  showCatalogPopup,
  setShowCatalogPopup,
  searchTerm,
  setSearchTerm,
  availableItems,
  toggleSelectItem,
  changeQty,
  form,
  loadingItems,
  setAvailableItems
}) => {
  const [scanning, setScanning] = useState(false);
  const [scannedItem, setScannedItem] = useState(null);

  if (!showCatalogPopup) return null;

  const handleScanSuccess = async (decodedText) => {
    try {
      const item = await getItemByItemId(decodedText);

      const alreadySelected = availableItems.some(it => it.ItemId === item.ItemId && it.selected);
      if (alreadySelected) {
        alert("המוצר כבר קיים ברשימה");
        setScanning(false);
        return;
      }

      if (item.quantity > 0) {
        setScannedItem(item);
        setScanning(false);
      } else {
        alert("המוצר לא זמין במלאי");
        setScanning(false);
      }
    } catch (err) {
      alert(err.message);
      setScanning(false);
    }
  };

  // Enhanced quantity change handler with validation
  const handleQuantityChange = (item, inputValue) => {
    let qty = parseInt(inputValue) || 0;
    
    // Ensure quantity doesn't exceed available amount
    if (qty > item.quantity) {
      qty = item.quantity;
    }
    
    // Ensure quantity is not negative
    if (qty < 0) {
      qty = 0;
    }
    
    changeQty(item.id, qty);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" dir="rtl">
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '1rem'
        }}>
          <button
            style={{ width: '180px' }}
            className="btn btn-gray"
            onClick={() => setScanning(true)}
          >
            סריקת ברקוד
          </button>
          <input
            type="text"
            placeholder="חיפוש מוצר..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px', border: '1px solid #ccc',
              borderRadius: '6px', width: '60%'
            }}
          />
        </div>

        <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>
          מוצרים זמינים ({form.pickupDate} → {form.returnDate})
        </h3>

        {loadingItems ? (
          <p style={{ textAlign: 'center' }}>טוען מוצרים…</p>
        ) : (
          <div className="modal-grid">
            {availableItems
              .filter(it => it.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(item => (
                <div key={item.id} className={`item-card ${item.selected ? 'selected' : ''}`}>
                  <img
                    src={item.imageUrl || '/no-image-available.png'}
                    alt={item.name}
                    className="item-image"
                  />
                  <h4>{item.name}</h4>
                  <p>זמין: {item.quantity}</p>
                  <p>מזהה מוצר: {item.ItemId}</p>

                  <div style={{ margin: '0.5rem 0' }}>
                    <label style={{ marginBottom: '0.3rem', display: 'block' }}>כמות:</label>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                      <button
                        onClick={() => handleQuantityChange(item, Math.max(0, item.selectedQty - 1))}
                        disabled={item.selectedQty <= 0}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          border: '1px solid #ccc',
                          backgroundColor: item.selectedQty <= 0 ? '#f5f5f5' : '#fff',
                          cursor: item.selectedQty <= 0 ? 'not-allowed' : 'pointer',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: item.selectedQty <= 0 ? '#ccc' : '#333'
                        }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={item.quantity}
                        value={item.selectedQty}
                        onChange={e => handleQuantityChange(item, e.target.value)}
                        onBlur={e => {
                          // Additional validation on blur to ensure the value is within bounds
                          const value = parseInt(e.target.value) || 0;
                          if (value > item.quantity) {
                            handleQuantityChange(item, item.quantity);
                          }
                        }}
                        style={{
                          width: '50px',
                          height: '30px',
                          padding: '5px',
                          textAlign: 'center',
                          borderRadius: '6px',
                          border: item.selectedQty > item.quantity ? '2px solid red' : '1px solid #ccc',
                          backgroundColor: item.selectedQty > 0 ? '#e3f2fd' : '#fff',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          // Hide the number input spinners completely
                          appearance: 'textfield',
                          MozAppearance: 'textfield'
                        }}
                      />
                      <button
                        onClick={() => handleQuantityChange(item, Math.min(item.quantity, item.selectedQty + 1))}
                        disabled={item.selectedQty >= item.quantity}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          border: '1px solid #ccc',
                          backgroundColor: item.selectedQty >= item.quantity ? '#f5f5f5' : '#fff',
                          cursor: item.selectedQty >= item.quantity ? 'not-allowed' : 'pointer',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: item.selectedQty >= item.quantity ? '#ccc' : '#333'
                        }}
                      >
                        +
                      </button>
                    </div>
                    {item.selectedQty > item.quantity && (
                      <div style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                        מקסימום: {item.quantity}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleSelectItem(item.id)}
                    className={`btn ${item.selected ? 'btn-red' : 'btn-blue'}`}
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    {item.selected ? '❌ הסר מוצר' : '🛒 בחר מוצר'}
                  </button>
                </div>
              ))}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-blue" onClick={() => setShowCatalogPopup(false)}>✔️ אישור</button>
          <button className="btn btn-gray" onClick={() => setShowCatalogPopup(false)}>❌ ביטול</button>
        </div>
      </div>

      {scanning && (
        <BarcodeScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setScanning(false)}
        />
      )}

      {scannedItem && (
        <ScanResultModal
          item={scannedItem}
          onCancel={() => {
            setScannedItem(null);
            setScanning(false);
          }}
          onConfirm={(qty) => {
            const updated = { ...scannedItem, selected: true, selectedQty: qty };
            setAvailableItems(prev =>
              prev.map(item =>
                item.ItemId === updated.ItemId
                  ? { ...item, selected: true, selectedQty: qty }
                  : item
              )
            );
            setScannedItem(null);
            setScanning(false);
          }}
        />
      )}
    </div>
  );
};

export default NewLoanModal;