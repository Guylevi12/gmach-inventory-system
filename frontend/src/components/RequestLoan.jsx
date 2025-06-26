import React, { useState, useEffect, useCallback } from 'react';
import './NewLoan/css/NewLoan.css'; // נשתמש באותו CSS
import NewLoanModal from './NewLoan/NewLoanModal'; // נשתמש באותו מודל לבחירת מוצרים
import { db } from '@/firebase/firebase-config';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useUser } from '../UserContext';

const RequestLoan = ({ onRequestSubmitted }) => {
  const { user } = useUser(); // נשתמש בפרטי המשתמש המחובר
  
  const [form, setForm] = useState({
    clientName: '', 
    address: '',
    phone: '', 
    email: '', 
    eventType: '',
    pickupDate: '', 
    eventDate: '', 
    returnDate: ''
    // הסרנו volunteerName כי המשתמש ממלא בעצמו
  });
  
  const [errors, setErrors] = useState({});
  const [showCatalogPopup, setShowCatalogPopup] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({ ...prevForm, [name]: value }));
  }, []);

  const validateForm = () => {
    const newErrors = {};
    const today = new Date().toISOString().split('T')[0];
    const { pickupDate, eventDate, returnDate } = form;

    // אותן בדיקות כמו ב-NewLoan, רק בלי volunteerName
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
      // שמירה בקולקציה orderRequests במקום orders
      await addDoc(collection(db, 'orderRequests'), {
        ...form,
        items,
        status: 'pending', // סטטוס ממתין לאישור
        requestedBy: user.uid, // מזהה המשתמש שביקש
        requestedByUsername: user.username, // שם המשתמש
        requestedByEmail: user.email, // אימייל המשתמש
        requestedAt: serverTimestamp(),
        approvedBy: null,
        approvedAt: null
      });

      // איפוס הטופס
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

  // אותה לוגיקה לחישוב זמינות כמו ב-NewLoan
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

        // 🔧 שמירת בחירות קודמות
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
  }, [showCatalogPopup, form.pickupDate, form.returnDate]);

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

  // רשימת השדות - נעביר אותה מחוץ לקומפוננטה
  const fields = [
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
            </label>
            <input
              id={name}
              type={type}
              name={name}
              value={form[name] || ''} // הוספת || '' למניעת undefined
              onChange={handleChange}
              autoComplete="off" // מניעת התערבות של ה-browser
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
          <button className="btn btn-green" onClick={handleSubmit} disabled={saving}>
            {saving ? 'שולח בקשה...' : '📨 שלח בקשה לאישור'}
          </button>
          <button className="btn btn-red" onClick={handleClear} disabled={saving}>
            ביטול
          </button>
        </div>
      </div>

      {/* ✅ המודל עם hideBarcodeScanner=true */}
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
        hideBarcodeScanner={true}  // 🔥 מסתיר את כפתור הסריקה
      />
    </div>
  );
};

export default RequestLoan;