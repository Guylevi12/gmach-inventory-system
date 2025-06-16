import React from 'react';

const NewLoanModal = ({
  showCatalogPopup,
  setShowCatalogPopup,
  searchTerm,
  setSearchTerm,
  availableItems,
  toggleSelectItem,
  changeQty,
  form,
  loadingItems
}) => {
  if (!showCatalogPopup) return null;

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
            onClick={() => alert('סריקת ברקוד תתווסף בהמשך')}
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
    </div>
  );
};

export default NewLoanModal;
