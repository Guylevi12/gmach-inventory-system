import React, { useState } from 'react';

const ScanResultModal = ({ item, onConfirm, onCancel }) => {
  const [quantity, setQuantity] = useState(1);

  const isValid = quantity >= 1 && quantity <= item.quantity;

  return (
    <div className="modal-overlay">
      <div className="modal-box" dir="rtl">
        <h3 style={{ textAlign: 'center' }}>{item.name}</h3>
        <img src={item.imageUrl} alt={item.name} style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
        <p>מזהה מוצר: {item.ItemId}</p>
        <p>כמות זמינה: {item.quantity}</p>

        <div style={{ marginTop: '1rem' }}>
          <label>בחר כמות:</label>
          <input
            type="number"
            value={quantity}
            min={1}
            max={item.quantity}
            onChange={e => setQuantity(+e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '0.5rem',
              border: !isValid ? '2px solid red' : '1px solid #ccc'
            }}
          />
          {!isValid && (
            <p style={{ color: 'red', marginTop: '0.5rem' }}>
              כמות לא תקינה. יש לבחור בין 1 ל־{item.quantity}
            </p>
          )}
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-red" onClick={onCancel}>ביטול</button>
          <button
            className="btn btn-green"
            onClick={() => onConfirm(quantity)}
            disabled={!isValid}
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanResultModal;
