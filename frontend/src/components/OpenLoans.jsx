import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Calendar, AlertCircle } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase-config.jsx';
import { updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore'; 



const HebrewCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemsMap, setItemsMap] = useState({});
  const [allItems, setAllItems] = useState([]); 

const updateStockIfNeeded = async (itemsList) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const orderSnap = await getDocs(collection(db, 'orders'));
  for (const docSnap of orderSnap.docs) {
    const order = docSnap.data();
    const orderId = docSnap.id;

    if (!order.pickupDate || order.stockUpdated) continue;

    const pickup = new Date(order.pickupDate);
    pickup.setHours(0, 0, 0, 0);

    if (pickup > today) continue;

    for (const item of order.items) {
      const itemDoc = itemsList.find(i => i.name === item.name);
      if (!itemDoc) continue;

      const itemRef = doc(db, 'items', itemDoc.id);
      const itemSnap = await getDoc(itemRef);
      const itemData = itemSnap.data();

      const remainingQty = (itemData.quantity || 0) - (item.quantity || 0);
      const updatedQty = Math.max(remainingQty, 0);

      await updateDoc(itemRef, {
        quantity: updatedQty,
        isActive: updatedQty > 0,
      });
    }

    await updateDoc(doc(db, 'orders', orderId), {
      stockUpdated: true
    });
  }
};


  async function migrateEventDateToPickupDate() {
  const ordersRef = collection(db, 'orders');
  const ordersSnap = await getDocs(ordersRef);

  for (const document of ordersSnap.docs) {
    const data = document.data();

    if (!data.pickupDate && data.eventDate) {
      const orderRef = doc(db, 'orders', document.id);
      await updateDoc(orderRef, {
        pickupDate: data.eventDate
      });

      console.log(`✔️ Updated pickupDate for order ${document.id}`);
    }
  }
}

 const fetchItemsAndOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. טען את כל הפריטים
      const itemSnap = await getDocs(collection(db, 'items'));
      const itemsData = itemSnap.docs.map(doc => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    imageUrl: data.imageUrl, 
  };
});
setAllItems(itemsData);

      const itemsMapObj = {};
      itemsData.forEach(item => {
      itemsMapObj[item.name] = item.imageUrl || item.image || item.תמונה || null;
      });
      setItemsMap(itemsMapObj);
            await updateStockIfNeeded(itemsData);


      // 2. טען את כל ההזמנות כמו קודם
      const orderSnap = await getDocs(collection(db, 'orders'));
      const orderData = orderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 3. בנה את האירועים
      const calendarEvents = orderData.flatMap(order => {
        const events = [];

        const decorateItems = (items = []) => items.map(item => ({
          ...item,
          imageUrl: itemsMapObj[item.name] || null
        }));

        if (order.pickupDate) {
          events.push({
            id: `${order.id}-pickup`,
            date: new Date(order.pickupDate),
            clientName: order.clientName,
            phone: order.phone,
            type: 'השאלה',
            items: decorateItems(order.items),
            pickupDate: order.pickupDate,
            returnDate: order.returnDate
          });
        }

        if (order.returnDate) {
          events.push({
            id: `${order.id}-return`,
            date: new Date(order.returnDate),
            clientName: order.clientName,
            phone: order.phone,
            type: 'החזרה',
            items: decorateItems(order.items),
            pickupDate: order.pickupDate,
            returnDate: order.returnDate
          });
        }

        return events;
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('שגיאה בטעינת הנתונים:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  const init = async () => {
    await migrateEventDateToPickupDate(); // תוסיף את זה קודם
    await fetchItemsAndOrders();          // ואז טען נתונים
  };

  init();
}, []);



useEffect(() => {
  fetchItemsAndOrders();
}, []);

  const [editItemModal, setEditItemModal] = useState({
  open: false,
  eventId: null,
  items: [],
});



  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  const dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      if (!event.date || isNaN(event.date.getTime())) return false;
      
      return event.date.getDate() === date &&
             event.date.getMonth() === currentDate.getMonth() &&
             event.date.getFullYear() === currentDate.getFullYear();
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const dayEvents = getEventsForDate(day);
    if (dayEvents.length > 0) {
      setSelectedEvents(dayEvents);
      setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
      setShowReport(true);
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // ימים ריקים בתחילת החודש
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div 
          key={`empty-${i}`} 
          style={{
            height: '48px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}
        ></div>
      );
    }

    // הימים בחודש
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDate(day);
      const hasEvents = dayEvents.length > 0;
      
      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          style={{
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            cursor: 'pointer',
            border: '1px solid #e5e7eb',
            position: 'relative',
            transition: 'all 0.2s',
            backgroundColor: hasEvents ? '#dbeafe' : '#ffffff',
            color: hasEvents ? '#1e40af' : '#374151',
            fontWeight: hasEvents ? 'bold' : 'normal'
          }}
          onMouseEnter={(e) => {
            if (hasEvents) {
              e.target.style.backgroundColor = '#bfdbfe';
            } else {
              e.target.style.backgroundColor = '#f3f4f6';
            }
          }}
          onMouseLeave={(e) => {
            if (hasEvents) {
              e.target.style.backgroundColor = '#dbeafe';
            } else {
              e.target.style.backgroundColor = '#ffffff';
            }
          }}
        >
          <span>{day}</span>
          {hasEvents && (
            <div 
              style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                backgroundColor: '#3b82f6',
                borderRadius: '50%'
              }}
            ></div>
          )}
        </div>
      );
    }

    return days;
  };

  // מצב טעינה
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 flex justify-center items-center h-64" dir="rtl">
        <div className="text-lg text-gray-600">טוען יומן...</div>
      </div>
    );
  }

  // מצב שגיאה
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4" dir="rtl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <div>
            <h3 className="font-bold text-red-800">שגיאה בטעינת הנתונים</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }
const handleEditClick = (event) => {
  setEditItemModal({
    open: true,
    eventId: event.id,
    items: event.items.map(item => ({ ...item })),
  });
};
const handleDeleteOrder = async (orderId) => {
  if (!window.confirm("האם אתה בטוח שברצונך למחוק את ההזמנה?")) return;

  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    const orderData = orderSnap.data();

    // החזרת מלאי
    for (const item of orderData.items || []) {
      const itemDoc = allItems.find(i => i.name === item.name);
      if (!itemDoc) continue;

      const itemRef = doc(db, 'items', itemDoc.id);
      const itemSnap = await getDoc(itemRef);
      const itemData = itemSnap.data();

      const updatedQty = (itemData.quantity || 0) + (item.quantity || 0);

      await updateDoc(itemRef, {
        quantity: updatedQty,
        isActive: true,
      });
    }

    // מחיקת ההזמנה
    await deleteDoc(orderRef);

    // ריענון
    await fetchItemsAndOrders();
    setShowReport(false);
    alert("ההזמנה נמחקה והמלאי עודכן בהצלחה.");
  } catch (error) {
    console.error("שגיאה במחיקה או עדכון מלאי:", error);
    alert("מחיקה נכשלה. נסה שוב.");
  }
};


const updateItemQuantity = (index, newQuantity) => {
  setEditItemModal((prev) => {
    const updated = [...prev.items];
    updated[index].quantity = newQuantity;
    return { ...prev, items: updated };
  });
};

  return (
    <div className="max-w-4xl mx-auto p-4" dir="rtl">
      {/* כותרת היומן */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-4 border">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
            type="button"
          >
            <ChevronRight size={20} />
          </button>
          
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar size={24} />
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
            type="button"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* ימי השבוע */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          marginBottom: '8px'
        }}>
          {dayNames.map(day => (
            <div 
              key={day} 
              style={{
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: '#4b5563',
                fontSize: '14px',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* הימים בחודש */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          backgroundColor: '#f9fafb',
          padding: '8px',
          borderRadius: '8px'
        }}>
          {renderCalendarDays()}
        </div>

        <div className="mt-4 text-sm text-gray-600 text-center bg-gray-50 p-2 rounded">
          לחץ על יום עם אירועים כדי לראות פרטים • סה"כ אירועים: {events.length}
          {events.length === 0 && (
            <div className="text-orange-600 mt-1">
              אין אירועים נטענים - בדוק את החיבור למסד הנתונים
            </div>
          )}
        </div>
      </div>

      {/* מודל דוח */}
      {showReport && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1rem'
    }}
  >
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflowY: 'auto',
        direction: 'rtl',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>
          דוח ליום {selectedDate?.toLocaleDateString('he-IL')}
        </h3>
        <button
          onClick={() => setShowReport(false)}
          style={{
            fontSize: '1.5rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280'
          }}
        >
          ×
        </button>
      </div>

      {selectedEvents.map((event) => (
        <div
          key={event.id}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1rem',
            background: '#f9fafb',
            marginBottom: '1rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div>
              <p style={{ fontWeight: 'bold' }}>{event.clientName}</p>
              <p style={{ color: '#4b5563' }}>טלפון: {event.phone}</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {new Date(event.pickupDate).toLocaleDateString('he-IL')} - {new Date(event.returnDate).toLocaleDateString('he-IL')}
              </p>
            </div>
            <span style={{
              background: event.type === 'השאלה' ? '#d1fae5' : '#ffe4e6',
              color: event.type === 'השאלה' ? '#065f46' : '#9f1239',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontWeight: 'bold',
              fontSize: '0.875rem',
              alignSelf: 'center'
            }}>
              {event.type}
            </span>
           
          </div>
<div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
  <button
    onClick={() => handleEditClick(event)}
    style={{
      fontSize: '0.8rem',
      padding: '6px 12px',
      borderRadius: '6px',
      border: '1px solid #3b82f6',
      backgroundColor: 'white',
      color: '#3b82f6',
      cursor: 'pointer'
    }}
  >
    ערוך מוצרים
  </button>
</div>

          {event.items.length > 0 && (
            <ul style={{ paddingInlineStart: '20px', color: '#374151' }}>
            {event.items.map((item, idx) => (
  <li key={idx} style={{ marginBottom: '10px' }}>
    {item.name} × {item.quantity}
    {item.imageUrl && (
      <div style={{ marginTop: '6px' }}>
        <img
          src={item.imageUrl}
          alt={item.name}
          style={{ maxWidth: '80px', maxHeight: '80px', borderRadius: '4px', marginTop: '4px' }}
        />
      </div>
    )}
  </li>
))}


            </ul>
          )}
        </div>
      ))}

      <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '1rem'
}}>
  <button
    onClick={async () => {
      const orderId = selectedEvents[0]?.id.split('-')[0];
      if (orderId) {
        await handleDeleteOrder(orderId);
      }
    }}
    style={{
      padding: '8px 16px',
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }}
  >
    מחק הזמנה
  </button>

  <button
    onClick={() => setShowReport(false)}
    style={{
      padding: '8px 16px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }}
  >
    סגור
  </button>
</div>

    </div>
  </div>
)}
{editItemModal.open && (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem'
  }}>
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '1.5rem',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '80vh',
      overflowY: 'auto',
      direction: 'rtl'
    }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>עריכת פריטים</h3>

      {allItems.map((item, idx) => {
        const existing = editItemModal.items.find(i => i.name === item.name);
        const quantity = existing?.quantity || 0;

        return (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '1rem',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '0.5rem'
          }}>
            <img src={item.imageUrl} alt={item.name}
              style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', marginLeft: '1rem' }}
            />
            <div style={{ flex: 1 }}>
              <label>
                <input
                  type="checkbox"
                  checked={!!existing}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEditItemModal(prev => ({
                        ...prev,
                        items: [...prev.items, { name: item.name, quantity: 1 }]
                      }));
                    } else {
                      setEditItemModal(prev => ({
                        ...prev,
                        items: prev.items.filter(i => i.name !== item.name)
                      }));
                    }
                  }}
                /> {item.name}
              </label>
              {existing && (
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => {
                    const newQty = parseInt(e.target.value);
                    setEditItemModal(prev => ({
                      ...prev,
                      items: prev.items.map(i =>
                        i.name === item.name ? { ...i, quantity: newQty } : i
                      )
                    }));
                  }}
                  style={{
                    marginTop: '4px',
                    padding: '4px',
                    width: '60px'
                  }}
                />
              )}
            </div>
          </div>
        );
      })}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
        <button
          onClick={() => setEditItemModal({ open: false, eventId: null, items: [] })}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ביטול
        </button>

        <button type="button"
     onClick={async (e) => {
  e.preventDefault();

  try {
    const orderId = editItemModal.eventId?.split('-')[0];
    if (!orderId) return;

    // בדיקה: האם יש פריט עם כמות מבוקשת גבוהה מהמלאי
    for (const item of editItemModal.items) {
      const itemDocRef = doc(db, 'items', allItems.find(i => i.name === item.name)?.id);
      const itemSnap = await getDoc(itemDocRef);
      const itemData = itemSnap.data();

      if (item.quantity > itemData.quantity) {
        alert(`אין מספיק מלאי עבור "${item.name}". יש רק ${itemData.quantity} במלאי.`);
        return; // עצור את השמירה
      }
    }

    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      items: editItemModal.items,
    });

    await fetchItemsAndOrders();
    setEditItemModal({ open: false, eventId: null, items: [] });
    setShowReport(false);
  } catch (error) {
    console.error("שגיאה בשמירה:", error);
    alert("שמירה נכשלה. נסה שוב.");
  }
}}

        >
          שמור שינויים
        </button>
      </div>
    </div>
  </div>
)}



    </div>
  );
};

export default HebrewCalendar;