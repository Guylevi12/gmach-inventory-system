import React, { useEffect, useState, useRef } from 'react';
import { addItem, moveToDeletedItem, restoreDeletedItem } from '../services/firebase/itemsService';
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db, storage } from '@/firebase/firebase-config';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import imageCompression from 'browser-image-compression';
import ItemFormModal from './ItemFormModal';
import { FaEdit, FaTrash, FaPlus, FaUndo, FaEye } from 'react-icons/fa'; // ✅ הוספת FaEye
import { useUser } from '../UserContext';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

// הוספת imports חדשים
import { 
  normalizeItemImages, 
  getPrimaryImage, 
  migrateExistingItems 
} from '../utils/imageUtils';
import ImageGallery from './ImageGallery';
import ActiveOrdersModal from './ActiveOrdersModal'; // ✅ יבוא הקומפוננטה החדשה
import { AvailabilityChecker } from '@/services/availabilityChecker';

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
  
  // ✅ הוספת state לפגינציה
  const [currentPage, setCurrentPage] = useState(1);
  const [deletedCurrentPage, setDeletedCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // ✅ הוספת state למודל הזמנות פעילות
  const [showActiveOrdersModal, setShowActiveOrdersModal] = useState(false);
  const [selectedItemForOrders, setSelectedItemForOrders] = useState(null);
  
  const { user } = useUser();
  const userName = user?.username || 'משתמש לא ידוע';
  const deletedModalRef = useRef(null);

  // ✅ הגדרת כמות פריטים בעמוד לפי גודל מסך
  const itemsPerPage = isMobile ? 12 : 20;
  const deletedItemsPerPage = isMobile ? 12 : 20;

  // ✅ מעקב אחר שינויי גודל מסך
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
        // איפוס לעמוד ראשון כאשר מתחלף מצב המסך
        setCurrentPage(1);
        setDeletedCurrentPage(1);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // ✅ איפוס עמוד כאשר משתנה החיפוש
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setDeletedCurrentPage(1);
  }, [deletedSearch]);

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
        itemsInUse.add(item.id);
      });
    });

    // שלב 3: שליפת כל הפריטים שלא נמחקו
    const itemsSnap = await getDocs(collection(db, 'items'));
    const itemsList = itemsSnap.docs
      .filter(doc => doc.data().isDeleted !== true)
      .map(doc => {
        const data = doc.data();
        const normalizedItem = normalizeItemImages(data);
        return {
          id: doc.id,
          ...normalizedItem,
          inUse: itemsInUse.has(doc.id)
        };
      });

    setItems(itemsList);
  };

  const fetchDeletedItems = async () => {
    const snap = await getDocs(collection(db, 'deletedItems'));
    const deletedList = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id, 
        ...normalizeItemImages(data)
      };
    });
    setDeletedItems(deletedList);
  };

  useEffect(() => {
    // בדיקת migration חד-פעמית
    const runMigration = async () => {
      try {
        console.log('🔄 בדיקת migration למבנה תמונות חדש...');
        const result = await migrateExistingItems(
          db, 
          updateDoc, 
          doc, 
          getDocs, 
          collection
        );
        console.log('📊 תוצאות migration:', result);
      } catch (error) {
        console.log('⚠️ Migration כבר רץ או שאין צורך בו');
      }
    };

    // רץ migration אחת בלבד
    const migrationRun = localStorage.getItem('imagesMigrationComplete');
    if (!migrationRun) {
      runMigration().then(() => {
        localStorage.setItem('imagesMigrationComplete', 'true');
        // רענן את הפריטים אחרי migration
        fetchItems();
        fetchDeletedItems();
      });
    } else {
      fetchItems();
      fetchDeletedItems();
    }
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

  // ✅ חישוב פריטים מסוננים ופגינציה
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredDeleted = deletedItems.filter(item =>
    item.name.toLowerCase().includes(deletedSearch.toLowerCase())
  );

  // ✅ חישוב פריטים לתצוגה בעמוד הנוכחי
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const deletedStartIndex = (deletedCurrentPage - 1) * deletedItemsPerPage;
  const deletedEndIndex = deletedStartIndex + deletedItemsPerPage;
  const currentDeletedItems = filteredDeleted.slice(deletedStartIndex, deletedEndIndex);

  // ✅ פונקציה לפתיחת מודל הזמנות פעילות
  const handleViewActiveOrders = (item) => {
    console.log('🔍 פותח מודל הזמנות פעילות עבור:', item.name);
    setSelectedItemForOrders(item);
    setShowActiveOrdersModal(true);
  };

  const handleDeleteItem = async id => {
    if (!window.confirm('האם את/ה בטוח/ה שברצונך למחוק את המוצר?')) return;
    try {
      await moveToDeletedItem(id, userName);
      toast.success('המוצר הוסר מהרשימה.');
      fetchItems();
      fetchDeletedItems();
      
      // ✅ בדיקה אם צריך לחזור לעמוד קודם אחרי מחיקה
      const newFilteredCount = filteredItems.length - 1;
      const maxPage = Math.ceil(newFilteredCount / itemsPerPage);
      if (currentPage > maxPage && maxPage > 0) {
        setCurrentPage(maxPage);
      }
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
      
      // ✅ בדיקה אם צריך לחזור לעמוד קודם אחרי שחזור
      const newDeletedCount = filteredDeleted.length - 1;
      const maxDeletedPage = Math.ceil(newDeletedCount / deletedItemsPerPage);
      if (deletedCurrentPage > maxDeletedPage && maxDeletedPage > 0) {
        setDeletedCurrentPage(maxDeletedPage);
      }
    } catch {
      toast.error('שגיאה בהחזרת המוצר');
    }
  };

  const recheckAvailabilityAfterInventoryChange = async () => {
    try {
      const result = await AvailabilityChecker.checkAllActiveOrders();
      if (!result?.success) return;

      if (result.resolvedOrders > 0) {
        toast.success(`עודכנו אוטומטית ${result.resolvedOrders} הזמנות שנפתרו מבחינת מלאי.`);
      } else if (result.problematicOrders > 0) {
        toast.warn(`יש ${result.problematicOrders} הזמנות עם בעיות זמינות שדורשות עדכון.`);
      }
    } catch (error) {
      console.error('Availability recheck failed:', error);
    }
  };

  // תחליפי את החלק הזה בפונקציה handleSubmit:

  const handleSubmit = async (e, formData = null) => {
    e.preventDefault();
    
    try {
      // אם יש formData מהמודל החדש, השתמש בו
      const itemData = formData || {
        name,
        quantity: parseInt(quantity),
        images: imageUrl ? [imageUrl] : [],
        imageUrl: imageUrl,
        publicComment,
        internalComment
      };

      const q = query(collection(db, 'items'), where('name', '==', itemData.name.trim()));
      const snap = await getDocs(q);

      // 🔧 חישוב ItemId הבא - כמו שהיה לך קודם
      const allItemsSnap = await getDocs(collection(db, 'items'));
      const existingItemIds = allItemsSnap.docs
        .map(doc => doc.data().ItemId)
        .filter(id => typeof id === 'number')
        .sort((a, b) => b - a); // מיון בסדר יורד
      
      const nextItemId = existingItemIds.length > 0 ? existingItemIds[0] + 1 : 1;

      if (editingItem) {
        // עריכת מוצר קיים - לא משנים את ה-ItemId
        await updateDoc(doc(db, 'items', editingItem.id), {
          name: itemData.name,
          quantity: parseInt(itemData.quantity),
          images: itemData.images || [],
          imageUrl: itemData.images?.[0] || null,
          publicComment: itemData.publicComment || '',
          internalComment: itemData.internalComment || '',
          updatedBy: userName,
          updatedAt: serverTimestamp()
        });
        toast.success('המוצר עודכן בהצלחה');
        await recheckAvailabilityAfterInventoryChange();
      } else if (!snap.empty) {
        const data = snap.docs[0].data();
        confirmAlert({
          title: 'המוצר כבר קיים',
          message: `המוצר "${itemData.name}" כבר קיים בכמות ${data.quantity}.\nהאם להוסיף ${itemData.quantity}?`,
          buttons: [
            {
              label: 'כן',
              onClick: async () => {
                await addDoc(collection(db, 'items'), {
                  name: itemData.name,
                  quantity: parseInt(itemData.quantity),
                  images: itemData.images || [],
                  imageUrl: itemData.images?.[0] || null,
                  publicComment: itemData.publicComment || '',
                  internalComment: itemData.internalComment || '',
                  createdBy: userName,
                  updatedBy: userName,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  ItemId: nextItemId // 🔧 מזהה פשוט ומספרי
                });
                
                toast.success('הכמות עודכנה בהצלחה');
                await recheckAvailabilityAfterInventoryChange();
                fetchItems();
                fetchDeletedItems();
              }
            },
            { label: 'לא', onClick: () => toast.info('בוטל') }
          ]
        });
        return;
      } else {
        // מוצר חדש
        await addDoc(collection(db, 'items'), {
          name: itemData.name,
          quantity: parseInt(itemData.quantity),
          images: itemData.images || [],
          imageUrl: itemData.images?.[0] || null,
          publicComment: itemData.publicComment || '',
          internalComment: itemData.internalComment || '',
          createdBy: userName,
          updatedBy: userName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ItemId: nextItemId // 🔧 מזהה פשוט ומספרי
        });
        
        toast.success(`המוצר "${itemData.name}" נוסף בהצלחה עם ${itemData.images?.length || 0} תמונות`);
        await recheckAvailabilityAfterInventoryChange();
      }

      // Reset
      setName(''); setQuantity(''); setImageFile(null);
      setImageUrl(''); setPublicComment(''); setInternalComment('');
      setShowPopup(false); setEditingItem(null);
      fetchItems(); fetchDeletedItems();
    } catch (error) {
      console.error('שגיאה בהוספת המוצר:', error);
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

        {/* ✅ תצוגת סטטיסטיקות */}
        {searchTerm && (
          <div style={{
            background: '#f0f9ff',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #0ea5e9'
          }}>
            <p style={{ margin: 0, color: '#0369a1' }}>
              🔍 נמצאו {filteredItems.length} מוצרים עבור "{searchTerm}"
            </p>
          </div>
        )}

        {/* ✅ רשת מוצרים עם פגינציה */}
        <div className="products-grid-mobile">
          {currentItems.length === 0 ? (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
              {searchTerm ? `לא נמצאו מוצרים לחיפוש "${searchTerm}"` : 'לא נמצא מוצרים במלאי.'}
            </p>
          ) : (
            currentItems.map(item => (
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
                <ImageGallery 
                  item={item}
                  width="100%"
                  height="140px"
                  showNavigation={true}
                  style={{ marginBottom: '0.5rem' }}
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
                {/* ✅ שינוי הטקסט למספר רבים */}
                {item.inUse && (
                  <p style={{
                    color: '#d97706',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    margin: '0.25rem 0'
                  }}>
                    🕐 מוצר זה נמצא בהזמנות פעילות
                  </p>
                )}
                <div className="button-group" style={{
                  display: 'flex',
                  gap: '0.4rem',
                  marginTop: 'auto',
                  width: '100%',
                  flexDirection: 'column' // ✅ תמיד טור, גם בדסקטופ
                }}>
                  {/* ✅ כפתור "ראה הזמנות" - מוצג רק אם המוצר בשימוש */}
                  {item.inUse && (
                    <button
                      onClick={() => handleViewActiveOrders(item)}
                      style={{
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        padding: isMobile ? '4px 8px' : '6px 10px',
                        borderRadius: '5px',
                        fontSize: isMobile ? '0.75rem' : '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        width: '100%',
                        minHeight: isMobile ? '28px' : '32px'
                      }}
                    >
                      <FaEye size={isMobile ? 12 : 14} /> ראה הזמנות
                    </button>
                  )}
                  <div style={{
                    display: 'flex',
                    gap: '0.4rem',
                    width: '100%'
                  }}>
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setName(item.name);
                        setQuantity(item.quantity.toString());
                        setImageUrl(getPrimaryImage(item) || '');
                        setImageFile(null);
                        setShowPopup(true);
                        setPublicComment(item.publicComment || '');
                        setInternalComment(item.internalComment || '');
                      }}
                      style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: isMobile ? '4px 8px' : '6px 10px',
                        borderRadius: '5px',
                        fontSize: isMobile ? '0.75rem' : '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        flex: '1',
                        minHeight: isMobile ? '28px' : '32px'
                      }}
                    >
                      <FaEdit size={isMobile ? 12 : 14} /> עריכה
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      style={{
                        backgroundColor: '#d32f2f',
                        color: 'white',
                        border: 'none',
                        padding: isMobile ? '4px 8px' : '6px 10px',
                        borderRadius: '5px',
                        fontSize: isMobile ? '0.75rem' : '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        flex: '1',
                        minHeight: isMobile ? '28px' : '32px'
                      }}
                    >
                      <FaTrash size={isMobile ? 12 : 14} /> מחיקה
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ✅ Pagination לפריטים רגילים */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredItems.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
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

            {/* ✅ תצוגת סטטיסטיקות למוצרים שנמחקו */}
            {deletedSearch && (
              <div style={{
                background: '#fef2f2',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                border: '1px solid #fca5a5'
              }}>
                <p style={{ margin: 0, color: '#dc2626' }}>
                  🔍 נמצאו {filteredDeleted.length} מוצרים שנמחקו עבור "{deletedSearch}"
                </p>
              </div>
            )}

            <div className="products-grid-mobile">
              {currentDeletedItems.length === 0 ? (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                  {deletedSearch ? `לא נמצאו מוצרים שנמחקו לחיפוש "${deletedSearch}"` : 'אין פריטים שנמחקו.'}
                </p>
              ) : (
                currentDeletedItems.map(item => (
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
                    <ImageGallery 
                      item={item}
                      width="100%"
                      height="120px"
                      showNavigation={true}
                      style={{ marginBottom: '0.5rem' }}
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

            {/* ✅ Pagination למוצרים שנמחקו */}
            <Pagination
              currentPage={deletedCurrentPage}
              totalItems={filteredDeleted.length}
              itemsPerPage={deletedItemsPerPage}
              onPageChange={setDeletedCurrentPage}
            />
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

      {/* ✅ Active Orders Modal */}
      {showActiveOrdersModal && (
        <ActiveOrdersModal
          item={selectedItemForOrders}
          onClose={() => {
            setShowActiveOrdersModal(false);
            setSelectedItemForOrders(null);
          }}
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
