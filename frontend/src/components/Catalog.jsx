import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { normalizeItemImages } from '../utils/imageUtils';
import ImageGallery from './ImageGallery';

const Catalog = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const itemsCol = collection(db, 'items');
    const unsubscribe = onSnapshot(itemsCol, (snapshot) => {
      const itemList = snapshot.docs
        .map(doc => {
          const data = doc.data();
          const normalizedItem = normalizeItemImages(data);
          return {
            id: doc.id,
            ...normalizedItem
          };
        })
        .filter(item => item.isDeleted !== true);
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
    <div style={{
      padding: '2rem',
      direction: 'rtl',
      textAlign: 'right',
      // 📱 תיקון למובייל
      paddingLeft: '1rem',
      paddingRight: '1rem'
    }}>
      <h2>קטלוג</h2>

      <input
        type="text"
        placeholder="חיפוש פריט"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        dir="rtl"
        style={{
          padding: '10px',
          width: '100%',
          marginBottom: '1.5rem',
          borderRadius: '6px',
          border: '1px solid #ccc',
          fontSize: '1rem',
          boxSizing: 'border-box'
        }}
      />

      <div style={{
        display: 'grid',
        // 📱 במובייל: 2 עמודות, בדסקטופ: עד 6 עמודות
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginTop: '1rem'
      }}>
        {filteredItems.length === 0 ? (
          <div style={{
            textAlign: 'center',
            gridColumn: '1 / -1',
            marginTop: '2rem'
          }}>
            <h3>לא נמצאו פריטים.</h3>
            <p>אנה נסה לחפש שוב.</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.ItemId} style={{
              border: '1px solid #ccc',
              padding: '0.8rem',
              borderRadius: '8px',
              boxShadow: '2px 2px 6px rgba(0,0,0,0.1)',
              backgroundColor: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s ease-in-out',
              opacity: 1,
              filter: 'none',
              // 📱 תיקון גובה וחלוקת מקום
              minHeight: '200px',
              maxWidth: '100%'
            }}>
              {/* החלפת img ב-ImageGallery */}
              <ImageGallery 
                item={item}
                width="100%"
                height="140px"
                showNavigation={true}
                style={{
                  marginBottom: '0.5rem',
                  borderRadius: '4px'
                }}
              />
              
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <h3 style={{
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem', // 📱 טקסט קצת יותר קטן במובייל
                  lineHeight: '1.2',
                  textAlign: 'center'
                }}>
                  {item.name}
                </h3>
                {item.publicComment && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#444',
                    textAlign: 'center',
                    margin: '0.3rem 0 0 0'
                  }}>
                    📝 {item.publicComment}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 📱 CSS נוסף למובייל */}
      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.8rem !important;
          }
        }
        
        @media (max-width: 480px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.6rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Catalog;