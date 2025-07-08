import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { normalizeItemImages } from '../utils/imageUtils';
import ImageGallery from './ImageGallery';
import { ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react';

// רכיב Modal להצגת מוצר בגדול
const ProductModal = ({ item, isOpen, onClose }) => {
  if (!isOpen || !item) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        direction: 'rtl'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          padding: '1.5rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1001,
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
          onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
        >
          <X size={20} />
        </button>

        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
          gap: '2rem',
          alignItems: 'flex-start'
        }}>
          <div style={{
            flex: window.innerWidth <= 768 ? 'none' : '1',
            width: window.innerWidth <= 768 ? '100%' : '400px'
          }}>
            <ImageGallery 
              item={item}
              width="100%"
              height={window.innerWidth <= 768 ? "300px" : "400px"}
              showNavigation={true}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
          </div>

          <div style={{
            flex: '1',
            minWidth: '300px'
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              {item.name}
            </h2>

            <div style={{
              backgroundColor: '#f8fafc',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <p style={{
                fontSize: '1.1rem',
                color: '#4b5563',
                margin: 0,
                textAlign: 'center'
              }}>
                <strong>מזהה מוצר:</strong> {item.ItemId}
              </p>
            </div>

            {item.publicComment && (
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <h4 style={{
                  margin: '0 0 0.5rem 0',
                  color: '#1e40af',
                  fontSize: '1rem'
                }}>
                  📝 הערות
                </h4>
                <p style={{
                  margin: 0,
                  color: '#1e3a8a',
                  fontSize: '1rem'
                }}>
                  {item.publicComment}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// רכיב Pagination
const Pagination = ({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange,
  className = ""
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const isMobile = window.innerWidth <= 768;
  
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const maxVisible = isMobile ? 5 : 7;
    const half = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    const pages = [];
    
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('...');
      }
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`pagination-container ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      margin: '2rem 0',
      direction: 'rtl'
    }}>
      <div style={{
        fontSize: isMobile ? '0.875rem' : '1rem',
        color: '#6b7280',
        textAlign: 'center'
      }}>
        מציג {startItem}-{endItem} מתוך {totalItems} מוצרים
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.25rem' : '0.5rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isMobile ? '36px' : '40px',
            height: isMobile ? '36px' : '40px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            background: currentPage === 1 ? '#f9fafb' : 'white',
            color: currentPage === 1 ? '#9ca3af' : '#374151',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <ChevronRight size={isMobile ? 16 : 20} />
        </button>

        {visiblePages.map((page, index) => {
          if (page === '...') {
            return (
              <div key={`dots-${index}`} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                color: '#9ca3af'
              }}>
                <MoreHorizontal size={isMobile ? 16 : 20} />
              </div>
            );
          }

          const isActive = page === currentPage;
          
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                border: isActive ? '2px solid #3b82f6' : '1px solid #d1d5db',
                borderRadius: '8px',
                background: isActive ? '#3b82f6' : 'white',
                color: isActive ? 'white' : '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: isActive ? 'bold' : 'normal',
                fontSize: isMobile ? '14px' : '16px'
              }}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isMobile ? '36px' : '40px',
            height: isMobile ? '36px' : '40px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            background: currentPage === totalPages ? '#f9fafb' : 'white',
            color: currentPage === totalPages ? '#9ca3af' : '#374151',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <ChevronLeft size={isMobile ? 16 : 20} />
        </button>
      </div>
    </div>
  );
};

const Catalog = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // הוספת state לפגינציה
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // הגדרת כמות פריטים בעמוד לפי גודל מסך
  const itemsPerPage = isMobile ? 12 : 20;

  // מעקב אחר שינויי גודל מסך
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
        setCurrentPage(1);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // איפוס עמוד כאשר משתנה החיפוש
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  const handleItemClick = (item, event) => {
    // בדיקה אם הלחיצה הייתה על כפתור ניווט (חצים)
    if (event.target.closest('button') || event.target.closest('[data-navigation]')) {
      return; // לא פותחים את המודאל אם לחצו על חץ
    }
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }}></div>
        <h2>טוען קטלוג</h2>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // חישוב פריטים מסוננים
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // חישוב פריטים לתצוגה בעמוד הנוכחי
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  return (
    <div style={{
      padding: '2rem',
      direction: 'rtl',
      textAlign: 'right',
      paddingLeft: '1rem',
      paddingRight: '1rem'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '2rem',
        fontSize: '2rem',
        color: '#1f2937'
      }}>
       קטלוג מוצרים
      </h2>

      <input
        type="text"
        placeholder="חיפוש פריט"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        dir="rtl"
        style={{
          padding: '12px 16px',
          width: '100%',
          marginBottom: '1.5rem',
          borderRadius: '8px',
          border: '2px solid #e5e7eb',
          fontSize: '1rem',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s ease'
        }}
        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
      />

      {/* תצוגת סטטיסטיקות חיפוש */}
      {searchTerm && (
        <div style={{
          background: '#f0f9ff',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #0ea5e9',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, color: '#0369a1', fontSize: '1rem' }}>
            🔍 נמצאו {filteredItems.length} מוצרים עבור "{searchTerm}"
          </p>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginTop: '1rem'
      }}>
        {currentItems.length === 0 ? (
          <div style={{
            textAlign: 'center',
            gridColumn: '1 / -1',
            marginTop: '3rem',
            padding: '2rem'
          }}>
            {searchTerm ? (
              <>
                <h3 style={{ color: '#6b7280', marginBottom: '1rem' }}>
                  לא נמצאו פריטים עבור "{searchTerm}"
                </h3>
                <p style={{ color: '#9ca3af' }}>
                  נסה לחפש במילות מפתח אחרות
                </p>
              </>
            ) : (
              <>
                <h3 style={{ color: '#6b7280', marginBottom: '1rem' }}>
                  לא נמצאו פריטים
                </h3>
                <p style={{ color: '#9ca3af' }}>
                  אנא נסה לחפש שוב או צור קשר עם המנהלים
                </p>
              </>
            )}
          </div>
        ) : (
          currentItems.map(item => (
            <div 
              key={item.ItemId} 
              style={{
                border: '1px solid #e5e7eb',
                padding: '0.8rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.3s ease-in-out',
                minHeight: '250px',
                maxWidth: '100%',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
              onClick={(event) => handleItemClick(item, event)}
            >
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
                  fontSize: '1.1rem', // הגדלתי מ-0.9rem
                  lineHeight: '1.3',
                  textAlign: 'center',
                  color: '#1f2937',
                  fontWeight: '700' // חיזקתי מ-600
                }}>
                  {item.name}
                </h3>
                
                {/* הערה לפרסום (אם קיימת) */}
                {item.publicComment && (
                  <p style={{
                    fontSize: '0.8rem', // הגדלתי מ-0.75rem
                    color: '#6b7280',
                    textAlign: 'center',
                    margin: '0.3rem 0',
                    fontStyle: 'italic',
                    background: '#f9fafb',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px'
                  }}>
                    📝 {item.publicComment}
                  </p>
                )}

                {/* מזהה מוצר */}
                <div style={{
                  fontSize: '0.75rem', // הגדלתי מ-0.7rem
                  color: '#9ca3af',
                  textAlign: 'center',
                  marginTop: 'auto',
                  paddingTop: '0.5rem'
                }}>
                  מזהה: {item.ItemId}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredItems.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      {/* Modal להצגת מוצר */}
      <ProductModal 
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

      {/* CSS נוסף למובייל */}
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