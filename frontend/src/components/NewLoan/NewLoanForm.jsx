import React from 'react';

const NewLoanForm = ({
  form,
  errors,
  handleChange,
  handleConfirm,
  handleClear,
  setShowCatalogPopup,
  saving,
  isLoadingClientData = false // ✅ פרמטר חדש לטעינת פרטי לקוח
}) => {
  // ✅ מספר פלאפון מועבר להיות ראשון ברשימה
  const fields = [
    { label: 'מספר פלאפון', name: 'phone', required: true },
    { label: 'שם מתנדבת', name: 'volunteerName', required: true },
    { label: 'שם לקוח', name: 'clientName', required: true },
    { label: 'מקום מגורים', name: 'address', required: true },
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
            {/* ✅ אינדיקטור טעינה עבור שדות שמתמלאים אוטומטית */}
            {isLoadingClientData && (name === 'clientName' || name === 'address' || name === 'email') && (
              <span style={{ marginRight: '0.5rem', color: '#2196f3' }}>
                ⏳
              </span>
            )}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id={name}
              type={type}
              name={name}
              value={form[name]}
              onChange={handleChange}
              disabled={isLoadingClientData && (name === 'clientName' || name === 'address' || name === 'email')} // ✅ השבתת שדות בזמן טעינה
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
                fontSize: '1rem',
                backgroundColor: isLoadingClientData && (name === 'clientName' || name === 'address' || name === 'email') 
                  ? '#f5f5f5' : 'white', // ✅ רקע אפור בזמן טעינה
                opacity: isLoadingClientData && (name === 'clientName' || name === 'address' || name === 'email') 
                  ? 0.7 : 1 // ✅ שקיפות בזמן טעינה
              }}
              placeholder={
                isLoadingClientData && (name === 'clientName' || name === 'address' || name === 'email') 
                  ? 'טוען...' : ''
              }
            />
            
            {/* ✅ אינדיקטור ספינר עבור שדה הטלפון */}
            {isLoadingClientData && name === 'phone' && (
              <div style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#2196f3'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #e3f2fd',
                  borderTop: '2px solid #2196f3',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              </div>
            )}
          </div>
          
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
        <button className="btn btn-green" onClick={handleConfirm} disabled={saving || isLoadingClientData}>
          {saving ? 'שומר...' : 'אישור הזמנה'}
        </button>
        <button className="btn btn-red" onClick={handleClear} disabled={saving || isLoadingClientData}>
          ביטול הזמנה
        </button>
      </div>

      {/* ✅ הוספת CSS לאנימציית הספינר */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default NewLoanForm;