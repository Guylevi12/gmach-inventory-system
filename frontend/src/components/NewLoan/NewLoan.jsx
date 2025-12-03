import React, { useState, useEffect } from 'react';
import './css/NewLoan.css';
import NewLoanForm from './NewLoanForm';
import NewLoanModal from './NewLoanModal';
import { db } from '@/firebase/firebase-config';
import { collection, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { phoneAutoCompleteService } from '@/services/phoneAutoCompleteService';
import { closedDatesService } from '@/services/closedDatesService';

const NewLoan = ({ onOrderCreated }) => {
  const DRAFT_KEY = 'newLoanDraft';
  const DRAFT_TTL_MS = 60 * 60 * 1000; // 1 hour

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
  const [searchIdTerm, setSearchIdTerm] = useState('');
  const [draftSelectedItems, setDraftSelectedItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [isLoadingClientData, setIsLoadingClientData] = useState(false);
  const [closedDates, setClosedDates] = useState([]);
  const [draftLoaded, setDraftLoaded] = useState(false);


  const persistDraft = (itemsOverride) => {
    if (!draftLoaded) return;
    try {
      const sourceItems = (itemsOverride && itemsOverride.length > 0)
        ? itemsOverride
        : (availableItems.length > 0 ? availableItems : draftSelectedItems);

      const selectedItems = sourceItems
        .map(item => {
          const qty = item.selectedQty ?? 0;
          const isSelected = item.selected || qty > 0;
          return {
            id: item.id,
            ItemId: item.ItemId,
            selectedQty: isSelected ? Math.max(qty, 1) : 0,
            _selected: isSelected
          };
        })
        .filter(item => item._selected)
        .map(({ id, ItemId, selectedQty }) => ({ id, ItemId, selectedQty }));

      const payload = {
        form,
        selectedItems,
        timestamp: Date.now()
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));

      const normalize = (arr) => arr
        .map(it => `${it.id}|${it.ItemId}|${it.selectedQty}`)
        .sort()
        .join(',');
      if (normalize(selectedItems) !== normalize(draftSelectedItems)) {
        setDraftSelectedItems(selectedItems);
      }
    } catch (e) {
      console.warn('Failed to save draft', e);
    }
  };

  // Load draft from localStorage (valid for 1 hour)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed.timestamp || Date.now() - parsed.timestamp > DRAFT_TTL_MS) {
        localStorage.removeItem(DRAFT_KEY);
        return;
      }
      if (parsed.form) {
        setForm(prev => ({ ...prev, ...parsed.form }));
      }
      if (Array.isArray(parsed.selectedItems)) {
        setDraftSelectedItems(parsed.selectedItems);
      }
    } catch (e) {
      console.warn('Failed to load draft', e);
      localStorage.removeItem(DRAFT_KEY);
    } finally {
      setDraftLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadClosedDates();
  }, []);

  // Persist draft (form + selected items) for 1 hour per browser session
  useEffect(() => {
    if (!draftLoaded) return;
    persistDraft();
  }, [form, availableItems, draftLoaded]);

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
    
    setForm(prevForm => ({ ...prevForm, [name]: value }));
    
    if (name === 'phone' && value.length === 10 && /^\d{10}$/.test(value)) {
      setIsLoadingClientData(true);
      
      try {
        const result = await phoneAutoCompleteService.findClientByPhone(value);
        
        if (result.found) {
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

    // ✅ בדיקת ימים סגורים - רק לקיחה והחזרה (לא אירוע!)
    const dateValidation = closedDatesService.validateOrderDates(pickupDate, returnDate, closedDates);
    
    if (!dateValidation.isValid) {
      Object.assign(newErrors, dateValidation.errors);
    }

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
      setSearchIdTerm('');
      setShowCatalogPopup(false);
      setDraftSelectedItems([]);
      localStorage.removeItem(DRAFT_KEY);
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

    // ❌ הסרנו את הבדיקה הכפולה הרעה!
    // const hasClosedDates = [form.pickupDate, form.eventDate, form.returnDate].some(date => 
    //   closedDatesService.isDateClosed(date, closedDates)
    // );
    // if (hasClosedDates) {
    //   alert('🔒 אחד או יותר מהתאריכים שנבחרו חלים בימים סגורים. אנא בדוק ותקן את התאריכים.');
    //   return;
    // }

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
      setSearchIdTerm('');
      setShowCatalogPopup(false);
      setDraftSelectedItems([]);
      localStorage.removeItem(DRAFT_KEY);
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
        // selections currently in state
        availableItems.forEach(item => {
          if (item.selected && item.selectedQty > 0) {
            previousSelections[item.id] = {
              selected: item.selected,
              selectedQty: item.selectedQty
            };
          }
        });
        // selections restored from draft
        draftSelectedItems.forEach(item => {
          if (item.selectedQty > 0) {
            previousSelections[item.id] = {
              selected: true,
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
  }, [showCatalogPopup, form.pickupDate, form.returnDate, draftSelectedItems]);

  const toggleSelectItem = id => {
    setAvailableItems(av => {
      const next = av.map(it =>
        it.id === id ? { ...it, selected: !it.selected, selectedQty: !it.selected ? 1 : 0 } : it
      );
      persistDraft(next);
      return next;
    });
  };

  const changeQty = (id, qty) => {
    setAvailableItems(av => {
      const next = av.map(it =>
        it.id === id ? { ...it, selected: qty > 0, selectedQty: qty } : it
      );
      persistDraft(next);
      return next;
    });
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
        searchIdTerm={searchIdTerm}
        setSearchIdTerm={setSearchIdTerm}
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
