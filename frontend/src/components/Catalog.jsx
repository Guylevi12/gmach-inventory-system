import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';

const Catalog = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const itemsCol = collection(db, 'items');
    const unsubscribe = onSnapshot(itemsCol, (snapshot) => {
      const itemList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(itemList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>טוען קטלוג</h2>
        <div className="spinner"></div>
      </div>
    );
  }

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem', direction: 'rtl', textAlign: 'right' }}>
      <h2>קטלוג</h2>

      <input
        type="text"
        placeholder="חיפוש פריט"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        dir="rtl"
        style={{
          padding: '10px',
          width: '100%',
          marginBottom: '1.5rem',
          borderRadius: '6px',
          border: '1px solid #ccc',
          fontSize: '1rem'
        }}
      />

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        marginTop: '1rem'
      }}>
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', width: '100%', marginTop: '2rem' }}>
            <h3>No matching items found.</h3>
            <p>Try searching something else.</p>
          </div>
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
              cursor: 'default'  // 👈 disables pointer style
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
              <h3 style={{ marginBottom: '0.5rem' }}>{item.name}</h3>
              <p>כמות: {item.quantity}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Catalog;
