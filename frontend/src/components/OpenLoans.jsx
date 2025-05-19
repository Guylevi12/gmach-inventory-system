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

  // popup states
  const [showProdPopup, setShowProdPopup] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState(null)
  const [orderProducts, setOrderProducts] = useState([])
  const [allItems, setAllItems] = useState([])
  const [newProdId, setNewProdId] = useState('')
  const [newProdQty, setNewProdQty] = useState(1)
  const [savingProducts, setSavingProducts] = useState(false)

  // load all orders once
  async function fetchOrders() {
    const snap = await getDocs(collection(db, 'orders'))
    setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }
  useEffect(() => { fetchOrders() }, [])

  // separate into open / approved and filter by phone
  const openOrders     = orders.filter(o => o.status === 'open')
  const approvedOrders = orders.filter(o => o.status === 'approved')
  const filtered = (activeTab === 'open' ? openOrders : approvedOrders)
    .filter(o => o.phone?.includes(searchPhone.trim()))

  // approve: deduct inventory & flip status
  async function approve(order) {
    try {
      const orderRef = doc(db, 'orders', order.id)
      const orderSnap = await getDoc(orderRef)
      const data = orderSnap.data() || {}
      const items = Array.isArray(data.items) ? data.items : []

      // deduct each item's quantity from inventory
      for (const p of items) {
        const qty = parseInt(p.quantity, 10) || 0
        if (qty > 0) {
          const itemRef = doc(db, 'items', p.id)
          await updateDoc(itemRef, { quantity: increment(-qty) })
        }
      }

      // update order status
      await updateDoc(orderRef, { status: 'approved' })
      fetchOrders()
    } catch (err) {
      console.error('Error approving order:', err)
      alert('שגיאה באישור ההזמנה, בדוק console')
    }
  }

  // delete an order
  async function removeOrder(o) {
    if (!window.confirm('למחוק את ההזמנה?')) return
    await deleteDoc(doc(db, 'orders', o.id))
    fetchOrders()
  }

  // show products popup
  async function handleShowProducts(order) {
    setEditingOrderId(order.id)

    // load all active items
    const itemsSnap = await getDocs(
      query(collection(db, 'items'), where('isActive', '==', true))
    )
    const itemsMap = {}
    itemsSnap.docs.forEach(d => {
      const { name, imageUrl } = d.data()
      itemsMap[d.id] = { name, imageUrl }
    })
    setAllItems(Object.entries(itemsMap).map(([id, v]) => ({ id, ...v })))

    // merge with order.items (ensure array)
    const raw = Array.isArray(order.items) ? order.items : []
    const merged = raw.map(p => ({
      id:       p.id,
      name:     itemsMap[p.id]?.name     || p.name     || 'מוצר לא ידוע',
      imageUrl: itemsMap[p.id]?.imageUrl || p.imageUrl || '',
      quantity: p.quantity
    }))
    setOrderProducts(merged)

    setNewProdId('')
    setNewProdQty(1)
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
      id:       p.id,
      name:     p.name,
      imageUrl: p.imageUrl,
      quantity: p.quantity
    }))
    await updateDoc(doc(db, 'orders', editingOrderId), { items: cleaned })
    setShowProdPopup(false)
    setEditingOrderId(null)
    setSavingProducts(false)
    fetchOrders()
  }

  return (
    <div style={{ direction: 'rtl', padding: '1rem' }}>
      {/* search + tab buttons */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <input
          placeholder="חפש לפי טלפון"
          value={searchPhone}
          onChange={e => setSearchPhone(e.target.value)}
          style={{ width:'50%', padding:'8px', borderRadius:'4px' }}
        />
        <div style={{ marginTop:'0.5rem' }}>
          <button onClick={()=>setActiveTab('open')}     style={tabStyle(activeTab==='open')}>פתוחות</button>
          <button onClick={()=>setActiveTab('approved')} style={tabStyle(activeTab==='approved')}>מאושרות</button>
        </div>
      </div>

      {/* order cards */}
      <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' }}>
        {filtered.map(o => (
          <div key={o.id} style={cardStyle}>
            <p><strong>מס׳ הזמנה:</strong> {o.simpleId}</p>
            <p><strong>טלפון:</strong> {o.phone}</p>
            <p><strong>תאריכים:</strong> {o.pickupDate} → {o.returnDate}</p>
            <div style={buttonsRow}>
              {activeTab==='open' && (
                <>
                  <button onClick={()=>approve(o)}            style={btn('#28a745')}>אישור</button>
                  <button onClick={()=>handleShowProducts(o)} style={btn('#1976d2')}>הצג מוצרים</button>
                  <button onClick={()=>removeOrder(o)}        style={btn('#d32f2f')}>מחיקה</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* products popup */}
      {showProdPopup && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ textAlign:'center' }}>עריכת מוצרים</h3>
            <div style={{ maxHeight:'300px', overflow:'auto', marginBottom:'1rem' }}>
              {orderProducts.map(p => (
                <div key={p.id} style={prodRow}>
                  {p.imageUrl && <img src={p.imageUrl} alt={p.name} style={imgStyle} />}
                  <span style={{ flex:1 }}>{p.name}</span>
                  <input
                    type="number" min={1}
                    value={p.quantity}
                    onChange={e=>updateProductQty(p.id, +e.target.value)}
                    style={{ width:'50px', textAlign:'center' }}
                  />
                  <button onClick={()=>removeProduct(p.id)} style={btn('#d32f2f')}>❌</button>
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
              <button onClick={addProductToOrder} style={btn('#1976d2')}>➕</button>
            </div>
            <div style={{ textAlign:'center' }}>
              <button onClick={saveProducts} disabled={savingProducts} style={btn('#28a745')}>
                {savingProducts ? 'שומר…' : 'שמור שינויים'}
              </button>
              <button onClick={()=>setShowProdPopup(false)} style={btn('#999')}>בטל</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==== styles ====

const tabStyle = isActive => ({
  margin:'0 4px', padding:'6px 12px',
  background: isActive ? '#1976d2' : '#eee',
  color:     isActive ? 'white'    : '#333',
  border:'none', borderRadius:'4px', cursor:'pointer'
})
const cardStyle = {
  flex:1, border:'1px solid #ccc', borderRadius:'8px',
  padding:'1rem', background:'#fff', minWidth:'240px'
}
const buttonsRow = { display:'flex', gap:'0.5rem', justifyContent:'center' }
const btn = bg => ({
  border:'none', padding:'6px 12px', background:bg,
  color:'white', borderRadius:'4px', cursor:'pointer'
})
const overlayStyle = {
  position:'fixed', top:0,left:0,right:0,bottom:0,
  background:'rgba(0,0,0,0.4)',
  display:'flex', justifyContent:'center', alignItems:'center'
}
const modalStyle = {
  background:'white', padding:'1rem', borderRadius:'8px',
  width:'90%', maxWidth:'500px'
}
const prodRow = { display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', direction:'rtl' }
const imgStyle = { width:'40px', height:'40px', objectFit:'cover', borderRadius:'4px' }
