import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ArrowRight, Download, Search, Calendar, Package, CheckCircle, XCircle, AlertTriangle, User, Phone, MapPin, Clock } from 'lucide-react';

const LoanHistory = () => {
  const [allLoans, setAllLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClosedLoans = async () => {
      try {
        setLoading(true);
        
        // קודם נביא את כל ההזמנות לדיבוג
        console.log('🔍 מחפש את כל ההזמנות...');
        const allOrdersQuery = query(collection(db, 'orders'));
        const allSnapshot = await getDocs(allOrdersQuery);
        const allOrdersData = allSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        console.log('📋 כל ההזמנות:', allOrdersData);
        console.log('📊 סטטוסים:', allOrdersData.map(order => ({ 
          id: order.id, 
          client: order.clientName, 
          status: order.status 
        })));
        
        // עכשיו נחפש הזמנות סגורות
        console.log('🔍 מחפש הזמנות סגורות...');
        const q = query(
          collection(db, 'orders'), 
          where('status', '==', 'closed')
        );
        const snapshot = await getDocs(q);
        const loans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log('✅ הזמנות סגורות:', loans);
        setAllLoans(loans);
        
        // גם נחפש הזמנות עם סטטוס 'returned' למקרה שהן לא מתעדכנות ל-'closed'
        console.log('🔍 מחפש הזמנות שהוחזרו...');
        const returnedQuery = query(
          collection(db, 'orders'), 
          where('status', '==', 'returned')
        );
        const returnedSnapshot = await getDocs(returnedQuery);
        const returnedLoans = returnedSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        console.log('🔄 הזמנות שהוחזרו:', returnedLoans);
        
      } catch (error) {
        console.error('❌ שגיאה בטעינת ההזמנות:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClosedLoans();
  }, []);

  const formatDate = (d) => {
    if (!d) return '';
    const date = d.seconds ? new Date(d.seconds * 1000) : new Date(d);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (d) => {
    if (!d) return '';
    const date = d.seconds ? new Date(d.seconds * 1000) : new Date(d);
    return date.toLocaleString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // חישוב סיכום בדיקת החזרה בזמן אמת
  const calculateReturnSummary = (loan) => {
    if (!loan.returnInspection?.itemInspections) {
      return {
        totalItemsExpected: 0,
        totalItemsReturned: 0,
        totalItemsNotReturned: 0,
        totalDamagedItems: 0,
        totalLostItems: 0
      };
    }

    const inspections = loan.returnInspection.itemInspections;
    
    const totalItemsExpected = inspections.reduce((sum, item) => sum + (item.quantityExpected || 0), 0);
    const totalItemsReturned = inspections.reduce((sum, item) => sum + (item.quantityReturned || 0), 0);
    const totalItemsNotReturned = inspections.reduce((sum, item) => sum + Math.max(0, (item.quantityExpected || 0) - (item.quantityReturned || 0)), 0);
    
    const totalDamagedItems = inspections
      .filter(item => item.condition === 'damaged')
      .reduce((sum, item) => sum + (item.quantityReturned || 0), 0);
    
    const totalLostItems = inspections
      .filter(item => item.condition === 'lost')
      .reduce((sum, item) => sum + Math.max(0, (item.quantityExpected || 0) - (item.quantityReturned || 0)), 0);

    return {
      totalItemsExpected,
      totalItemsReturned,
      totalItemsNotReturned,
      totalDamagedItems,
      totalLostItems
    };
  };

  useEffect(() => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    
    const filtered = allLoans.filter(loan => {
      const nameMatch = loan.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || '';
      const phoneMatch = loan.phone?.includes(searchTerm) || '';
      const searchMatch = nameMatch || phoneMatch;
      
      const pickup = loan.pickupDate?.seconds
        ? new Date(loan.pickupDate.seconds * 1000)
        : new Date(loan.pickupDate);
      const dateMatch = (!from || pickup >= from) && (!to || pickup <= to);
      
      return searchMatch && dateMatch;
    });
    setFilteredLoans(filtered);
  }, [searchTerm, dateFrom, dateTo, allLoans]);

  const getConditionIcon = (condition) => {
    switch (condition) {
      case 'good': return <CheckCircle size={16} style={{ color: '#10b981' }} />;
      case 'damaged': return <AlertTriangle size={16} style={{ color: '#f59e0b' }} />;
      case 'lost': return <XCircle size={16} style={{ color: '#ef4444' }} />;
      default: return <Package size={16} style={{ color: '#6b7280' }} />;
    }
  };

  const getConditionText = (condition) => {
    switch (condition) {
      case 'good': return 'תקין';
      case 'damaged': return 'פגום';
      case 'lost': return 'אבד/לא הוחזר';
      default: return 'לא נבדק';
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'good': return '#10b981';
      case 'damaged': return '#f59e0b';
      case 'lost': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const exportToPDF = (loan) => {
    const doc = new jsPDF();
    const summary = calculateReturnSummary(loan);
    
    // Set Hebrew font direction
    doc.setFont('helvetica');
    
    // Header
    doc.setFontSize(16);
    doc.text(`דוח השאלה - ${loan.clientName}`, 20, 20);
    
    // Basic info
    doc.setFontSize(12);
    doc.text(`מתנדבת: ${loan.volunteerName}`, 20, 35);
    doc.text(`טלפון: ${loan.phone}`, 20, 45);
    doc.text(`כתובת: ${loan.address}`, 20, 55);
    doc.text(`תאריך איסוף: ${formatDate(loan.pickupDate)}`, 20, 65);
    doc.text(`תאריך החזרה: ${formatDate(loan.returnDate)}`, 20, 75);
    doc.text(`סוג אירוע: ${loan.eventType}`, 20, 85);
    
    // Items table
    const itemRows = loan.items?.map((item, i) => [
      i + 1,
      item.name,
      item.quantity,
      loan.returnInspection?.itemInspections?.find(insp => insp.itemId === item.id)?.quantityReturned || 'לא נבדק',
      loan.returnInspection?.itemInspections?.find(insp => insp.itemId === item.id)?.condition || 'לא נבדק'
    ]) || [];

    autoTable(doc, {
      head: [['#', 'פריט', 'הושאל', 'הוחזר', 'מצב']],
      body: itemRows,
      startY: 95,
      styles: { fontSize: 10 }
    });

    // Return inspection summary
    if (loan.returnInspection) {
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text('סיכום בדיקת החזרה:', 20, finalY);
      
      doc.setFontSize(11);
      doc.text(`סה"כ פריטים שהושאלו: ${summary.totalItemsExpected}`, 20, finalY + 15);
      doc.text(`סה"כ פריטים שהוחזרו: ${summary.totalItemsReturned}`, 20, finalY + 25);
      doc.text(`פריטים שלא הוחזרו: ${summary.totalItemsNotReturned}`, 20, finalY + 35);
      doc.text(`פריטים פגומים: ${summary.totalDamagedItems}`, 20, finalY + 45);
      doc.text(`פריטים אבודים: ${summary.totalLostItems}`, 20, finalY + 55);
      doc.text(`עלות נזקים: ₪${loan.returnInspection.summary?.totalRepairCost || 0}`, 20, finalY + 65);
      
      if (loan.returnInspection.summary?.managerNotes) {
        doc.text(`הערות: ${loan.returnInspection.summary.managerNotes}`, 20, finalY + 75);
      }
      
      doc.text(`תאריך בדיקה: ${formatDateTime(loan.returnInspection.completedAt)}`, 20, finalY + 85);
    }

    doc.save(`השאלה_${loan.clientName}_${formatDate(loan.pickupDate)}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען היסטוריית השאלות...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '1rem', 
      maxWidth: '1200px', 
      margin: '0 auto', 
      fontFamily: 'Arial, sans-serif' 
    }} dir="rtl">
      {/* Add mobile date field styling */}
      <style>{`
        @media (max-width: 768px) {
          .date-input {
            appearance: none !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            background: white !important;
            border: 2px solid #e5e7eb !important;
            border-radius: 8px !important;
            padding: 12px !important;
            font-size: 16px !important;
            text-align: center !important;
            direction: ltr !important;
            width: 100% !important;
            box-sizing: border-box !important;
            cursor: pointer !important;
            letter-spacing: 1px !important;
          }
          
          .date-input::-webkit-calendar-picker-indicator {
            opacity: 0 !important;
            position: absolute !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: 100% !important;
            cursor: pointer !important;
            background: transparent !important;
          }
          
          .date-input::-webkit-inner-spin-button,
          .date-input::-webkit-outer-spin-button {
            opacity: 0 !important;
            -webkit-appearance: none !important;
            margin: 0 !important;
          }
        }
      `}</style>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(to right, #3b82f6, #1e40af)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 'bold',
          margin: 0,
          marginBottom: '0.5rem'
        }}>
          📚 היסטוריית השאלות
        </h1>
        <p style={{
          fontSize: '0.95rem',
          opacity: 0.9,
          margin: 0
        }}>
          כל ההזמנות שהושלמו עם פרטי בדיקת החזרה
        </p>
      </div>

      {!selectedLoan && (
        <>
          {/* Search and Filter */}
          <div style={{
            background: 'white',
            padding: window.innerWidth < 768 ? '1rem' : '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: window.innerWidth < 768 ? 'column' : 'row',
              gap: '1rem',
              alignItems: window.innerWidth < 768 ? 'stretch' : 'end'
            }}>
              <div style={{ flex: window.innerWidth < 768 ? 'none' : '2' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  <Search size={16} style={{ display: 'inline', marginLeft: '0.25rem' }} />
                  חיפוש לפי שם לקוח או טלפון
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="הקלד שם או טלפון..."
                />
              </div>
              <div style={{ flex: '1' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  <Calendar size={16} style={{ display: 'inline', marginLeft: '0.25rem' }} />
                  מתאריך
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="date-input"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ flex: '1' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  <Calendar size={16} style={{ display: 'inline', marginLeft: '0.25rem' }} />
                  עד תאריך
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="date-input"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Results Summary */}
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: '#f3f4f6',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#374151'
            }}>
              נמצאו {filteredLoans.length} השאלות מתוך {allLoans.length} סה"כ
            </div>
          </div>

          {/* Loans Grid - הנה התיקון העיקרי! */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 
              ? '1fr' 
              : window.innerWidth < 1024 
                ? 'repeat(2, 1fr)' 
                : 'repeat(3, 1fr)',
            gap: window.innerWidth < 768 ? '1rem' : '1.5rem'
          }}>
            {filteredLoans.length === 0 ? (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '3rem',
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <Package size={48} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.25rem', color: '#6b7280', margin: 0 }}>
                  לא נמצאו השאלות
                </h3>
                <p style={{ color: '#9ca3af', margin: '0.5rem 0 0 0' }}>
                  נסה לשנות את פרמטרי החיפוש
                </p>
              </div>
            ) : (
              filteredLoans.map(loan => (
                <div
                  key={loan.id}
                  onClick={() => setSelectedLoan(loan)}
                  style={{
                    background: 'white',
                    padding: window.innerWidth < 768 ? '1rem' : '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Loan Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <div style={{ flex: '1', minWidth: '0' }}>
                      <h3 style={{
                        fontSize: window.innerWidth < 768 ? '1rem' : '1.25rem',
                        fontWeight: 'bold',
                        margin: 0,
                        color: '#1f2937',
                        wordBreak: 'break-word'
                      }}>
                        {loan.clientName}
                      </h3>
                      <p style={{
                        fontSize: window.innerWidth < 768 ? '0.75rem' : '0.875rem',
                        color: '#6b7280',
                        margin: '0.25rem 0 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <User size={window.innerWidth < 768 ? 12 : 14} />
                        {loan.volunteerName}
                      </p>
                    </div>
                    <div style={{
                      background: '#10b981',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: window.innerWidth < 768 ? '0.6rem' : '0.75rem',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}>
                      הושלם
                    </div>
                  </div>

                  {/* Loan Info */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '0.5rem',
                    fontSize: window.innerWidth < 768 ? '0.75rem' : '0.875rem',
                    color: '#6b7280'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Phone size={window.innerWidth < 768 ? 12 : 14} />
                      <span style={{ wordBreak: 'break-all' }}>{loan.phone}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={window.innerWidth < 768 ? 12 : 14} />
                      <span style={{ fontSize: window.innerWidth < 768 ? '0.7rem' : '0.875rem' }}>
                        {formatDate(loan.pickupDate)} → {formatDate(loan.returnDate)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Package size={window.innerWidth < 768 ? 12 : 14} />
                      {loan.items?.reduce((sum, item) => sum + item.quantity, 0)} פריטים
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Selected Loan Details */}
      {selectedLoan && (
        <div style={{
          background: 'white',
          padding: window.innerWidth < 768 ? '1rem' : '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '2px solid #e5e7eb',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h2 style={{
                fontSize: window.innerWidth < 768 ? '1.25rem' : '2rem',
                fontWeight: 'bold',
                margin: 0,
                color: '#1f2937'
              }}>
                השאלה - {selectedLoan.clientName}
              </h2>
              <p style={{
                fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem',
                color: '#6b7280',
                margin: '0.5rem 0 0 0'
              }}>
                הושלמה ב-{formatDateTime(selectedLoan.returnInspection?.completedAt)}
              </p>
            </div>
            <button
              onClick={() => setSelectedLoan(null)}
              style={{
                background: '#6b7280',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <ArrowRight size={16} />
              חזרה לרשימה
            </button>
          </div>

          {/* Client Info */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 
              ? '1fr' 
              : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
            padding: '1.5rem',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>לקוח</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1f2937' }}>{selectedLoan.clientName}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>מתנדבת</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1f2937' }}>{selectedLoan.volunteerName}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>טלפון</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1f2937' }}>{selectedLoan.phone}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>כתובת</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1f2937' }}>{selectedLoan.address}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>תאריכים</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1f2937' }}>
                {formatDate(selectedLoan.pickupDate)} → {formatDate(selectedLoan.returnDate)}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>סוג אירוע</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1f2937' }}>{selectedLoan.eventType}</span>
            </div>
          </div>

          {/* Items List with Return Status */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              margin: '0 0 1rem 0',
              color: '#1f2937'
            }}>
              📦 פריטים וסטטוס החזרה
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {selectedLoan.items?.map((item, i) => {
                const inspection = selectedLoan.returnInspection?.itemInspections?.find(
                  insp => insp.itemId === item.id || insp.name === item.name
                );
                
                return (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    flexWrap: window.innerWidth < 768 ? 'wrap' : 'nowrap',
                    gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1', minWidth: '200px' }}>
                      <Package size={20} style={{ color: '#6b7280' }} />
                      <div>
                        <h4 style={{
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          margin: 0,
                          color: '#1f2937'
                        }}>
                          {item.name}
                        </h4>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: '0.25rem 0 0 0'
                        }}>
                          הושאל: {item.quantity} | הוחזר: {inspection?.quantityReturned || 0}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getConditionIcon(inspection?.condition)}
                      <span style={{
                        color: getConditionColor(inspection?.condition),
                        fontWeight: 'bold',
                        fontSize: '0.875rem'
                      }}>
                        {getConditionText(inspection?.condition)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Return Inspection Summary */}
          {selectedLoan.returnInspection && (() => {
            const summary = calculateReturnSummary(selectedLoan);
            return (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #10b981',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  margin: '0 0 1rem 0',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle size={24} />
                  סיכום בדיקת החזרה
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: window.innerWidth < 768 
                    ? '1fr' 
                    : 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '2rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '1rem', color: '#059669', display: 'block', marginBottom: '0.5rem' }}>
                      ✅ פריטים שהוחזרו
                    </span>
                    <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>
                      {summary.totalItemsReturned}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
                      מתוך {summary.totalItemsExpected}
                    </span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '1rem', color: '#059669', display: 'block', marginBottom: '0.5rem' }}>
                      ❌ פריטים שלא הוחזרו/פגומים
                    </span>
                    <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                      {summary.totalItemsNotReturned }
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
                      אבודים/פגומים/לא הוחזרו
                    </span>
                  </div>
                </div>

                {selectedLoan.returnInspection.summary?.managerNotes && (
                  <div style={{
                    background: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginTop: '1rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', color: '#059669', display: 'block', marginBottom: '0.5rem' }}>
                      הערות מנהל
                    </span>
                    <p style={{ fontSize: '1rem', color: '#1f2937', margin: 0 }}>
                      {selectedLoan.returnInspection.summary.managerNotes}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <button
              onClick={() => exportToPDF(selectedLoan)}
              style={{
                background: 'linear-gradient(to right, #10b981, #059669)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
              }}
            >
              <Download size={16} />
              ייצא כ-PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanHistory;