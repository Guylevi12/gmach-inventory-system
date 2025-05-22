// src/components/OpenLoans.jsx
import React, { useState, useEffect } from 'react'
import {
  collection,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  increment
} from 'firebase/firestore'
import { db } from '@/firebase/firebase-config'

export default function OpenLoans() {
  const [orders, setOrders] = useState([])
  const [searchPhone, setSearchPhone] = useState('')
  const [activeTab, setActiveTab] = useState('open') // 'open' | 'approved'

  // popup states for products
  const [showProdPopup, setShowProdPopup] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState(null)
  const [orderProducts, setOrderProducts] = useState([])
  const [allItems, setAllItems] = useState([])
  const [newProdId, setNewProdId] = useState('')
  const [newProdQty, setNewProdQty] = useState(1)
  const [savingProducts, setSavingProducts] = useState(false)

  // popup states for comments
  const [showNotePopup, setShowNotePopup] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [editingNoteOrderId, setEditingNoteOrderId] = useState(null)
  const [savingNote, setSavingNote] = useState(false)

  // load all orders once
  async function fetchOrders() {
    const snap = await getDocs(collection(db, 'orders'))
    setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }
  useEffect(() => { fetchOrders() }, [])

  // split & filter
  const openOrders     = orders.filter(o => o.status === 'open')
  const approvedOrders = orders.filter(o => o.status === 'approved')
  const filtered = (activeTab === 'open' ? openOrders : approvedOrders)
    .filter(o => o.phone?.includes(searchPhone.trim()))

  // approve: deduct stock + flip status
  async function approve(order) {
    try {
      const orderRef = doc(db, 'orders', order.id)
      const orderSnap = await getDoc(orderRef)
      const data = orderSnap.data() || {}
      const items = Array.isArray(data.items) ? data.items : []

      for (const p of items) {
        const qty = parseInt(p.quantity, 10) || 0
        if (qty > 0) {
          const itemRef = doc(db, 'items', p.id)
          await updateDoc(itemRef, { quantity: increment(-qty) })
        }
      }

      await updateDoc(orderRef, { status: 'approved' })
      fetchOrders()
    } catch (err) {
      console.error('Error approving order:', err)
      alert('שגיאה באישור ההזמנה, בדוק console')
    }
  }

  // remove an order: אם מאושרת – מחזיר מלאי ואז מוחק
  async function removeOrder(o) {
    if (!window.confirm('למחוק את ההזמנה?')) return
    try {
      if (o.status === 'approved') {
        const orderRef = doc(db, 'orders', o.id)
        const orderSnap = await getDoc(orderRef)
        const data = orderSnap.data() || {}
        const items = Array.isArray(data.items) ? data.items : []
        for (const p of items) {
          const qty = parseInt(p.quantity, 10) || 0
          if (qty > 0) {
            const itemRef = doc(db, 'items', p.id)
            await updateDoc(itemRef, { quantity: increment(qty) })
          }
        }
      }
      await deleteDoc(doc(db, 'orders', o.id))
      fetchOrders()
    } catch (err) {
      console.error('Error removing order:', err)
      alert('שגיאה במחיקת ההזמנה, בדוק console')
    }
  }

  // ** כפתור הוספת הערה ** //
  function openNotePopup(order) {
    setEditingNoteOrderId(order.id)
    setNoteText(order.note || '')  // note = שדה בחשבון ההזמנה
    setShowNotePopup(true)
  }
  async function saveNote() {
    if (!editingNoteOrderId) return
    setSavingNote(true)
    try {
      await updateDoc(doc(db, 'orders', editingNoteOrderId), { note: noteText })
      setShowNotePopup(false)
      setEditingNoteOrderId(null)
      fetchOrders()
    } catch (err) {
      console.error('Error saving note:', err)
      alert('שגיאה בשמירת ההערה, בדוק console')
    }
    setSavingNote(false)
  }

  // --- מוצרים: פופ־אפ קיים --- //
  async function handleShowProducts(order) {
    setEditingOrderId(order.id)
    const itemsSnap = await getDocs(
      query(collection(db, 'items'), where('isActive', '==', true))
    )
    const itemsMap = {}
    itemsSnap.docs.forEach(d => {
      const { name, imageUrl } = d.data()
      itemsMap[d.id] = { name, imageUrl }
    })
    setAllItems(Object.entries(itemsMap).map(([id, v]) => ({ id, ...v })))

    const raw = Array.isArray(order.items) ? order.items : []
    const merged = raw.map(p => ({
      id:       p.id,
      name:     itemsMap[p.id]?.name     || p.name     || 'מוצר לא ידוע',
      imageUrl: itemsMap[p.id]?.imageUrl || p.imageUrl || '',
      quantity: p.quantity
    }))
    setOrderProducts(merged)
    setNewProdId(''); setNewProdQty(1)
    setShowProdPopup(true)
  }
  function updateProductQty(pid, qty) {
    setOrderProducts(prev =>
      prev.map(p => p.id === pid ? { ...p, quantity: qty } : p)
    )
  }
  function removeProduct(pid) {
    setOrderProducts(prev => prev.filter(p => p.id !== pid))
  }
  function addProductToOrder() {
    if (!newProdId) return
    const exists = orderProducts.find(p => p.id === newProdId)
    if (exists) {
      updateProductQty(newProdId, exists.quantity + newProdQty)
    } else {
      const item = allItems.find(i => i.id === newProdId)
      if (!item) return alert('המוצר לא נמצא במלאי')
      setOrderProducts(prev => [...prev, { ...item, quantity: newProdQty }])
    }
    setNewProdId(''); setNewProdQty(1)
  }
  async function saveProducts() {
    if (!editingOrderId) return
    setSavingProducts(true)
    const cleaned = orderProducts.map(p => ({
      id: p.id, name: p.name, imageUrl: p.imageUrl, quantity: p.quantity
    }))
    await updateDoc(doc(db, 'orders', editingOrderId), { items: cleaned })
    setShowProdPopup(false)
    setEditingOrderId(null)
    setSavingProducts(false)
    fetchOrders()
  }

  return (
    <div style={{ direction: 'rtl', padding: '1rem' }}>
      {/* חיפוש + לשוניות */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <input
          placeholder="חפש לפי טלפון"
          value={searchPhone}
          onChange={e => setSearchPhone(e.target.value)}
          style={{ width:'50%', padding:'8px', borderRadius:'4px' }}
        />
        <div style={{ marginTop:'0.5rem' }}>
          <button
            onClick={()=>setActiveTab('open')}
            style={{
              margin:'0 4px', padding:'6px 12px',
              background: activeTab==='open' ? '#1976d2' : '#eee',
              color:     activeTab==='open' ? 'white'    : '#333',
              border:'none', borderRadius:'4px', cursor:'pointer'
            }}
          >פתוחות</button>
          <button
            onClick={()=>setActiveTab('approved')}
            style={{
              margin:'0 4px', padding:'6px 12px',
              background: activeTab==='approved' ? '#1976d2' : '#eee',
              color:     activeTab==='approved' ? 'white'    : '#333',
              border:'none', borderRadius:'4px', cursor:'pointer'
            }}
          >מאושרות</button>
        </div>
      </div>

      {/* כרטיסי הזמנות */}
      <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' }}>
        {filtered.map(o => (
          <div key={o.id} style={{
            flex:'1 1 300px', border:'1px solid #ccc', borderRadius:'8px',
            padding:'1rem', background:'#fff', marginBottom:'1rem'
          }}>
            <p><strong>מס׳ הזמנה:</strong> {o.simpleId}</p>
            <p><strong>מתנדבת:</strong> {o.volunteerName}</p>
            <p><strong>לקוח:</strong> {o.clientName}</p>
            <p><strong>טלפון:</strong> {o.phone}</p>
            <p><strong>אירוע:</strong> {o.eventType}</p>
            <p><strong>תאריכים:</strong> {o.pickupDate} → {o.returnDate}</p>
            {o.note && (
              <p style={{ marginTop:'0.5rem', color:'#555' }}>
                <strong>הערה:</strong> {o.note}
              </p>
            )}

            <div style={{ display:'flex', gap:'0.5rem', justifyContent:'center', marginTop:'1rem' }}>
              {activeTab==='open' && (
                <>
                  <button onClick={()=>approve(o)}            style={btnGreen}>אישור</button>
                  <button onClick={()=>handleShowProducts(o)} style={btnBlue }>הצג מוצרים</button>
                  <button onClick={()=>removeOrder(o)}        style={btnRed  }>מחיקה</button>
                </>
              )}
              {activeTab==='approved' && (
                <>
                  <button onClick={()=>handleShowProducts(o)} style={btnBlue }>הצג מוצרים</button>
                  <button onClick={()=>openNotePopup(o)}       style={btnGray }>הוסף הערה</button>
                  <button onClick={()=>removeOrder(o)}        style={btnRed  }>מחיקה</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* פופ-אפ הערות */}
      {showNotePopup && (
        <div style={overlay}>
          <div style={modal}>
            <h3 style={{ textAlign:'center' }}>הוסף/עדכן הערה</h3>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              style={{ width:'100%', height:'80px', marginBottom:'1rem', padding:'8px' }}
            />
            <div style={{ textAlign:'center' }}>
              <button onClick={saveNote} disabled={savingNote} style={btnGreen}>
                {savingNote ? 'שומר…' : 'שמור'}
              </button>
              <button onClick={()=>setShowNotePopup(false)} style={btnGray}>ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* פופ־אפ מוצרים (קיים) */}
      {showProdPopup && (
        <div style={overlay}>
          <div style={modal}>
            <h3 style={{ textAlign:'center' }}>עריכת מוצרים</h3>
            <div style={{ maxHeight:'300px', overflow:'auto', marginBottom:'1rem' }}>
              {orderProducts.map(p => (
                <div key={p.id} style={prodRow}>
                  {p.imageUrl && <img src={p.imageUrl} alt={p.name} style={imgStyle}/>}
                  <span style={{ flex:1 }}>{p.name}</span>
                  <input
                    type="number" min={1}
                    value={p.quantity}
                    onChange={e=>updateProductQty(p.id, +e.target.value)}
                    style={{ width:'50px', textAlign:'center' }}
                  />
                  <button onClick={()=>removeProduct(p.id)} style={btnRed}>❌</button>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem' }}>
              <select
                value={newProdId}
                onChange={e=>setNewProdId(e.target.value)}
                style={{ flex:1, padding:'6px', borderRadius:'4px' }}
              >
                <option value="">בחר מוצר…</option>
                {allItems.map(it => (
                  <option key={it.id} value={it.id}>{it.name}</option>
                ))}
              </select>
              <input
                type="number" min={1}
                value={newProdQty}
                onChange={e=>setNewProdQty(+e.target.value)}
                style={{ width:'50px', textAlign:'center' }}
              />
              <button onClick={addProductToOrder} style={btnBlue}>➕</button>
            </div>
            <div style={{ textAlign:'center' }}>
              <button onClick={saveProducts} disabled={savingProducts} style={btnGreen}>
                {savingProducts ? 'שומר…' : 'שמור שינויים'}
              </button>
              <button onClick={()=>setShowProdPopup(false)} style={btnGray}>בטל</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==== סגנונות קצרים ====
const btnGreen = { border:'none', padding:'6px 12px', background:'#28a745', color:'white', borderRadius:'4px', cursor:'pointer' }
const btnBlue  = { border:'none', padding:'6px 12px', background:'#1976d2', color:'white', borderRadius:'4px', cursor:'pointer' }
const btnRed   = { border:'none', padding:'6px 12px', background:'#d32f2f', color:'white', borderRadius:'4px', cursor:'pointer' }
const btnGray  = { border:'none', padding:'6px 12px', background:'#999',    color:'white', borderRadius:'4px', cursor:'pointer' }
const overlay  = { position:'fixed', top:0,left:0,right:0,bottom:0, background:'rgba(0,0,0,0.4)', display:'flex', justifyContent:'center', alignItems:'center' }
const modal    = { background:'white', padding:'1rem', borderRadius:'8px', width:'90%', maxWidth:'500px' }
const prodRow  = { display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', direction:'rtl' }
const imgStyle = { width:'40px', height:'40px', objectFit:'cover', borderRadius:'4px' }
