// src/components/HebrewCalendar/HebrewCalendar.jsx
import React, { useState, useEffect } from 'react';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config'; // Updated Firebase path
import CalendarGrid from './CalendarGrid';
import EventModal from './EventModal';
import ItemsModal from './ItemsModal';
import EditItemModal from './EditItemModal';
import ReturnInspectionModal from '../ReturnInspectionModal';

const HebrewCalendar = ({
  allItems,
  itemsMap,
  events,
  setAllItems,
  setItemsMap,
  setEvents,
  fetchItemsAndOrders
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [editItemModal, setEditItemModal] = useState({ open: false, eventId: null, items: [] });
  const [returnInspection, setReturnInspection] = useState({ show: false, order: null });

  // Function to initialize return inspection for an order
  const initializeReturnInspection = async (orderId) => {
    try {
      // Find the order in current events to open inspection modal directly
      const orderEvents = events.filter(event => event.orderId === orderId);
      if (orderEvents.length > 0) {
        const orderData = {
          id: orderId,
          clientName: orderEvents[0].clientName,
          phone: orderEvents[0].phone,
          items: orderEvents[0].items,
          pickupDate: orderEvents[0].pickupDate,
          returnDate: orderEvents[0].returnDate
        };
        
        setReturnInspection({ show: true, order: orderData });
        setShowReport(false); // Close the event modal
      }
    } catch (error) {
      console.error('Error initializing return inspection:', error);
      alert('שגיאה בהתחלת בדיקת החזרה. נסה שוב.');
    }
  };

  // Function to manually close an order (for testing and early closure)
  const manuallyCloseOrder = async (orderId) => {
    try {
      // Create a simple "manual closure" inspection
      const orderUpdate = {
        status: "closed",
        'returnInspection.inspectionStatus': "completed",
        'returnInspection.inspectedBy': "סגירה ידנית",
        'returnInspection.inspectionDate': serverTimestamp(),
        'returnInspection.managerNotes': "הזמנה נסגרה ידנית על ידי המנהל",
        'returnInspection.totalItemsReturned': 0, // Assuming all items returned
        'returnInspection.totalDamages': 0,
        'returnInspection.totalRepairCost': 0,
        closedAt: serverTimestamp(),
        manuallyClosedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'orders', orderId), orderUpdate);
      
      // Refresh data
      await fetchItemsAndOrders();
      
      // Close any open modals
      setShowReport(false);
      
      // Show success message
      alert('ההזמנה נסגרה ידנית והועברה להיסטוריה!');
      
    } catch (error) {
      console.error('Error manually closing order:', error);
      alert('שגיאה בסגירת ההזמנה. נסה שוב.');
    }
  };

  // Function to complete return inspection
  const completeReturnInspection = async (orderId, itemInspections, summary) => {
    try {
      // Update order status to closed with inspection details
      const orderUpdate = {
        status: "closed",
        returnInspection: {
          inspectionStatus: "completed",
          inspectedBy: "מנהל המערכת",
          inspectionDate: serverTimestamp(),
          itemInspections: itemInspections.map(item => ({
            itemId: item.itemId,
            name: item.name,
            quantityExpected: item.quantityExpected,
            quantityReturned: item.quantityReturned,
            condition: item.condition,
            damageDescription: item.damageDescription || '',
            repairCost: item.repairCost || 0,
            notes: item.notes || '',
            inspectedAt: new Date().toISOString() // Use regular timestamp instead of serverTimestamp
          })),
          totalItemsReturned: summary.totalItemsReturned,
          totalItemsExpected: summary.totalItemsExpected,
          totalDamages: summary.totalDamages,
          totalRepairCost: summary.totalRepairCost,
          managerNotes: summary.managerNotes,
          customerNotified: summary.customerNotified,
          customerAgreedToCharges: summary.customerAgreedToCharges
        },
        closedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'orders', orderId), orderUpdate);
      
      // Refresh data
      await fetchItemsAndOrders();
      
      // Close inspection modal
      setReturnInspection({ show: false, order: null });
      
      // Show success message
      alert('בדיקת החזרה הושלמה בהצלחה! ההזמנה הועברה להיסטוריה.');
      
    } catch (error) {
      console.error('Error completing return inspection:', error);
      alert('שגיאה בהשלמת בדיקת החזרה. נסה שוב.');
    }
  };

  return (
    <div className="mt-6">
      <CalendarGrid
        currentDate={currentDate}
        events={events}
        setCurrentDate={setCurrentDate}
        setSelectedEvents={setSelectedEvents}
        setSelectedDate={setSelectedDate}
        setShowReport={setShowReport}
      />
      
      <EventModal
        show={showReport}
        selectedDate={selectedDate}
        selectedEvents={selectedEvents}
        allItems={allItems}
        setShowReport={setShowReport}
        setShowItemsModal={setShowItemsModal}
        setEditItemModal={setEditItemModal}
        fetchItemsAndOrders={fetchItemsAndOrders}
        onStartReturnInspection={initializeReturnInspection}
        onCloseOrderManually={manuallyCloseOrder}
      />
      
      <ItemsModal
        show={showItemsModal}
        setShow={setShowItemsModal}
        selectedEvents={selectedEvents}
        allItems={allItems}
      />
      
      <EditItemModal
        show={editItemModal.open}
        data={editItemModal}
        setData={setEditItemModal}
        allItems={allItems}
        setShowReport={setShowReport}
        fetchItemsAndOrders={fetchItemsAndOrders}
        allEvents={events}
      />

      {/* Return Inspection Modal */}
      <ReturnInspectionModal
        show={returnInspection.show}
        order={returnInspection.order}
        onClose={() => setReturnInspection({ show: false, order: null })}
        onCompleteInspection={completeReturnInspection}
        allItems={allItems}
        updateItemQuantities={fetchItemsAndOrders}
      />
    </div>
  );
}; 

export default HebrewCalendar;