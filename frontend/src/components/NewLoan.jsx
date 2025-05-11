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

const NewLoan = () => {
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
    if (!form.volunteerName.trim()) newErrors.volunteerName = 'שדה חובה';
    if (!form.clientName.trim())   newErrors.clientName   = 'שדה חובה';
    if (!form.address.trim())      newErrors.address      = 'שדה חובה';
    if (!form.phone.trim())        newErrors.phone        = 'שדה חובה';
    if (!form.eventType.trim())    newErrors.eventType    = 'שדה חובה';
    if (!form.pickupDate)          newErrors.pickupDate   = 'שדה חובה';
    if (!form.eventDate)           newErrors.eventDate    = 'שדה חובה';
    if (!form.returnDate)          newErrors.returnDate   = 'שדה חובה';
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

    // 2) הכנת רשימת המוצרים שנבחרו
    const items = availableItems
      .filter(i => i.selected)
      .map(i => ({ id: i.id, name: i.name, quantity: i.selectedQty }));

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
      // 4) הוספת orderId (מפתח Firestore) לשדה נפרד אם רוצים
      await updateDoc(docRef, { orderId: docRef.id });

      // 5) איפוס UI והודעה למשתמש
      setForm({
        volunteerName: '', clientName: '', address: '',
        phone: '', email: '', eventType: '',
        pickupDate: '', eventDate: '', returnDate: ''
      });
      setAvailableItems([]);
      setSearchTerm('');
      setShowCatalogPopup(false);
      alert(`ההזמנה נשמרה!  Simple ID: ${nextSimpleId}`);
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
      try {
        const itemsSnap = await getDocs(
          query(collection(db, 'items'), where('isActive', '==', true))
        );
        const itemsData = itemsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          selected: false,
          selectedQty: 0
        }));

        const ordersSnap = await getDocs(
          query(collection(db, 'orders'), where('returnDate', '>=', form.pickupDate))
        );
        const orders = ordersSnap.docs
          .map(d => d.data())
          .filter(o => o.pickupDate <= form.returnDate);

        const reserved = {};
        orders.forEach(o =>
          Array.isArray(o.items) &&
          o.items.forEach(it => {
            reserved[it.id] = (reserved[it.id] || 0) + it.quantity;
          })
        );

        const filtered = itemsData
          .map(it => {
            const avail = it.quantity - (reserved[it.id] || 0);
            return { ...it, quantity: avail };
          })
          .filter(it => it.quantity > 0);

        setAvailableItems(filtered);
      } catch {
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
            <input id={name} type={type} name={name} value={form[name]}
              onChange={handleChange}
              style={{
                display:'block', width:'100%', maxWidth:'400px',
                margin:'0 auto', padding:'10px',
                border: errors[name] ? '1px solid red' : '1px solid #ccc',
                borderRadius:'6px', fontSize:'1rem'
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
