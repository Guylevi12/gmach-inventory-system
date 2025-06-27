import React, { useState, useEffect } from 'react';
import './css/NewLoan.css';
import NewLoanForm from './NewLoanForm';
import NewLoanModal from './NewLoanModal';
import { db } from '@/firebase/firebase-config';
import { collection, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { phoneAutoCompleteService } from '@/services/phoneAutoCompleteService';
import { closedDatesService } from '@/services/closedDatesService'; // ✅ יבוא השירות החדש

const NewLoan = ({ onOrderCreated }) => {
  const [form, setForm] = useState({
    volunteerName: '', clientName: '', address: '',
    phone: '', email: '', eventType: '',
    pickupDate: '', eventDate: '', returnDate: ''
  });
  const [errors, setErrors] = useState({});
  const [showCatalogPopup, setShowCatalogPopup] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [isLoadingClientData, setIsLoadingClientData] = useState(false);
  
  // ✅ state חדש לימים סגורים
  const [closedDates, setClosedDates] = useState([]);

  // ✅ טעינת ימים סגורים כשהקומפוננט נטען
  useEffect(() => {
    loadClosedDates();
  }, []);

  const loadClosedDates = async () => {
    try {
      const dates = await closedDatesService.getClosedDates();
      setClosedDates(dates);
      console.log('📅 נטענו ימים סגורים למערכת הזמנות:', dates.length);
    } catch (error) {
      console.error('❌ שגיאה בטעינת ימים סגורים:', error);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    
    // עדכון הטופס
    setForm(prevForm => ({ ...prevForm, [name]: value }));
    
    // אם השדה הוא מספר טלפון ואורכו 10 ספרות - נחפש פרטי לקוח
    if (name === 'phone' && value.length === 10 && /^\d{10}$/.test(value)) {
      setIsLoadingClientData(true);
      
      try {
        const result = await phoneAutoCompleteService.findClientByPhone(value);
        
        if (result.found) {
          // מילוי אוטומטי של הפרטים
          setForm(prevForm => ({
            ...prevForm,
            phone: value,
            clientName: result.clientData.clientName,
            address: result.clientData.address,
            email: result.clientData.email
          }));
          
          alert(`נמצא לקוח קיים! הפרטים מולאו אוטומטית:\nשם: ${result.clientData.clientName}\nכתובת: ${result.clientData.address}`);
        }
      } catch (error) {
        console.error('שגיאה בחיפוש פרטי לקוח:', error);
      } finally {
        setIsLoadingClientData(false);
      }
    }
  };

// תיקון פונקציית validateForm ב-NewLoan.jsx ו-RequestLoan.jsx

const validateForm = () => {
  const newErrors = {};
  const today = new Date().toISOString().split('T')[0];
  const { pickupDate, eventDate, returnDate } = form;

  // בדיקות בסיסיות
  if (form.volunteerName !== undefined && !form.volunteerName.trim()) {
    newErrors.volunteerName = 'שדה חובה';
  }
  if (!form.clientName.trim()) newErrors.clientName = 'שדה חובה';
  if (!form.address.trim()) newErrors.address = 'שדה חובה';
  if (!form.phone.trim()) newErrors.phone = 'שדה חובה';
  else if (!/^\d{10}$/.test(form.phone)) newErrors.phone = 'מספר טלפון לא תקין';
  if (!form.eventType.trim()) newErrors.eventType = 'שדה חובה';

  if (!pickupDate) newErrors.pickupDate = 'שדה חובה';
  if (!eventDate) newErrors.eventDate = 'שדה חובה';
  if (!returnDate) newErrors.returnDate = 'שדה חובה';

  // בדיקות תאריכים בסיסיות
  if (pickupDate && pickupDate < today) {
    newErrors.pickupDate = 'תאריך לא יכול להיות בעבר';
  }
  if (eventDate && pickupDate && eventDate < pickupDate) {
    newErrors.eventDate = 'תאריך האירוע לא יכול להיות לפני לקיחה';
  }
  if (returnDate && pickupDate && returnDate <= pickupDate) {
    newErrors.returnDate = 'החזרה אחרי לקיחה';
  }

  // בדיקת ימים סגורים - רק לקיחה והחזרה (לא אירוע!)
  const dateValidation = closedDatesService.validateOrderDates(pickupDate, returnDate, closedDates);
  
  if (!dateValidation.isValid) {
    Object.assign(newErrors, dateValidation.errors);
  }

  // לוג לצורך דיבוג
  console.log('🔍 בדיקת תאריכים:', {
    pickupDate,
    returnDate,
    closedDatesCount: closedDates.length,
    validation: dateValidation,
    errors: newErrors
  });

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const handleClear = () => {
    if (window.confirm('האם אתה בטוח שברצונך לבטל את ההזמנה?')) {
      setForm({
        volunteerName: '', clientName: '', address: '',
        phone: '', email: '', eventType: '',
        pickupDate: '', eventDate: '', returnDate: ''
      });
      setErrors({});
      setAvailableItems([]);
      setSearchTerm('');
      setShowCatalogPopup(false);
    }
  };

  const handleConfirm = async () => {
    if (!validateForm()) return;

    const ordersSnap = await getDocs(collection(db, 'orders'));
    const existingIds = ordersSnap.docs.map(d => d.data().simpleId).filter(id => typeof id === 'number');
    const nextSimpleId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

    const items = availableItems.filter(i => i.selected).map(i => ({
      id: i.id,
      ItemId: i.ItemId,
      name: i.name,
      quantity: i.selectedQty,
      imageUrl: i.imageUrl
    }));

    // ✅ בדיקה נוספת לפני שמירה
    const hasClosedDates = [form.pickupDate, form.eventDate, form.returnDate].some(date => 
      closedDatesService.isDateClosed(date, closedDates)
    );

    if (hasClosedDates) {
      alert('🔒 אחד או יותר מהתאריכים שנבחרו חלים בימים סגורים. אנא בדוק ותקן את התאריכים.');
      return;
    }

    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...form,
        items,
        status: 'open',
        simpleId: nextSimpleId,
        createdAt: serverTimestamp()
      });
      await updateDoc(docRef, { orderId: docRef.id });

      setForm({
        volunteerName: '', clientName: '', address: '',
        phone: '', email: '', eventType: '',
        pickupDate: '', eventDate: '', returnDate: ''
      });
      setAvailableItems([]);
      setSearchTerm('');
      setShowCatalogPopup(false);
      alert(`ההזמנה נשמרה! מס' הזמנה: ${nextSimpleId}`);
      if (onOrderCreated) await onOrderCreated();
    } catch (err) {
      console.error('שגיאה בשמירה:', err);
      alert('שגיאה בשמירת ההזמנה');
    }
    setSaving(false);
  };

  useEffect(() => {
    if (!showCatalogPopup) return;

    const fetchAvailable = async () => {
      setLoadingItems(true);
      const parseDate = (d) => {
        if (!d) return null;
        if (d.toDate) return d.toDate();
        if (typeof d === 'string') return new Date(d);
        return d;
      };

      try {
        const itemsSnap = await getDocs(collection(db, 'items'));
        const itemsData = itemsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => item.isDeleted !== true);

        const ordersSnap = await getDocs(collection(db, 'orders'));
        const pickupStart = parseDate(form.pickupDate);
        const pickupEnd = parseDate(form.returnDate);

        const overlappingOrders = ordersSnap.docs.map(doc => doc.data()).filter(order => {
          const orderStart = parseDate(order.pickupDate);
          const orderEnd = parseDate(order.returnDate);
          return (
            order.status === 'open' &&
            orderStart && orderEnd && pickupStart && pickupEnd &&
            orderEnd >= pickupStart &&
            orderStart <= pickupEnd
          );
        });

        const reserved = {};
        overlappingOrders.forEach(order => {
          order.items?.forEach(item => {
            reserved[item.id] = (reserved[item.id] || 0) + item.quantity;
          });
        });

        const previousSelections = {};
        availableItems.forEach(item => {
          if (item.selected && item.selectedQty > 0) {
            previousSelections[item.id] = {
              selected: item.selected,
              selectedQty: item.selectedQty
            };
          }
        });

        const result = itemsData.map(item => {
          const availableQty = (item.quantity || 0) - (reserved[item.id] || 0);
          const prevSelection = previousSelections[item.id];

          return {
            ...item,
            quantity: availableQty,
            selected: prevSelection ? prevSelection.selected : false,
            selectedQty: prevSelection ? prevSelection.selectedQty : 0
          };
        }).filter(item => item.quantity > 0);

        setAvailableItems(result);
      } catch (err) {
        console.error('שגיאה בחישוב זמינות:', err);
        setAvailableItems([]);
      }
      setLoadingItems(false);
    };

    fetchAvailable();
  }, [showCatalogPopup, form.pickupDate, form.returnDate]);

  const toggleSelectItem = id => {
    setAvailableItems(av => av.map(it =>
      it.id === id ? { ...it, selected: !it.selected, selectedQty: !it.selected ? 1 : 0 } : it
    ));
  };

  const changeQty = (id, qty) => {
    setAvailableItems(av => av.map(it =>
      it.id === id ? { ...it, selected: qty > 0, selectedQty: qty } : it
    ));
  };

  return (
    <div className="new-loan-container">
      <NewLoanForm
        form={form}
        errors={errors}
        handleChange={handleChange}
        handleConfirm={handleConfirm}
        handleClear={handleClear}
        setShowCatalogPopup={setShowCatalogPopup}
        saving={saving}
        isLoadingClientData={isLoadingClientData}
      />
      <NewLoanModal
        showCatalogPopup={showCatalogPopup}
        setShowCatalogPopup={setShowCatalogPopup}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setAvailableItems={setAvailableItems}
        availableItems={availableItems}
        toggleSelectItem={toggleSelectItem}
        changeQty={changeQty}
        form={form}
        loadingItems={loadingItems}
      />
    </div>
  );
};

export default NewLoan;