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
      setScanning(false); // סגור סורק אוטומטית
    } else {
      alert("המוצר לא זמין במלאי");
      setScanning(false);
    }
  } catch (err) {
    alert(err.message);
    setScanning(false);
  }
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
                    <label style={{ marginRight: '0.5rem' }}>כמות:</label>
                    <input
                      type="number"
                      min={0}
                      max={item.quantity}
                      value={item.selectedQty}
                      onChange={e => changeQty(item.id, +e.target.value)}
                      style={{
                        width: '60px',
                        padding: '6px',
                        textAlign: 'center',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        backgroundColor: item.selectedQty > 0 ? '#e3f2fd' : '#fff'
                      }}
                    />
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
