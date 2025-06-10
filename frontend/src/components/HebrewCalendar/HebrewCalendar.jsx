import React, { useState, useEffect } from 'react';
import CalendarGrid from './CalendarGrid';
import EventModal from './EventModal';
import ItemsModal from './ItemsModal';
import EditItemModal from './EditItemModal';

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
      />
    </div>
  );
};

export default HebrewCalendar;
