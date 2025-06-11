// src/components/InspectionHistoryView.jsx
import React, { useState, useEffect } from 'react';
import { Search, Calendar, User, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config'; 

const InspectionHistoryView = () => {
  const [inspections, setInspections] = useState([]);
  const [filteredInspections, setFilteredInspections] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInspectionHistory();
  }, []);

  useEffect(() => {
    filterInspections();
  }, [inspections, searchTerm, statusFilter]);

  const fetchInspectionHistory = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'orders'),
        where('status', 'in', ['under_inspection', 'closed']),
        orderBy('returnInspection.inspectionDate', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const inspectionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(order => order.returnInspection);
      
      setInspections(inspectionData);
    } catch (error) {
      console.error('Error fetching inspection history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInspections = () => {
    let filtered = inspections;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(inspection =>
        inspection.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.phone.includes(searchTerm)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inspection => inspection.status === statusFilter);
    }

    setFilteredInspections(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'under_inspection': return '#f59e0b';
      case 'closed': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'under_inspection': return 'בבדיקה';
      case 'closed': return 'הושלמה';
      default: return 'לא ידוע';
    }
  };

  const getDamageIcon = (condition) => {
    switch (condition) {
      case 'good': return <CheckCircle size={16} style={{ color: '#10b981' }} />;
      case 'damaged': return <AlertTriangle size={16} style={{ color: '#f59e0b' }} />;
      case 'missing': return <XCircle size={16} style={{ color: '#ef4444' }} />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>טוען היסטוריית בדיקות...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }} dir="rtl">
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1f2937' }}>
        היסטוריית בדיקות החזרה
      </h1>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '8px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
          <Search size={20} style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6b7280'
          }} />
          <input
            type="text"
            placeholder="חיפוש לפי שם לקוח או טלפון..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 3rem 0.75rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.875rem',
            minWidth: '150px'
          }}
        >
          <option value="all">כל הסטטוסים</option>
          <option value="under_inspection">בבדיקה</option>
          <option value="closed">הושלמה</option>
        </select>
      </div>

      {/* Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: '#eff6ff',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #dbeafe'
        }}>
          <h3 style={{ fontSize: '0.875rem', color: '#1e40af', margin: '0 0 0.5rem 0' }}>סה"כ בדיקות</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>
            {filteredInspections.length}
          </p>
        </div>
        
        <div style={{
          background: '#fef3c7',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #fde68a'
        }}>
          <h3 style={{ fontSize: '0.875rem', color: '#92400e', margin: '0 0 0.5rem 0' }}>בבדיקה</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#92400e', margin: 0 }}>
            {filteredInspections.filter(i => i.status === 'under_inspection').length}
          </p>
        </div>
        
        <div style={{
          background: '#ecfdf5',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #a7f3d0'
        }}>
          <h3 style={{ fontSize: '0.875rem', color: '#065f46', margin: '0 0 0.5rem 0' }}>הושלמו</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#065f46', margin: 0 }}>
            {filteredInspections.filter(i => i.status === 'closed').length}
          </p>
        </div>
        
        <div style={{
          background: '#fef2f2',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #fecaca'
        }}>
          <h3 style={{ fontSize: '0.875rem', color: '#991b1b', margin: '0 0 0.5rem 0' }}>עם נזקים</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#991b1b', margin: 0 }}>
            {filteredInspections.filter(i => i.returnInspection?.totalDamages > 0).length}
          </p>
        </div>
      </div>

      {/* Inspections List */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {filteredInspections.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', color: '#d1d5db' }} />
            <p>לא נמצאו בדיקות התואמות לחיפוש</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>
                    לקוח
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>
                    תאריך בדיקה
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>
                    סטטוס
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>
                    פריטים
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>
                    נזקים
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>
                    עלות תיקון
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInspections.map((inspection, index) => (
                  <tr key={inspection.id} style={{
                    borderBottom: '1px solid #f3f4f6',
                    background: index % 2 === 0 ? 'white' : '#fafafa'
                  }}>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>
                          {inspection.clientName}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {inspection.phone}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                      {inspection.returnInspection.inspectionDate 
                        ? new Date(inspection.returnInspection.inspectionDate.seconds * 1000).toLocaleDateString('he-IL')
                        : 'לא זמין'
                      }
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        background: `${getStatusColor(inspection.status)}20`,
                        color: getStatusColor(inspection.status)
                      }}>
                        {getStatusText(inspection.status)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {inspection.returnInspection.totalItemsReturned || 0}/
                      {inspection.returnInspection.totalItemsExpected || 0}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {inspection.returnInspection.totalDamages > 0 ? (
                        <span style={{ 
                          color: '#f59e0b', 
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          {inspection.returnInspection.totalDamages}
                        </span>
                      ) : (
                        <span style={{ color: '#10b981', fontSize: '0.875rem' }}>
                          ✓ תקין
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      ₪{inspection.returnInspection.totalRepairCost || 0}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button
                        onClick={() => setSelectedInspection(inspection)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        הצג פרטים
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Inspection Modal */}
      {selectedInspection && (
        <InspectionDetailModal
          inspection={selectedInspection}
          onClose={() => setSelectedInspection(null)}
        />
      )}
    </div>
  );
};

// Modal component for showing detailed inspection
const InspectionDetailModal = ({ inspection, onClose }) => {
  if (!inspection) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 9999
    }} onClick={handleBackdropClick}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '42rem',
        maxHeight: '90vh',
        overflow: 'hidden'
      }} dir="rtl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          background: '#1f2937',
          color: 'white',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              פרטי בדיקת החזרה
            </h2>
            <p style={{ fontSize: '0.875rem', opacity: 0.8, margin: '0.5rem 0 0 0' }}>
              {inspection.clientName} • {inspection.phone}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: 'calc(90vh - 120px)' }}>
          {/* Summary */}
          <div style={{
            background: '#f9fafb',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              סיכום בדיקה
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
              <div><strong>תאריך בדיקה:</strong> {
                inspection.returnInspection.inspectionDate 
                  ? new Date(inspection.returnInspection.inspectionDate.seconds * 1000).toLocaleDateString('he-IL')
                  : 'לא זמין'
              }</div>
              <div><strong>בודק:</strong> {inspection.returnInspection.inspectedBy || 'לא ידוע'}</div>
              <div><strong>פריטים שהוחזרו:</strong> {inspection.returnInspection.totalItemsReturned}/{inspection.returnInspection.totalItemsExpected}</div>
              <div><strong>נזקים:</strong> {inspection.returnInspection.totalDamages || 0}</div>
              <div><strong>עלות תיקון:</strong> ₪{inspection.returnInspection.totalRepairCost || 0}</div>
              <div><strong>סטטוס:</strong> {getStatusText(inspection.status)}</div>
            </div>
            
            {inspection.returnInspection.managerNotes && (
              <div style={{ marginTop: '1rem' }}>
                <strong>הערות מנהל:</strong>
                <p style={{ 
                  margin: '0.5rem 0 0 0', 
                  padding: '0.75rem', 
                  background: 'white', 
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}>
                  {inspection.returnInspection.managerNotes}
                </p>
              </div>
            )}
          </div>

          {/* Items Details */}
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              פירוט פריטים
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {inspection.returnInspection.itemInspections?.map((item, index) => (
                <div key={index} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1rem',
                  background: 'white'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '500', margin: 0 }}>
                        {item.name}
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                        כמות: {item.quantityReturned}/{item.quantityExpected}
                      </p>
                    </div>
                  </div>

                  {/* Inspections for this item */}
                  {item.inspections?.map((insp, inspIndex) => (
                    <div key={inspIndex} style={{
                      background: '#f9fafb',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      marginTop: '0.5rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        {getDamageIcon(insp.condition)}
                        <span style={{
                          fontWeight: '500',
                          color: insp.condition === 'good' ? '#10b981' : 
                                insp.condition === 'damaged' ? '#f59e0b' : '#ef4444'
                        }}>
                          {insp.condition === 'good' ? 'תקין' : 
                           insp.condition === 'damaged' ? 'פגום' : 'חסר'}
                        </span>
                        {insp.damageType && (
                          <span style={{
                            fontSize: '0.75rem',
                            background: '#fef3c7',
                            color: '#92400e',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '12px'
                          }}>
                            {insp.damageType}
                          </span>
                        )}
                      </div>
                      
                      {insp.damageDescription && (
                        <p style={{ 
                          fontSize: '0.875rem', 
                          color: '#374151', 
                          margin: '0.5rem 0',
                          lineHeight: '1.4'
                        }}>
                          {insp.damageDescription}
                        </p>
                      )}
                      
                      <div style={{ 
                        display: 'flex', 
                        gap: '1rem', 
                        fontSize: '0.75rem', 
                        color: '#6b7280' 
                      }}>
                        {insp.severity && <span>חומרה: {insp.severity}</span>}
                        {insp.repairCost > 0 && <span>עלות תיקון: ₪{insp.repairCost}</span>}
                      </div>
                      
                      {insp.notes && (
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          fontStyle: 'italic',
                          marginTop: '0.5rem',
                          margin: 0
                        }}>
                          הערות: {insp.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )) || (
                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
                  אין פרטי בדיקה זמינים
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionHistoryView;