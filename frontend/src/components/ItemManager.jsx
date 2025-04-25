import React, { useEffect, useState } from 'react';
import { addItem } from '../services/firebase/itemsService';
import { collection, getDocs, query, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase-config';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

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



  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  existingItemId: existingDoc.id
                });
                toast.success(`Quantity updated successfully!`);
                setName('');
                setQuantity('');
                fetchItems();
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
        });
        toast.success(`Item "${name}" added successfully.`);
        setName('');
        setQuantity('');
        fetchItems();
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
        <h2>Add New Item</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
             dir={nameDir}
            placeholder="Name"
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
            placeholder="Quantity"
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
            Add Item
          </button>
        </form>
      </div>

      {/* RIGHT SIDE: Items */}
      <div style={{ flex: '0 0 55%', textAlign: 'left' }}>
        <h2>All Items</h2>

        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px',
            borderRadius: '6px',
            fontSize: '1rem',
            border: '1px solid #ccc',
            width: '100%',
            marginBottom: '1rem'
          }}
        />

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {filteredItems.length === 0 ? (
            <p>No matching items found.</p>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} style={{
                border: '1px solid #ccc',
                padding: '1rem',
                borderRadius: '8px',
                width: 'calc(50% - 1rem)',
                boxShadow: '2px 2px 6px rgba(0,0,0,0.1)',
                backgroundColor: 'white'
              }}>
                <h3 style={{ margin: '0 0 0.5rem' }}>{item.name}</h3>

                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem' }}>Quantity:</label><br />
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

                <button onClick={() => handleUpdateQuantity(item.id)} style={{
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '8px'
                }}>
                  Save
                </button>
                <button onClick={() => handleDeleteItem(item.id)} style={{
                  backgroundColor: '#d32f2f',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Delete
                </button>
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
