// src/components/NewLoan.jsx
import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';

const NewLoan = ({ onOrderCreated }) => {
  const [form, setForm] = useState({
    volunteerName: '',
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

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const validateForm = () => {
  const newErrors = {};
  const today = new Date().toISOString().split('T')[0];

  const { pickupDate, eventDate, returnDate } = form;

  // בדיקות כלליות
  if (!form.volunteerName.trim()) newErrors.volunteerName = 'שדה חובה';
  if (!form.clientName.trim())   newErrors.clientName   = 'שדה חובה';
  if (!form.address.trim())      newErrors.address      = 'שדה חובה';
  if (!form.phone.trim()) {
    newErrors.phone = 'שדה חובה';
  } else if (!/^\d{10}$/.test(form.phone)) {
    newErrors.phone = 'מספר טלפון חייב להכיל בדיוק 10 ספרות';
  }

  if (!form.eventType.trim())    newErrors.eventType    = 'שדה חובה';

  // תאריכים
  if (!pickupDate) newErrors.pickupDate = 'שדה חובה';
  if (!eventDate)  newErrors.eventDate  = 'שדה חובה';
  if (!returnDate) newErrors.returnDate = 'שדה חובה';

  if (pickupDate && pickupDate < today)
    newErrors.pickupDate = 'תאריך לא יכול להיות בעבר';

  if (eventDate && pickupDate && eventDate < pickupDate)
    newErrors.eventDate = 'תאריך האירוע לא יכול להיות לפני תאריך לקיחת מוצרים';

  if (returnDate && pickupDate && returnDate <= pickupDate)
    newErrors.returnDate = 'תאריך החזרה חייב להיות אחרי תאריך לקיחה';

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};



  const handleClear = () => {
    if (window.confirm('האם אתה בטוח שברצונך לבטל את ההזמנה?')) {
      setForm({
        volunteerName: '', clientName: '', address: '',
        phone: '', email: '', eventType: '',
        pickupDate: '', eventDate: '', returnDate: ''
      });
      setErrors({});
      setAvailableItems([]);
      setSearchTerm('');
      setShowCatalogPopup(false);
    }
  };

const handleConfirm = async () => {
  if (!validateForm()) return;

  // 1) קביעת simpleId כ–max(simpleId) + 1 או 1 אם אין הזמנות
  const ordersSnap = await getDocs(collection(db, 'orders'));
  const existingIds = ordersSnap.docs
    .map(d => d.data().simpleId)
    .filter(id => typeof id === 'number');
  const nextSimpleId = existingIds.length > 0
    ? Math.max(...existingIds) + 1
    : 1;

  // 2) הכנת רשימת המוצרים שנבחרו עם שדות מלאים
  const items = availableItems
    .filter(i => i.selected)
    .map(i => ({
      id: i.id,
      name: i.name,
      quantity: i.selectedQty
    }));

  console.log('Items to save:', items); // בדיקה

  setSaving(true);
  try {
    // 3) שמירת ההזמנה כולל שדה simpleId
    const docRef = await addDoc(collection(db, 'orders'), {
      ...form,
      items,
      status: 'open',
      simpleId: nextSimpleId,
      createdAt: serverTimestamp()
    });

    // 4) הוספת orderId (מפתח Firestore) לשדה נפרד
    await updateDoc(docRef, { orderId: docRef.id });

    // 5) איפוס UI והודעה
    setForm({
      volunteerName: '', clientName: '', address: '',
      phone: '', email: '', eventType: '',
      pickupDate: '', eventDate: '', returnDate: ''
    });
    setAvailableItems([]);
    setSearchTerm('');
    setShowCatalogPopup(false);
    alert(`ההזמנה נשמרה!  Simple ID: ${nextSimpleId}`);
    if (typeof onOrderCreated === 'function') {
      await onOrderCreated();
    }
  } catch (err) {
    console.error('שגיאה בשמירת הזמנה:', err);
    alert('שגיאה בשמירה, נסה שוב.');
  }
  setSaving(false);
};


  useEffect(() => {
    if (!showCatalogPopup) return;

const fetchAvailable = async () => {
  setLoadingItems(true);

  // פונקציית עזר להמרת תאריך
  const parseDate = (d) => {
    if (!d) return null;
    if (d.toDate) return d.toDate();               // Firestore Timestamp
    if (typeof d === 'string') return new Date(d); // מחרוזת
    return d;                                       // כבר Date
  };

  try {
    // 1. שלוף את כל הפריטים
    const itemsSnap = await getDocs(collection(db, 'items'));
    const itemsData = itemsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(item => item.isDeleted !== true)
      .map(item => ({ ...item, selected: false, selectedQty: 0 }));

    // 2. שלוף את כל ההזמנות שחופפות לטווח התאריכים של ההזמנה החדשה
    const ordersSnap = await getDocs(collection(db, 'orders'));
    const pickupStart = parseDate(form.pickupDate);
    const pickupEnd = parseDate(form.returnDate);

    const overlappingOrders = ordersSnap.docs
      .map(doc => doc.data())
      .filter(order => {
        const orderStart = parseDate(order.pickupDate);
        const orderEnd = parseDate(order.returnDate);
        return (
          order.status === 'open' &&
          orderStart && orderEnd && pickupStart && pickupEnd &&
          orderEnd >= pickupStart &&
          orderStart <= pickupEnd
        );
      });

    // 3. חישוב כמות תפוסה לכל מוצר
    const reserved = {};
    overlappingOrders.forEach(order => {
      order.items?.forEach(item => {
        reserved[item.id] = (reserved[item.id] || 0) + item.quantity;
      });
    });

    // 4. חישוב כמה זמין לכל מוצר
    const result = itemsData
      .map(item => {
        const availableQty = (item.quantity || 0) - (reserved[item.id] || 0);
        return { ...item, quantity: availableQty };
      })
      .filter(item => item.quantity > 0); // רק מוצרים שזמינים בפועל

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
    setAvailableItems(av =>
      av.map(it =>
        it.id === id
          ? { ...it, selected: !it.selected, selectedQty: !it.selected ? 1 : 0 }
          : it
      )
    );
  };

  const changeQty = (id, qty) => {
    setAvailableItems(av =>
      av.map(it =>
        it.id === id
          ? { ...it, selected: qty > 0, selectedQty: qty }
          : it
      )
    );
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', backgroundColor: '#f8f8f8'
    }}>
      <div style={{
        direction: 'rtl', width: '100%', maxWidth: '600px',
        padding: '2rem', border: '1px solid #ccc', borderRadius: '10px',
        backgroundColor: '#fff', boxShadow: '0 0 10px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ textAlign: 'center' }}>הזמנה חדשה</h2>
        {[
          { label: 'שם מתנדבת', name: 'volunteerName', required: true },
          { label: 'שם לקוח',     name: 'clientName',    required: true },
          { label: 'מקום מגורים',  name: 'address',       required: true },
          { label: 'מספר פלאפון',  name: 'phone',         required: true },
          { label: 'אימייל',       name: 'email',         required: false },
          { label: 'סוג האירוע',   name: 'eventType',     required: true },
          { label: 'תאריך לקיחת מוצרים', name: 'pickupDate', type: 'date', required: true },
          { label: 'תאריך האירוע',        name: 'eventDate',  type: 'date', required: true },
          { label: 'תאריך החזרת מוצרים', name: 'returnDate', type: 'date', required: true }
        ].map(({ label, name, type='text', required }) => (
          <div key={name} style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <label htmlFor={name} style={{
              display:'block', marginBottom:'0.3rem', maxWidth:'400px',
              margin:'0 auto', textAlign:'right'
            }}>{label}{required && ' *'}</label>
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
        : name === 'eventDate'
        ? form.pickupDate || new Date().toISOString().split('T')[0]
        : name === 'returnDate'
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
                color:'red', fontSize:'0.85rem', maxWidth:'400px',
                margin:'0.3rem auto 0', textAlign:'right'
              }}>{errors[name]}</div>
            )}
          </div>
        ))}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:'1.5rem' }}>
          <button style={buttonStyle('#1976d2')} onClick={()=>setShowCatalogPopup(true)}>
            בחירת מוצרים
          </button>
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap:'10px' }}>
          <button style={buttonStyle('#28a745')} onClick={handleConfirm} disabled={saving}>
            {saving ? 'שומר...' : 'אישור הזמנה'}
          </button>
          <button style={buttonStyle('#d32f2f')} onClick={handleClear} disabled={saving}>
            ביטול הזמנה
          </button>
        </div>
      </div>

      {showCatalogPopup && (
        <div style={{
          position:'fixed', top:0, left:0, width:'100%', height:'100%',
          backgroundColor:'rgba(0,0,0,0.5)', display:'flex',
          justifyContent:'center', alignItems:'center', zIndex:1000
        }}>
          <div style={{
            backgroundColor:'white', padding:'2rem', borderRadius:'8px',
            maxWidth:'90%', maxHeight:'90%', overflowY:'auto',
            direction:'rtl', width:'700px', position:'relative'
          }}>
            <div style={{
              display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:'1rem'
            }}>
              <button
                style={{ ...buttonStyle('#555'), width:'180px' }}
                onClick={()=>alert('סריקת ברקוד תתווסף בהמשך')}
              >סריקת ברקוד</button>
              <input
                type="text"
                placeholder="חיפוש מוצר..."
                value={searchTerm}
                onChange={e=>setSearchTerm(e.target.value)}
                style={{
                  padding:'8px', border:'1px solid #ccc',
                  borderRadius:'6px', width:'60%'
                }}
              />
            </div>

            <h3 style={{ textAlign:'center', marginBottom:'1rem' }}>
              מוצרים זמינים ({form.pickupDate} → {form.returnDate})
            </h3>

            {loadingItems
              ? <p style={{ textAlign:'center' }}>טוען מוצרים…</p>
              : (
                <div style={{
                  display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',
                  gap:'1rem'
                }}>
                  {availableItems
                    .filter(it=>it.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(item=>(
                      <div key={item.id} style={{
                        border:item.selected?'2px solid #1976d2':'1px solid #ccc',
                        borderRadius:'8px', padding:'0.5rem', textAlign:'center'
                      }}>
                        <img
                          src={item.imageUrl||'/no-image-available.png'}
                          alt={item.name}
                          style={{ width:'100%',height:'100px',objectFit:'cover',borderRadius:'4px' }}
                        />
                        <h4 style={{ margin:'0.5rem 0' }}>{item.name}</h4>
                        <p>זמין: {item.quantity}</p>

                        <div style={{ margin:'0.5rem 0' }}>
                          <label style={{ marginRight:'0.5rem' }}>כמות:</label>
                          <input
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={item.selectedQty}
                            disabled={!item.selected}
                            onChange={e=>changeQty(item.id, +e.target.value)}
                            style={{ width:'60px', padding:'4px', textAlign:'center' }}
                          />
                        </div>

                        <button
                          onClick={()=>toggleSelectItem(item.id)}
                          style={{
                            ...buttonStyle(item.selected?'#d32f2f':'#1976d2'),
                            width:'100%', marginTop:'0.5rem'
                          }}
                        >
                          {item.selected?'הסר מוצר':'בחר מוצר'}
                        </button>
                      </div>
                    ))
                  }
                </div>
              )}

            <div style={{ textAlign:'center', marginTop:'1rem' }}>
              <button style={buttonStyle('#6c757d')} onClick={()=>setShowCatalogPopup(false)}>
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const buttonStyle = bg => ({
  padding:'10px 20px', fontSize:'16px',
  border:'none', borderRadius:'6px',
  backgroundColor:bg, color:'white', cursor:'pointer'
});

export default NewLoan;