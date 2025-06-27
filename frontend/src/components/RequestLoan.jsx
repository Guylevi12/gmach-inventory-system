import React, { useState, useEffect, useCallback } from 'react';
import './NewLoan/css/NewLoan.css';
import NewLoanModal from './NewLoan/NewLoanModal';
import { db } from '@/firebase/firebase-config';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useUser } from '../UserContext';
import { phoneAutoCompleteService } from '@/services/phoneAutoCompleteService';

const RequestLoan = ({ onRequestSubmitted }) => {
  const { user } = useUser();
  
  const [form, setForm] = useState({
    clientName: '', 
    address: '',
    phone: '', 
    email: '', 
    eventType: '',
    pickupDate: '', 
    eventDate: '', 
    returnDate: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showCatalogPopup, setShowCatalogPopup] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [isLoadingClientData, setIsLoadingClientData] = useState(false);

  // פונקציה משופרת לטיפול בשינויים עם חיפוש אוטומטי
  const handleChange = useCallback(async (e) => {
    const { name, value } = e.target;
    
    // עדכון הטופס
    setForm(prevForm => ({ ...prevForm, [name]: value }));
    
    // אם השדה הוא מספר טלפון ואורכו 10 ספרות - נחפש פרטי לקוח
    if (name === 'phone' && value.length === 10 && /^\d{10}$/.test(value)) {
      setIsLoadingClientData(true);
      
      try {
        const result = await phoneAutoCompleteService.findClientByPhone(value);
        
        if (result.found) {
          // מילוי אוטומטי של הפרטים
          setForm(prevForm => ({
            ...prevForm,
            phone: value,
            clientName: result.clientData.clientName,
            address: result.clientData.address,
            email: result.clientData.email
          }));
          
          // הצגת הודעה למשתמש
          alert(`נמצא לקוח קיים! הפרטים מולאו אוטומטית:\nשם: ${result.clientData.clientName}\nכתובת: ${result.clientData.address}`);
        }
      } catch (error) {
        console.error('שגיאה בחיפוש פרטי לקוח:', error);
      } finally {
        setIsLoadingClientData(false);
      }
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};
    const today = new Date().toISOString().split('T')[0];
    const { pickupDate, eventDate, returnDate } = form;

    if (!form.clientName.trim()) newErrors.clientName = 'שדה חובה';
    if (!form.address.trim()) newErrors.address = 'שדה חובה';
    if (!form.phone.trim()) newErrors.phone = 'שדה חובה';
    else if (!/^\d{10}$/.test(form.phone)) newErrors.phone = 'מספר טלפון לא תקין';
    if (!form.eventType.trim()) newErrors.eventType = 'שדה חובה';

    if (!pickupDate) newErrors.pickupDate = 'שדה חובה';
    if (!eventDate) newErrors.eventDate = 'שדה חובה';
    if (!returnDate) newErrors.returnDate = 'שדה חובה';

    if (pickupDate && pickupDate < today) newErrors.pickupDate = 'תאריך לא יכול להיות בעבר';
    if (eventDate && pickupDate && eventDate < pickupDate) newErrors.eventDate = 'תאריך האירוע לא יכול להיות לפני לקיחה';
    if (returnDate && pickupDate && returnDate <= pickupDate) newErrors.returnDate = 'החזרה אחרי לקיחה';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClear = () => {
    if (window.confirm('האם אתה בטוח שברצונך לבטל את הבקשה?')) {
      setForm({
        clientName: '', 
        address: '',
        phone: '', 
        email: '', 
        eventType: '',
        pickupDate: '', 
        eventDate: '', 
        returnDate: ''
      });
      setErrors({});
      setAvailableItems([]);
      setSearchTerm('');
      setShowCatalogPopup(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const items = availableItems.filter(i => i.selected).map(i => ({
      id: i.id,
      ItemId: i.ItemId,
      name: i.name,
      quantity: i.selectedQty,
      imageUrl: i.imageUrl
    }));

    if (items.length === 0) {
      alert('יש לבחור לפחות פריט אחד');
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'orderRequests'), {
        ...form,
        items,
        status: 'pending',
        requestedBy: user.uid,
        requestedByUsername: user.username,
        requestedByEmail: user.email,
        requestedAt: serverTimestamp(),
        approvedBy: null,
        approvedAt: null
      });

      setForm({
        clientName: '', 
        address: '',
        phone: '', 
        email: '', 
        eventType: '',
        pickupDate: '', 
        eventDate: '', 
        returnDate: ''
      });
      setAvailableItems([]);
      setSearchTerm('');
      setShowCatalogPopup(false);
      
      alert('🎉 הבקשה נשלחה בהצלחה! תקבל עדכון כאשר הבקשה תאושר.');
      
      if (onRequestSubmitted) await onRequestSubmitted();
    } catch (err) {
      console.error('שגיאה בשליחת הבקשה:', err);
      alert('שגיאה בשליחת הבקשה. אנא נסה שוב.');
    }
    setSaving(false);
  };

  // חישוב זמינות פריטים
  useEffect(() => {
    if (!showCatalogPopup) return;

    const fetchAvailable = async () => {
      setLoadingItems(true);
      const parseDate = (d) => {
        if (!d) return null;
        if (d.toDate) return d.toDate();
        if (typeof d === 'string') return new Date(d);
        return d;
      };

      try {
        const itemsSnap = await getDocs(collection(db, 'items'));
        const itemsData = itemsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => item.isDeleted !== true);

        const ordersSnap = await getDocs(collection(db, 'orders'));
        const pickupStart = parseDate(form.pickupDate);
        const pickupEnd = parseDate(form.returnDate);

        const overlappingOrders = ordersSnap.docs.map(doc => doc.data()).filter(order => {
          const orderStart = parseDate(order.pickupDate);
          const orderEnd = parseDate(order.returnDate);
          return (
            order.status === 'open' &&
            orderStart && orderEnd && pickupStart && pickupEnd &&
            orderEnd >= pickupStart &&
            orderStart <= pickupEnd
          );
        });

        const reserved = {};
        overlappingOrders.forEach(order => {
          order.items?.forEach(item => {
            reserved[item.id] = (reserved[item.id] || 0) + item.quantity;
          });
        });

        const previousSelections = {};
        availableItems.forEach(item => {
          if (item.selected && item.selectedQty > 0) {
            previousSelections[item.id] = {
              selected: item.selected,
              selectedQty: item.selectedQty
            };
          }
        });

        const result = itemsData.map(item => {
          const availableQty = (item.quantity || 0) - (reserved[item.id] || 0);
          const prevSelection = previousSelections[item.id];

          return {
            ...item,
            quantity: availableQty,
            selected: prevSelection ? prevSelection.selected : false,
            selectedQty: prevSelection ? prevSelection.selectedQty : 0
          };
        }).filter(item => item.quantity > 0);

        setAvailableItems(result);
      } catch (err) {
        console.error('שגיאה בחישוב זמינות:', err);
        setAvailableItems([]);
      }
      setLoadingItems(false);
    };

    fetchAvailable();
  }, [showCatalogPopup, form.pickupDate, form.returnDate, availableItems]);

  const toggleSelectItem = id => {
    setAvailableItems(av => av.map(it =>
      it.id === id ? { ...it, selected: !it.selected, selectedQty: !it.selected ? 1 : 0 } : it
    ));
  };

  const changeQty = (id, qty) => {
    setAvailableItems(av => av.map(it =>
      it.id === id ? { ...it, selected: qty > 0, selectedQty: qty } : it
    ));
  };

  // רשימת השדות עם מספר פלאפון ראשון
  const fields = [
    { label: 'מספר פלאפון', name: 'phone', required: true },
    { label: 'שם לקוח', name: 'clientName', required: true },
    { label: 'מקום מגורים', name: 'address', required: true },
    { label: 'אימייל', name: 'email', required: false },
    { label: 'סוג האירוע', name: 'eventType', required: true },
    { label: 'תאריך לקיחת מוצרים', name: 'pickupDate', type: 'date', required: true },
    { label: 'תאריך האירוע', name: 'eventDate', type: 'date', required: true },
    { label: 'תאריך החזרת מוצרים', name: 'returnDate', type: 'date', required: true }
  ];

  return (
    <div className="new-loan-container">
      <div className="loan-form-box">
        <h2 style={{ textAlign: 'center' }}>🙏 בקשת השאלה</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
          מלא את הפרטים והבקשה תישלח לאישור המנהלים
        </p>
        
        {fields.map(({ label, name, type = 'text', required }) => (
          <div key={name} style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <label htmlFor={name} style={{
              display: 'block', marginBottom: '0.3rem', maxWidth: '400px',
              margin: '0 auto', textAlign: 'right'
            }}>
              {label}{required && ' *'}
              {/* אינדיקטור טעינה עבור שדות שמתמלאים אוטומטית */}
              {isLoadingClientData && (name === 'clientName' || name === 'address' || name === 'email') && (
                <span style={{ marginRight: '0.5rem', color: '#4caf50' }}>
                  ⏳
                </span>
              )}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id={name}
                type={type}
                name={name}
                value={form[name] || ''}
                onChange={handleChange}
                autoComplete="off"
                disabled={isLoadingClientData && (name === 'clientName' || name === 'address' || name === 'email')}
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
                    ? '#f5f5f5' : 'white',
                  opacity: isLoadingClientData && (name === 'clientName' || name === 'address' || name === 'email') 
                    ? 0.7 : 1
                }}
                placeholder={
                  isLoadingClientData && (name === 'clientName' || name === 'address' || name === 'email') 
                    ? 'טוען...' : ''
                }
              />
              
              {/* אינדיקטור ספינר עבור שדה הטלפון */}
              {isLoadingClientData && name === 'phone' && (
                <div style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#4caf50'
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #e8f5e8',
                    borderTop: '2px solid #4caf50',
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
          <button 
            className="btn btn-blue" 
            onClick={() => setShowCatalogPopup(true)}
            disabled={isLoadingClientData}
          >
            בחירת מוצרים
          </button>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button 
            className="btn btn-green" 
            onClick={handleSubmit} 
            disabled={saving || isLoadingClientData}
          >
            {saving ? 'שולח בקשה...' : '📨 שלח בקשה לאישור'}
          </button>
          <button 
            className="btn btn-red" 
            onClick={handleClear} 
            disabled={saving || isLoadingClientData}
          >
            ביטול
          </button>
        </div>

        {/* CSS לאנימציית הספינר */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: translateY(-50%) rotate(0deg); }
            100% { transform: translateY(-50%) rotate(360deg); }
          }
        `}</style>
      </div>

      {/* המודל עם hideBarcodeScanner=true */}
      <NewLoanModal
        showCatalogPopup={showCatalogPopup}
        setShowCatalogPopup={setShowCatalogPopup}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setAvailableItems={setAvailableItems}
        availableItems={availableItems}
        toggleSelectItem={toggleSelectItem}
        changeQty={changeQty}
        form={form}
        loadingItems={loadingItems}
        hideBarcodeScanner={true}
      />
    </div>
  );
};

export default RequestLoan;