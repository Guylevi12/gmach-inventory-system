import React, { useEffect, useState } from 'react';
import { addItem } from '../services/firebase/itemsService';
import { collection, getDocs, query, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/firebase/firebase-config';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import imageCompression from 'browser-image-compression';
import BarcodeScanner from './BarcodeScanner';

const uniformButtonStyle = {
  padding: '10px 16px',
  backgroundColor: '#1976d2',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  width: '100%',
  maxWidth: '180px',
  height: '40px',
  fontSize: '16px',
  fontWeight: 'normal'
};

const ItemManager = () => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [items, setItems] = useState([]);
  const [nameError, setNameError] = useState('');
  const [quantityError, setQuantityError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [touchedName, setTouchedName] = useState(false);
  const [touchedQuantity, setTouchedQuantity] = useState(false);
  const [nameDir, setNameDir] = useState('ltr');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [barcode, setBarcode] = useState('');
  const [showScanner, setShowScanner] = useState(false);





  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const buttonStyle = {
    padding: '10px 16px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '1rem',
    width: '100%',
    maxWidth: '180px',
    height: '40px'
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

  useEffect(() => {
    let valid = true;

    const nameRegex = /^[A-Za-z\u0590-\u05FF\s]+$/;
    if (!name) {
      setNameError('Name is required.');
      valid = false;
    } else if (!nameRegex.test(name)) {
      setNameError('Name must contain only letters.');
      valid = false;
    } else {
      setNameError('');
    }

    const quantityNum = parseInt(quantity);
    if (!quantity) {
      setQuantityError('Quantity is required.');
      valid = false;
    } else if (isNaN(quantityNum) || quantityNum <= 0) {
      setQuantityError('Quantity must be a positive number.');
      valid = false;
    } else {
      setQuantityError('');
    }

    setIsFormValid(valid);
  }, [name, quantity]);

  const fetchItems = async () => {
    const itemsCol = collection(db, 'items');
    const itemsSnapshot = await getDocs(itemsCol);
    const itemList = itemsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setItems(itemList);
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value.trimStart());

    // Detect Hebrew characters
    const firstChar = value.trim().charAt(0);
    const isHebrew = /^[\u0590-\u05FF]$/.test(firstChar);
    setNameDir(isHebrew ? 'rtl' : 'ltr');
  };




  const handleQuantityChange = (e) => {
    setQuantity(e.target.value.trimStart());
  };

  const handleQuantityChangeForItem = (id, value) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, newQuantity: value } : item
      )
    );
  };

  const handleUpdateQuantity = async (id) => {
    const item = items.find(item => item.id === id);
    const newQuantity = parseInt(item.newQuantity);

    if (isNaN(newQuantity) || newQuantity <= 0) {
      toast.error('Quantity must be a positive number.');
      return;
    }

    const itemRef = doc(db, 'items', id);
    await updateDoc(itemRef, { quantity: newQuantity });

    toast.success('Quantity updated successfully!');
    fetchItems();
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    const itemRef = doc(db, 'items', id);
    await deleteDoc(itemRef);

    toast.success('Item deleted successfully!');
    fetchItems();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const itemsCol = collection(db, 'items');
      const q = query(itemsCol, where('name', '==', name.trim()));
      const snapshot = await getDocs(q);

      let finalImageUrl = imageUrl; // take the pasted URL

      if (imageFile) {
        const storageRef = storage.ref(`items/${Date.now()}-${imageFile.name}`);
        const compressedImage = await imageCompression(imageFile, {
          maxSizeMB: 0.2,         // Compress to ~200KB
          maxWidthOrHeight: 1024, // Resize max dimension to 1024px
          useWebWorker: true
        });

        await storageRef.put(compressedImage);

        finalImageUrl = await storageRef.getDownloadURL(); // override only if file uploaded
      }



      if (!snapshot.empty) {
        const existingDoc = snapshot.docs[0];
        const existingData = existingDoc.data();

        confirmAlert({
          title: 'Item Already Exists!',
          message: `Item "${name}" already exists with quantity ${existingData.quantity}.\nDo you want to add ${quantity} to it?\nNew quantity would be ${existingData.quantity + parseInt(quantity)}.`,
          buttons: [
            {
              label: 'Yes',
              onClick: async () => {
                await addItem({
                  name,
                  quantity: parseInt(quantity),
                  allowMerge: true,
                  existingItemId: existingDoc.id,
                  imageUrl: finalImageUrl,
                  barcode,
                });
                toast.success(`Quantity updated successfully!`);
                setName('');
                setQuantity('');
                fetchItems();
                setImageFile(null);
                setImageUrl('');
              }
            },
            {
              label: 'No',
              onClick: () => {
                toast.info('No changes made.');
              }
            }
          ]
        });

      } else {  
        await addItem({
          name,
          quantity: parseInt(quantity),
          imageUrl: finalImageUrl,
          barcode,
        });
        toast.success(`Item "${name}" added successfully.`);
        setName('');
        setQuantity('');
        fetchItems();
        setImageFile(null);
        setImageUrl('');
      }

    } catch (err) {
      console.error(err);
      toast.error('Failed to add item.');
    }
    setTouchedName(false);
    setTouchedQuantity(false);
  };



  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '2rem',
      width: '100%'
    }}>
      {/* LEFT SIDE: Form */}
      <div style={{
        flex: '0 0 40%',
        marginRight: '2rem',
        padding: '1.5rem',
        backgroundColor: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        borderRadius: '10px',
        border: '1px solid #eee'
      }}>
        <h2 dir="rtl">הוספת מוצר חדש</h2>
        <form onSubmit={handleSubmit} dir="rtl">

          <input
            type="text"
            placeholder="הכנס קישור לתמונה"
            value={imageUrl}
            onChange={(e) => {
              let value = e.target.value;

              // Auto-convert imgur gallery links
              if (value.includes('imgur.com/gallery/')) {
                const id = value.split('/').pop();
                value = `https://i.imgur.com/${id}.jpg`;
                toast.info('Auto-converted Imgur gallery link to direct image!');
              }

              const isValidImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(value);

              if (isValidImage || value === '') {
                setImageUrl(value);
              } else {
                toast.error('Please paste a direct link to an image (ending with .jpg, .png, etc.)');
              }
            }}

            style={{
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '1rem',
              width: '100%',
              marginBottom: '1rem'
            }}
          />
          <input
            type="text"
            placeholder="ברקוד (אופציונלי)"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            style={{
              padding: '10px',
              borderRadius: '6px',
              fontSize: '1rem',
              border: '1px solid #ccc',
              width: '100%',
              marginBottom: '1rem'
            }}
          />

          {showScanner && (
            <BarcodeScanner
              onScanSuccess={(scannedCode) => {
                setBarcode(scannedCode);
                setShowScanner(false);
                toast.success(`ברקוד נסרק: ${scannedCode}`);
              }}
              onClose={() => setShowScanner(false)}
            />
          )}


          {(imageUrl || imageFile) && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <h4>Image Preview:</h4>
              <img
                src={
                  imageFile
                    ? URL.createObjectURL(imageFile)
                    : (/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(imageUrl)
                      ? imageUrl
                      : '/no-image-available.png')
                }
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', objectFit: 'contain' }}
              />
            </div>
          )}
<div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>

  <button
    type="button"
    onClick={() => setShowScanner(true)}
    style={uniformButtonStyle}
  >
    📷 סרוק ברקוד
  </button>

  <label
  htmlFor="imageUpload"
  style={{
    ...uniformButtonStyle,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0.2px 14px',
    maxWidth: '150px',
    height: '40px'
  }}
>
  בחר תמונה
  <input
    id="imageUpload"
    type="file"
    accept="image/*"
    onChange={(e) => setImageFile(e.target.files[0])}
    style={{ display: 'none' }}
  />
</label>


</div>

          <input
            type="text"
            dir="rtl"
            placeholder="שם המוצר"
            value={name}
            onChange={handleNameChange}
            onBlur={() => setTouchedName(true)}
            style={{
              padding: '10px',
              borderRadius: '6px',
              fontSize: '1rem',
              border: '1px solid #ccc',
              width: '100%',
              boxShadow: touchedName && nameError ? '0 0 0 2px rgba(255, 0, 0, 0.2)' : 'none',
              backgroundColor: touchedName && nameError ? '#fff5f5' : 'white'
            }}
          />
          {touchedName && nameError && <div style={{ color: '#cc0000', fontSize: '0.85rem', marginTop: '4px' }}>{nameError}</div>}
          <br /><br />

          <input
            type="number"
            placeholder="כמות"
            value={quantity}
            onChange={handleQuantityChange}
            onBlur={() => setTouchedQuantity(true)}
            style={{
              padding: '10px',
              borderRadius: '6px',
              fontSize: '1rem',
              border: '1px solid #ccc',
              width: '100%',
              boxShadow: touchedQuantity && quantityError ? '0 0 0 2px rgba(255, 0, 0, 0.2)' : 'none',
              backgroundColor: touchedQuantity && quantityError ? '#fff5f5' : 'white',
              MozAppearance: 'textfield',
              appearance: 'textfield'
            }}
          />
          {touchedQuantity && quantityError && <div style={{ color: '#cc0000', fontSize: '0.85rem', marginTop: '4px' }}>{quantityError}</div>}
          <br /><br />

          <button type="submit" disabled={!isFormValid} style={{
            padding: '10px 16px',
            backgroundColor: isFormValid ? '#1976d2' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isFormValid ? 'pointer' : 'not-allowed'
          }}>
            הוסף מוצר
          </button>
        </form>
      </div>

      {/* RIGHT SIDE: Items */}
      <div style={{ flex: '0 0 55%', textAlign: 'right', direction: 'rtl' , marginTop: '24px' }}>
      <h2 dir="rtl" style={{ textAlign: 'right', marginRight: '40px' }}>מוצרים</h2>


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
            width: '90%',
            marginBottom: '1rem',
            marginRight: '40px' 
          }}
        />

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem'
        }}>
          {filteredItems.length === 0 ? (
            <p>No matching items found.</p>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} style={{
                flex: '1 1 220px',
                maxWidth: '150px',
                border: '1px solid #ccc',
                padding: '0.8rem',
                borderRadius: '8px',
                boxShadow: '2px 2px 6px rgba(0,0,0,0.1)',
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease-in-out',
                textAlign: 'right',
                direction: 'rtl',
                marginRight: '40px'
              }}>
                <img
                  src={item.imageUrl || '/no-image-available.png'}
                  alt={item.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />

                <h3 style={{ margin: '0 0 0.5rem' }}>{item.name}</h3>
                <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
                  מזהה: {item.id}
                </p>


                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem' }}>כמות:</label><br />
                  <input
                    type="number"
                    value={item.newQuantity !== undefined ? item.newQuantity : item.quantity}
                    onChange={(e) => handleQuantityChangeForItem(item.id, e.target.value)}
                    style={{
                      width: '80px',
                      padding: '4px',
                      marginTop: '4px',
                      marginBottom: '8px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
  <button onClick={() => handleUpdateQuantity(item.id)} style={{
    flex: 1,
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    height: '36px'
  }}>
    Save
  </button>
  <button onClick={() => handleDeleteItem(item.id)} style={{
    flex: 1,
    backgroundColor: '#d32f2f',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    height: '36px'
  }}>
    Delete
  </button>
</div>

              </div>
            ))
          )}
        </div>
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
