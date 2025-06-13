import React from 'react';

const NewLoanForm = ({
  form,
  errors,
  handleChange,
  handleConfirm,
  handleClear,
  setShowCatalogPopup,
  saving
}) => {
  const fields = [
    { label: 'שם מתנדבת', name: 'volunteerName', required: true },
    { label: 'שם לקוח', name: 'clientName', required: true },
    { label: 'מקום מגורים', name: 'address', required: true },
    { label: 'מספר פלאפון', name: 'phone', required: true },
    { label: 'אימייל', name: 'email', required: false },
    { label: 'סוג האירוע', name: 'eventType', required: true },
    { label: 'תאריך לקיחת מוצרים', name: 'pickupDate', type: 'date', required: true },
    { label: 'תאריך האירוע', name: 'eventDate', type: 'date', required: true },
    { label: 'תאריך החזרת מוצרים', name: 'returnDate', type: 'date', required: true }
  ];

  return (
    <div className="loan-form-box">
      <h2 style={{ textAlign: 'center' }}>הזמנה חדשה</h2>
      {fields.map(({ label, name, type = 'text', required }) => (
        <div key={name} style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <label htmlFor={name} style={{
            display: 'block', marginBottom: '0.3rem', maxWidth: '400px',
            margin: '0 auto', textAlign: 'right'
          }}>
            {label}{required && ' *'}
          </label>
          <input
            id={name}
            type={type}
            name={name}
            value={form[name]}
            onChange={handleChange}
            min={
              type === 'date'
                ? name === 'pickupDate'
                  ? new Date().toISOString().split('T')[0]
                  : name === 'eventDate' || name === 'returnDate'
                    ? form.pickupDate || new Date().toISOString().split('T')[0]
                    : undefined
                : undefined
            }
            style={{
              display: 'block',
              width: '100%',
              maxWidth: '400px',
              margin: '0 auto',
              padding: '10px',
              border: errors[name] ? '1px solid red' : '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          />
          {errors[name] && (
            <div style={{
              color: 'red', fontSize: '0.85rem', maxWidth: '400px',
              margin: '0.3rem auto 0', textAlign: 'right'
            }}>
              {errors[name]}
            </div>
          )}
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <button className="btn btn-blue" onClick={() => setShowCatalogPopup(true)}>
          בחירת מוצרים
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button className="btn btn-green" onClick={handleConfirm} disabled={saving}>
          {saving ? 'שומר...' : 'אישור הזמנה'}
        </button>
        <button className="btn btn-red" onClick={handleClear} disabled={saving}>
          ביטול הזמנה
        </button>
      </div>
    </div>
  );
};

export default NewLoanForm;
