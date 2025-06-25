import React, { useEffect, useState, useRef } from 'react';
import { addItem, moveToDeletedItem, restoreDeletedItem } from '../services/firebase/itemsService';
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/firebase/firebase-config';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import imageCompression from 'browser-image-compression';
import ItemFormModal from './ItemFormModal';
import { FaEdit, FaTrash, FaPlus, FaUndo } from 'react-icons/fa';
import { useUser } from '../UserContext';

const ItemManager = () => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [items, setItems] = useState([]);
  const [deletedItems, setDeletedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletedSearch, setDeletedSearch] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [showDeletedPopup, setShowDeletedPopup] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [publicComment, setPublicComment] = useState('');
  const [internalComment, setInternalComment] = useState('');
  const { user } = useUser();
  const userName = user?.username || 'משתמש לא ידוע';

  const deletedModalRef = useRef(null);

  // Remove spinner arrows on number inputs
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      input[type=number]::-webkit-inner-spin-button,
      input[type=number]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type=number] { -moz-appearance: textfield; }
      
      /* רספונסיביות משופרת */
      .products-grid-mobile {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1.2rem;
        padding: 0;
      }
      
      .product-card-mobile {
        min-height: 380px;
        padding: 1rem;
      }
      
      .product-card-mobile img {
        height: 140px;
      }
      
      .product-card-mobile h3 {
        font-size: 1rem;
        margin: 0.5rem 0;
      }
      
      .product-card-mobile p {
        font-size: 0.875rem;
        margin: 0.25rem 0;
      }
      
      .product-card-mobile .button-group {
        flex-direction: row;
        gap: 0.5rem;
        width: 100%;
      }
      
      .product-card-mobile button {
        font-size: 0.8rem;
        padding: 6px 10px;
        flex: 1;
      }
      
      /* מובייל בלבד */
      @media (max-width: 768px) {
        .products-grid-mobile {
          grid-template-columns: 1fr 1fr !important;
          gap: 0.75rem !important;
          padding: 0 0.5rem;
        }
        
        .product-card-mobile {
          min-height: 320px !important;
          padding: 0.75rem !important;
        }
        
        .product-card-mobile img {
          height: 100px !important;
        }
        
        .product-card-mobile h3 {
          font-size: 0.9rem !important;
          margin: 0.5rem 0 !important;
        }
        
        .product-card-mobile p {
          font-size: 0.8rem !important;
          margin: 0.25rem 0 !important;
        }
        
        .product-card-mobile .button-group {
          flex-direction: column !important;
          gap: 0.3rem !important;
        }
        
        .product-card-mobile button {
          font-size: 0.75rem !important;
          padding: 4px 8px !important;
          width: 100% !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Fetch active & deleted items
  const fetchItems = async () => {
    // שלב 1: שליפת כל ההזמנות הפעילות
    const ordersSnap = await getDocs(collection(db, 'orders'));
    const openOrders = ordersSnap.docs
      .map(doc => doc.data())
      .filter(order => order.status === 'open');

    // שלב 2: בניית סט מזהי פריטים בשימוש
    const itemsInUse = new Set();
    openOrders.forEach(order => {
      order.items?.forEach(item => {
        itemsInUse.add(item.id); // שים לב שזה item.id, לא item.ItemId
      });
    });

    // שלב 3: שליפת כל הפריטים שלא נמחקו
    const itemsSnap = await getDocs(collection(db, 'items'));
    const itemsList = itemsSnap.docs
      .filter(doc => doc.data().isDeleted !== true)
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          inUse: itemsInUse.has(doc.id)
        };
      });

    setItems(itemsList);
  };

  const fetchDeletedItems = async () => {
    const snap = await getDocs(collection(db, 'deletedItems'));
    setDeletedItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchItems();
    fetchDeletedItems();
  }, []);

  // Close deleted modal on outside click or Escape
  useEffect(() => {
    const handleClickOutside = e => {
      if (showDeletedPopup && deletedModalRef.current && !deletedModalRef.current.contains(e.target)) {
        setShowDeletedPopup(false);
      }
    };
    const handleEsc = e => {
      if (e.key === 'Escape') setShowDeletedPopup(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showDeletedPopup]);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredDeleted = deletedItems.filter(item =>
    item.name.toLowerCase().includes(deletedSearch.toLowerCase())
  );

  const handleDeleteItem = async id => {
    if (!window.confirm('האם את/ה בטוח/ה שברצונך למחוק את המוצר?')) return;
    try {
      await moveToDeletedItem(id, userName);
      toast.success('המוצר הוסר מהרשימה.');
      fetchItems();
      fetchDeletedItems();
    } catch {
      toast.error('שגיאה במחיקת המוצר');
    }
  };

  const handleRestoreItem = async id => {
    if (!window.confirm('האם ברצונך להשיב את המוצר למלאי?')) return;
    try {
      await restoreDeletedItem(id, userName);
      toast.success('המוצר הושב למלאי בהצלחה.');
      fetchItems();
      fetchDeletedItems();
    } catch {
      toast.error('שגיאה בהחזרת המוצר');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const q = query(collection(db, 'items'), where('name', '==', name.trim()));
      const snap = await getDocs(q);

      let finalImage = imageUrl;
      if (imageFile) {
        const compressed = await imageCompression(imageFile, {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 1024,
          useWebWorker: true
        });
        const ref = storage.ref(`items/${Date.now()}-${imageFile.name}`);
        await ref.put(compressed);
        finalImage = await ref.getDownloadURL();
      }

      if (editingItem) {
        await updateDoc(doc(db, 'items', editingItem.id), {
          name,
          quantity: parseInt(quantity),
          imageUrl: finalImage,
          publicComment,
          internalComment,
          updatedBy: userName,
          updatedAt: serverTimestamp()
        });
        toast.success('המוצר עודכן בהצלחה');
      } else if (!snap.empty) {
        const data = snap.docs[0].data();
        confirmAlert({
          title: 'המוצר כבר קיים',
          message: `המוצר "${name}" כבר קיים בכמות ${data.quantity}.\nהאם להוסיף ${quantity}?`,
          buttons: [
            {
              label: 'כן',
              onClick: async () => {
                await addItem({
                  name,
                  quantity: parseInt(quantity),
                  imageUrl: finalImage,
                  publicComment,
                  internalComment,
                  createdBy: userName,
                  updatedBy: userName,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
                toast.success('הכמות עודכנה בהצלחה');
                fetchItems();
                fetchDeletedItems();
              }
            },
            { label: 'לא', onClick: () => toast.info('בוטל') }
          ]
        });
        return;
      } else {
        await addItem({
          name,
          quantity: parseInt(quantity),
          imageUrl: finalImage,
          publicComment,
          internalComment,
          createdBy: userName,
          updatedBy: userName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success(`המוצר "${name}" נוסף בהצלחה`);
      }

      // Reset
      setName(''); setQuantity(''); setImageFile(null);
      setImageUrl(''); setPublicComment(''); setInternalComment('');
      setShowPopup(false); setEditingItem(null);
      fetchItems(); fetchDeletedItems();
    } catch {
      toast.error('הוספת המוצר נכשלה');
    }
  };

  return (
    <div className="page-container" style={{ padding: '1rem', direction: 'rtl' }}>
      {/* Active Items Section */}
      <div style={{ width: '100%' }}>
        <h2>ניהול מוצרים</h2>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-start', 
          gap: '1rem', 
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => {
              setEditingItem(null);
              setName(''); setQuantity(''); setImageUrl(''); setImageFile(null);
              setShowPopup(true); setPublicComment(''); setInternalComment('');
            }}
            className="btn-primary"
            style={{
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <FaPlus size={14} /> הוספת מוצר
          </button>
          <button
            onClick={() => setShowDeletedPopup(true)}
            className="btn-secondary"
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <FaTrash size={14} /> מוצרים שנמחקו
          </button>
        </div>

        <input
          type="text"
          dir="rtl"
          placeholder="חיפוש מוצר..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
          style={{
            padding: '10px',
            borderRadius: '6px',
            fontSize: '1rem',
            border: '1px solid #ccc',
            width: '100%',
            marginBottom: '1rem',
            boxSizing: 'border-box'
          }}
        />

        <div className="products-grid-mobile">
          {filteredItems.length === 0 ? (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center' }}>לא נמצא מוצרים במלאי.</p>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                className="product-card product-card-mobile"
                style={{
                  width: '100%',
                  border: '1px solid #e0e0e0',
                  borderRadius: '10px',
                  backgroundColor: '#fff',
                  padding: '1rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'transform 0.2s',
                  boxSizing: 'border-box'
                }}
              >
                <img
                  src={item.imageUrl || '/no-image-available.png'}
                  alt={item.name}
                  style={{
                    width: '100%',
                    height: '140px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    marginBottom: '0.5rem'
                  }}
                />
                <h3 style={{ margin: '0.5rem 0', fontSize: '1rem' }}>{item.name}</h3>
                <p style={{ margin: '0.25rem 0' }}>כמות: {item.quantity}</p>
                {item.internalComment && (
                  <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem', margin: '0.25rem 0' }}>
                    📌 {item.internalComment}
                  </p>
                )}
                <p style={{ fontSize: '0.85rem', color: '#555', margin: '0.25rem 0' }}>
                  מזהה מוצר: {item.ItemId}
                </p>
                {item.inUse && (
                  <p style={{ 
                    color: '#d97706', 
                    fontWeight: 'bold', 
                    fontSize: '0.85rem', 
                    margin: '0.25rem 0' 
                  }}>
                    🕐 מוצר זה נמצא בהזמנה פעילה
                  </p>
                )}
                <div className="button-group" style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  marginTop: 'auto',
                  width: '100%'
                }}>
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setName(item.name);
                      setQuantity(item.quantity.toString());
                      setImageUrl(item.imageUrl || '');
                      setImageFile(null);
                      setShowPopup(true);
                      setPublicComment(item.publicComment || '');
                      setInternalComment(item.internalComment || '');
                    }}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '6px 10px',
                      borderRadius: '5px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      flex: '1'
                    }}
                  >
                    <FaEdit size={14} /> עריכה
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    style={{
                      backgroundColor: '#d32f2f',
                      color: 'white',
                      border: 'none',
                      padding: '6px 10px',
                      borderRadius: '5px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      flex: '1'
                    }}
                  >
                    <FaTrash size={14} /> מחיקה
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Deleted Items Modal */}
      {showDeletedPopup && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div
            className="modal-content"
            ref={deletedModalRef}
            style={{
              position: 'relative',
              backgroundColor: 'white',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '80%',
              overflowY: 'auto',
              padding: '2rem',
              direction: 'rtl'
            }}
          >
            <h2>מוצרים שנמחקו</h2>
            <button
              onClick={() => setShowDeletedPopup(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>

            <input
              type="text"
              dir="rtl"
              placeholder="חיפוש מוצרים שנמחקו..."
              value={deletedSearch}
              onChange={e => setDeletedSearch(e.target.value)}
              className="search-input"
              style={{
                padding: '10px',
                borderRadius: '6px',
                fontSize: '1rem',
                border: '1px solid #ccc',
                width: '100%',
                margin: '1rem 0',
                boxSizing: 'border-box'
              }}
            />

            <div className="products-grid-mobile">
              {filteredDeleted.length === 0 ? (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center' }}>אין פריטים שנמחקו.</p>
              ) : (
                filteredDeleted.map(item => (
                  <div
                    key={item.id}
                    className="product-card-mobile"
                    style={{
                      width: '100%',
                      border: '1px solid #e0e0e0',
                      borderRadius: '10px',
                      backgroundColor: '#fff',
                      padding: '1rem',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'center',
                      boxSizing: 'border-box'
                    }}
                  >
                    <img
                      src={item.imageUrl || '/no-image-available.png'}
                      alt={item.name}
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        marginBottom: '0.5rem'
                      }}
                    />
                    <h3 style={{ margin: '0.5rem 0' }}>{item.name}</h3>
                    <p style={{ margin: '0.25rem 0' }}>כמות: {item.quantity}</p>
                    <button
                      onClick={() => handleRestoreItem(item.id)}
                      style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '5px',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        marginTop: 'auto'
                      }}
                    >
                      <FaUndo size={14} /> השבה
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showPopup && (
        <ItemFormModal
          editingItem={editingItem}
          name={name}
          quantity={quantity}
          imageUrl={imageUrl}
          imageFile={imageFile}
          publicComment={publicComment}
          internalComment={internalComment}
          onNameChange={e => setName(e.target.value.trimStart())}
          onQuantityChange={e => setQuantity(e.target.value.trimStart())}
          onImageUrlChange={e => setImageUrl(e.target.value)}
          onImageFileChange={e => setImageFile(e.target.files[0])}
          onPublicCommentChange={e => setPublicComment(e.target.value)}
          onInternalCommentChange={e => setInternalComment(e.target.value)}
          onCancel={() => setShowPopup(false)}
          onSubmit={handleSubmit}
        />
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default ItemManager;