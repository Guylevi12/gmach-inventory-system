import React, { useEffect, useState } from 'react';
import { addItem } from '../services/firebase/itemsService';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/firebase/firebase-config';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import imageCompression from 'browser-image-compression';
import ItemFormModal from './ItemFormModal';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useUser } from '../UserContext';


const ItemManager = () => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [publicComment, setPublicComment] = useState('');
  const [internalComment, setInternalComment] = useState('');
  const { user } = useUser();



  const handlePublicCommentChange = (e) => setPublicComment(e.target.value);
  const handleInternalCommentChange = (e) => setInternalComment(e.target.value);


  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const uploadToCloudinary = async (file) => {
    const url = `https://api.cloudinary.com/v1_1/dpegnxew7/image/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'GmachSystem');
  
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });
  
    const data = await response.json();
    return data.secure_url;
  };
  

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    input[type=number] {
      -moz-appearance: textfield;
    }
  `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);



  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const itemsCol = collection(db, 'items');
    const q = query(itemsCol, where('isActive', '==', true));
    const itemsSnapshot = await getDocs(q);
    const itemList = itemsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setItems(itemList);
  };


  const handleNameChange = (e) => setName(e.target.value.trimStart());
  const handleQuantityChange = (e) => setQuantity(e.target.value.trimStart());

  const handleDeleteItem = async (id) => {
    if (!window.confirm('האם את/ה בטוח/ה שברצונך למחוק את המוצר?')) return;
    const itemRef = doc(db, 'items', id);
    await updateDoc(itemRef, { isActive: false });
    toast.success('המוצר הוסר מהרשימה.');
    fetchItems();
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const itemsCol = collection(db, 'items');
      const q = query(itemsCol, where('name', '==', name.trim()));
      const snapshot = await getDocs(q);
      const userName = user?.username || 'משתמש לא ידוע';


      let finalImageUrl = imageUrl;

      if (imageFile) {
        const storageRef = storage.ref(`items/${Date.now()}-${imageFile.name}`);
        const compressedImage = await imageCompression(imageFile, {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 1024,
          useWebWorker: true
        });

        await storageRef.put(compressedImage);
        finalImageUrl = await storageRef.getDownloadURL();
      }

      if (editingItem) {
        const itemRef = doc(db, 'items', editingItem.id);
        await updateDoc(itemRef, {
          name,
          quantity: parseInt(quantity),
          imageUrl: finalImageUrl,
          publicComment,
          internalComment,
          updatedBy: userName,
          updatedAt: serverTimestamp(),
        });
        toast.success(`המוצר עודכן בהצלחה`);
      } else if (!snapshot.empty) {
        const existingDoc = snapshot.docs[0];
        const existingData = existingDoc.data();

        confirmAlert({
          title: 'המוצר כבר קיים',
          message: `המוצר "${name}" כבר קיים עם כמות ${existingData.quantity}.\nהאם להוסיף ${quantity} אליו?\nסה"כ חדש יהיה ${existingData.quantity + parseInt(quantity)}.`,
          buttons: [
            {
              label: 'כן',
              onClick: async () => {
                await addItem({
                  name,
                  quantity: parseInt(quantity),
                  imageUrl: finalImageUrl,
                  publicComment,
                  internalComment,
                  createdBy: userName,
                  updatedBy: userName,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                });

                toast.success(`הכמות עודכנה בהצלחה`);
                fetchItems();
              }
            },
            {
              label: 'לא',
              onClick: () => {
                toast.info('לא נעשו שינויים');
              }
            }
          ]
        });
        return; // עצר כאן, שלא יריץ את הקוד מתחת
      } else {
        await addItem({
          name,
          quantity: parseInt(quantity),
          imageUrl: finalImageUrl,
          publicComment,
          internalComment,
          createdBy: userName,
          updatedBy: userName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success(`המוצר "${name}" נוסף בהצלחה`);
      }
      setName('');
      setQuantity('');
      setImageFile(null);
      setImageUrl('');
      setPublicComment('');
      setInternalComment('');
      setShowPopup(false);
      setEditingItem(null);
      fetchItems();

    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
      toast.error('הוספת המוצר נכשלה');

    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '2rem',
      width: '100%'
    }}>
      {/* Items Section */}
      <div style={{ width: '100%', direction: 'rtl', padding: '2rem' }}>
        <button
          onClick={() => {
            setEditingItem(null);
            setName('');
            setQuantity('');
            setImageUrl('');
            setImageFile(null);
            setShowPopup(true);
            setPublicComment('');
            setInternalComment('');
          }}
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
            cursor: 'pointer',
            minWidth: 'fit-content'
          }}
          className="add-product-button"
        >
          <FaPlus size={14} />
          <span className="button-text">הוספת מוצר</span>
        </button>

        <input
          type="text"
          dir="rtl"
          placeholder="חיפוש מוצר..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px',
            borderRadius: '6px',
            fontSize: '1rem',
            border: '1px solid #ccc',
            width: '100%',
            margin: '1rem 0'
          }}
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1.5rem',
          paddingTop: '1rem',
          justifyItems: 'center'
        }}>

          {filteredItems.length === 0 ? (
            <p>לא נמצא מוצרים במלאי.</p>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} style={{
                width: '100%',
                maxWidth: '240px',
                minHeight: '420px',
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
                transition: 'transform 0.2s ease-in-out',
              }}>

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

                <h3>{item.name}</h3>
                <p>כמות: {item.quantity}</p>
                {item.internalComment && (
                  <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>
                    📌 {item.internalComment}
                  </p>
                )}
                <p style={{ fontSize: '0.85rem', color: '#555' }}>
                  מזהה מוצר: {item.ItemId}
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: 'auto' }}>
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setName(item.name);
                      setQuantity(item.quantity.toString());
                      setImageUrl(item.imageUrl || '');
                      setImageFile(null);
                      setShowPopup(true);
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
                      gap: '6px',
                      cursor: 'pointer'
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
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <FaTrash size={14} /> מחיקה
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Popup Modal */}
        {showPopup && (
          <ItemFormModal
            editingItem={editingItem}
            name={name}
            quantity={quantity}
            imageUrl={imageUrl}
            imageFile={imageFile}
            publicComment={publicComment}
            internalComment={internalComment}
            onNameChange={handleNameChange}
            onQuantityChange={handleQuantityChange}
            onImageUrlChange={(e) => setImageUrl(e.target.value)}
            onImageFileChange={(e) => setImageFile(e.target.files[0])}
            onPublicCommentChange={handlePublicCommentChange}
            onInternalCommentChange={handleInternalCommentChange}
            onCancel={() => setShowPopup(false)}
            onSubmit={handleSubmit}
          />
        )}
      </div>

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
