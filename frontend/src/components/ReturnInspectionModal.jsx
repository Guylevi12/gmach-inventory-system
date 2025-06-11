// src/components/ReturnInspectionModal.jsx
import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const ReturnInspectionModal = ({ 
  show, 
  order, 
  onClose, 
  onCompleteInspection 
}) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [itemInspections, setItemInspections] = useState([]);
  const [inspectionSummary, setInspectionSummary] = useState({
    managerNotes: '',
    managerSummary: '',
    customerNotified: false,
    customerAgreedToCharges: false
  });

  useEffect(() => {
    if (show && order) {
      const initialInspections = order.items.map(item => ({
        itemId: item.id,
        name: item.name,
        quantityExpected: item.quantity,
        quantityReturned: item.quantity,
        condition: 'good',
        damageType: '',
        damageDescription: '',
        severity: 'minor',
        repairCost: 0,
        photos: [],
        notes: ''
      }));
      setItemInspections(initialInspections);
    }
  }, [show, order]);

  if (!show || !order) return null;

  const currentItem = itemInspections[currentItemIndex];
  const isLastItem = currentItemIndex === itemInspections.length - 1;
  const totalDamages = itemInspections.filter(item => item.condition !== 'good').length;
  const totalRepairCost = itemInspections.reduce((sum, item) => sum + (item.repairCost || 0), 0);

  const updateCurrentItem = (updates) => {
    setItemInspections(prev => prev.map((item, index) => 
      index === currentItemIndex ? { ...item, ...updates } : item
    ));
  };

  const handleNext = () => {
    if (currentItemIndex < itemInspections.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1);
    }
  };

  const handleCompleteInspection = () => {
    const summary = {
      totalItemsExpected: itemInspections.reduce((sum, item) => sum + item.quantityExpected, 0),
      totalItemsReturned: itemInspections.reduce((sum, item) => sum + item.quantityReturned, 0),
      totalDamages,
      totalRepairCost,
      ...inspectionSummary
    };

    onCompleteInspection(order.id, itemInspections, summary);
  };

  return (
    <div>
      {/* ... rest of modal code unchanged ... */}

      {/* Summary Section (at the end of the modal) */}
      {isLastItem && (
        <div style={{ margin: '1rem 1.5rem' }}>
          {/* Existing managerNotes input */}
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>סיכום סגירה</label>
          <textarea
            placeholder="כאן ניתן לכתוב סיכום על מה שקרה בהשאלה, אם היה פריט שבור, אובדן וכו'..."
            value={inspectionSummary.managerSummary}
            onChange={e => setInspectionSummary(prev => ({ ...prev, managerSummary: e.target.value }))}
            style={{
              width: '100%',
              minHeight: '60px',
              borderRadius: '6px',
              padding: '0.5rem',
              border: '1px solid #ccc'
            }}
          />
        </div>
      )}

      {/* Submit Button */}
      {isLastItem && (
        <div style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>
          <button
            onClick={handleCompleteInspection}
            style={{
              background: '#10b981',
              color: 'white',
              padding: '0.5rem 1.5rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            סיים בדיקה והעבר להיסטוריה
          </button>
        </div>
      )}
    </div>
  );
};

export default ReturnInspectionModal;
