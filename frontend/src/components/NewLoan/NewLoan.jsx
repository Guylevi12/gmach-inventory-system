import React, { useState, useEffect } from 'react';
import './css/NewLoan.css';
import NewLoanForm from './NewLoanForm';
import NewLoanModal from './NewLoanModal';
import { db } from '@/firebase/firebase-config';
import { collection, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors = {};
    const today = new Date().toISOString().split('T')[0];
    const { pickupDate, eventDate, returnDate } = form;

    if (!form.volunteerName.trim()) newErrors.volunteerName = 'שדה חובה';
    if (!form.clientName.trim()) newErrors.clientName = 'שדה חובה';
    if (!form.address.trim()) newErrors.address = 'שדה חובה';
    if (!form.phone.trim()) newErrors.phone = 'שדה חובה';
    else if (!/^\d{10}$/.test(form.phone)) newErrors.phone = 'מספר טלפון לא תקין';
    if (!form.eventType.trim()) newErrors.eventType = 'שדה חובה';

    if (!pickupDate) newErrors.pickupDate = 'שדה חובה';
    if (!eventDate) newErrors.eventDate = 'שדה חובה';
    if (!returnDate) newErrors.returnDate = 'שדה חובה';

    if (pickupDate && pickupDate < today) newErrors.pickupDate = 'תאריך לא יכול להיות בעבר';
    if (eventDate && pickupDate && eventDate < pickupDate) newErrors.eventDate = 'תאריך האירוע לא יכול להיות לפני לקיחה';
    if (returnDate && pickupDate && returnDate <= pickupDate) newErrors.returnDate = 'החזרה אחרי לקיחה';

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
      name: i.name,
      quantity: i.selectedQty
    }));

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
          .filter(item => item.isDeleted !== true)
          .map(item => ({ ...item, selected: false, selectedQty: 0 }));

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

        const result = itemsData.map(item => {
          const availableQty = (item.quantity || 0) - (reserved[item.id] || 0);
          return { ...item, quantity: availableQty };
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
      />
      <NewLoanModal
        showCatalogPopup={showCatalogPopup}
        setShowCatalogPopup={setShowCatalogPopup}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
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
