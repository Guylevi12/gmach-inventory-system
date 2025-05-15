// src/components/OpenLoans.jsx
import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';

export default function OpenLoans() {
  const [orders, setOrders] = useState([]);
  const [searchPhone, setSearchPhone] = useState('');

  // states לפופ-אפ מוצרים
  const [showProdPopup, setShowProdPopup] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [orderProducts, setOrderProducts] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [newProdId, setNewProdId] = useState('');
  const [newProdQty, setNewProdQty] = useState(1);
  const [savingProducts, setSavingProducts] = useState(false);

  // טען את כל ההזמנות
  const fetchOrders = async () => {
    const snap = await getDocs(collection(db, 'orders'));
    setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // סינון פתוחות/מאושרות
  const openOrders     = orders.filter(o => o.status === 'open');
  const approvedOrders = orders.filter(o => o.status === 'approved');

  // חיפוש לפי טלפון
  const filteredOpen     = openOrders.filter(o => o.phone.includes(searchPhone.trim()));
  const filteredApproved = approvedOrders.filter(o => o.phone.includes(searchPhone.trim()));

  // אישור
  const approve = async o => {
    await updateDoc(doc(db, 'orders', o.id), { status: 'approved' });
    fetchOrders();
  };

  // מחיקה
  const removeOrder = async o => {
    if (!window.confirm('למחוק את ההזמנה?')) return;
    await deleteDoc(doc(db, 'orders', o.id));
    fetchOrders();
  };

  // הצג מוצרים פופ-אפ
  const handleShowProducts = async order => {
  setEditingOrderId(order.id);

  // שליפת כל המוצרים הפעילים כולל imageUrl
  const itemsSnap = await getDocs(query(collection(db, 'items'), where('isActive', '==', true)));

  const itemsMap = {};
  const itemsList = itemsSnap.docs.map(d => {
    const data = d.data();
    itemsMap[d.id] = { name: data.name, imageUrl: data.imageUrl };
    return { id: d.id, name: data.name, imageUrl: data.imageUrl };
  });
  setAllItems(itemsList);

  // מיזוג תמונות למוצרים שכבר בהזמנה
  const merged = (order.items || []).map(p => ({
    id: p.id,
    name: itemsMap[p.id]?.name || p.name,
    imageUrl: itemsMap[p.id]?.imageUrl || '',
    quantity: p.quantity
  }));
  setOrderProducts(merged);

  setNewProdId('');
  setNewProdQty(1);
  setShowProdPopup(true);
};


  const updateProductQty = (pid, qty) =>
    setOrderProducts(prev => prev.map(p => p.id === pid ? { ...p, quantity: qty } : p));
  const removeProduct = pid =>
    setOrderProducts(prev => prev.filter(p => p.id !== pid));
  const addProductToOrder = () => {
    if (!newProdId) return;
    const exists = orderProducts.find(p => p.id === newProdId);
    if (exists) updateProductQty(newProdId, exists.quantity + newProdQty);
    else {
      const it = allItems.find(a => a.id === newProdId);
      setOrderProducts(prev => [...prev, { id: it.id, name: it.name, quantity: newProdQty }]);
    }
    setNewProdId(''); setNewProdQty(1);
  };

  const saveProducts = async () => {
    setSavingProducts(true);
    await updateDoc(doc(db, 'orders', editingOrderId), { items: orderProducts });
    setShowProdPopup(false); setEditingOrderId(null); setSavingProducts(false);
    fetchOrders();
  };

  return (
    <div style={{ direction:'rtl', padding:'1rem' }}>
      {/* חיפוש לפי טלפון */}
      <div style={{ textAlign:'center', marginBottom:'1rem' }}>
        <input
          type="text"
          placeholder="חפש לפי מספר טלפון"
          value={searchPhone}
          onChange={e => setSearchPhone(e.target.value)}
          style={{
            width:'50%',
            maxWidth:'300px',
            padding:'8px',
            border:'1px solid #ccc',
            borderRadius:'6px'
          }}
        />
      </div>

      <div style={{ display:'flex', gap:'1rem' }}>
        {/* פתוחות */}
        <div style={{ flex:1, overflowY:'auto' }}>
          <h2 style={{ textAlign:'center' }}>פתוחות</h2>
          {filteredOpen.map(o => (
            <div key={o.id} style={cardStyle}>
              <p><strong>מס׳ הזמנה:</strong> {o.simpleId}</p>
              <p><strong>מתנדבת:</strong> {o.volunteerName}</p>
              <p><strong>לקוח:</strong> {o.clientName}</p>
              <p><strong>טלפון:</strong> {o.phone}</p>
              <p><strong>אירוע:</strong> {o.eventType}</p>
              <p><strong>תאריכים:</strong> {o.pickupDate} → {o.returnDate}</p>
              <div style={buttonsRow}>
                <button onClick={() => approve(o)}         style={buttonStyle('#28a745')}>אישור</button>
                <button onClick={() => handleShowProducts(o)} style={buttonStyle('#1976d2')}>הצג מוצרים</button>
                <button onClick={() => removeOrder(o)}     style={buttonStyle('#d32f2f')}>מחיקה</button>
              </div>
            </div>
          ))}
        </div>

        {/* מאושרות */}
        <div style={{ flex:1, overflowY:'auto' }}>
          <h2 style={{ textAlign:'center' }}>מאושרות</h2>
          {filteredApproved.map(o => (
            <div key={o.id} style={cardStyle}>
              <p><strong>מס׳ הזמנה:</strong> {o.simpleId}</p>
              <p><strong>מתנדבת:</strong> {o.volunteerName}</p>
              <p><strong>לקוח:</strong> {o.clientName}</p>
              <p><strong>טלפון:</strong> {o.phone}</p>
              <p><strong>אירוע:</strong> {o.eventType}</p>
              <p><strong>תאריכים:</strong> {o.pickupDate} → {o.returnDate}</p>
            </div>
          ))}
        </div>
      </div>

      {/* פופ-אפ עריכת מוצרים */}
      {showProdPopup && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ textAlign:'center' }}>עריכת מוצרים</h3>

            <div style={{ maxHeight:'300px', overflowY:'auto', marginBottom:'1rem' }}>
              {orderProducts.map(p => (
                  <div key={p.id} style={prodRow}>
                    {p.imageUrl && (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        style={{
                          width: '50px',
                          height: '50px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          marginLeft: '8px'
                        }}
                      />
                    )}
                    <span style={{ flex: 1 }}>{p.name}</span>
                    <input
                      type="number"
                      min={1}
                      value={p.quantity}
                      onChange={e => updateProductQty(p.id, +e.target.value)}
                      style={{ width: '60px', margin: '0 8px', textAlign: 'center' }}
                    />
                    <button onClick={() => removeProduct(p.id)} style={buttonStyle('#d32f2f')}>❌</button>
                  </div>
                ))}
            </div>

            <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem', alignItems:'center' }}>
              <select
                value={newProdId}
                onChange={e => setNewProdId(e.target.value)}
                style={{ flex:1, padding:'6px', border:'1px solid #ccc', borderRadius:'4px' }}
              >
                <option value="">בחר מוצר להוספה…</option>
                {allItems.map(it => (
                  <option key={it.id} value={it.id}>{it.name}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={newProdQty}
                onChange={e => setNewProdQty(+e.target.value)}
                style={{ width:'60px', padding:'6px', textAlign:'center' }}
              />
              <button onClick={addProductToOrder} style={buttonStyle('#1976d2')}>➕</button>
            </div>

            <div style={buttonsRow}>
              <button onClick={saveProducts} style={buttonStyle('#28a745')} disabled={savingProducts}>
                {savingProducts ? 'שומר…' : 'שמור שינויים'}
              </button>
              <button onClick={() => setShowProdPopup(false)} style={buttonStyle('#999')}>בטל</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  border:'1px solid #ccc',
  borderRadius:'8px',
  padding:'1rem',
  marginBottom:'1rem',
  backgroundColor:'#fff'
};
const buttonsRow = {
  display:'flex',
  gap:'0.5rem',
  justifyContent:'center',
  marginTop:'0.5rem'
};
const buttonStyle = bg => ({
  padding:'6px 12px',
  border:'none',
  borderRadius:'4px',
  backgroundColor:bg,
  color:'white',
  cursor:'pointer'
});
const overlayStyle = {
  position:'fixed',
  top:0,left:0,
  width:'100%',height:'100%',
  backgroundColor:'rgba(0,0,0,0.5)',
  display:'flex',
  justifyContent:'center',
  alignItems:'center'
};
const modalStyle = {
  backgroundColor:'white',
  padding:'1.5rem',
  borderRadius:'8px',
  width:'90%',
  maxWidth:'500px'
};
const prodRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '0.5rem',
  direction: 'rtl', // ✅ חזרה ל־RTL
  textAlign: 'right'
};


