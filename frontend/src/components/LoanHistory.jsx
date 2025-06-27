import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ArrowRight, Download, Search, Calendar, Package, CheckCircle, XCircle, AlertTriangle, User, Phone, MapPin, Clock, BarChart3 } from 'lucide-react';
import LoanStatisticsModal from './LoanStatisticsModal';
import EmailReminderSystem from './EmailReminderSystem';

// רכיב להצגת תמונה ראשית של פריט
const ItemImage = ({ item, size = 60 }) => {
  // חיפוש התמונה הראשית - imageUrl או images[0]
  const primaryImage = item.imageUrl || (item.images && item.images.length > 0 ? item.images[0] : null);
  
  if (!primaryImage) {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
        flexShrink: 0
      }}>
        <Package size={size * 0.4} style={{ color: '#9ca3af' }} />
      </div>
    );
  }

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      flexShrink: 0,
      background: '#f9fafb'
    }}>
      <img
        src={primaryImage}
        alt={item.name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
        onError={(e) => {
          e.target.parentNode.innerHTML = `
            <div style="
              width: 100%; 
              height: 100%; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              background: #f9fafb;
            ">
              <svg width="${size * 0.4}" height="${size * 0.4}" viewBox="0 0 24 24" fill="#9ca3af">
                <path d="M20 7h-3V6a4 4 0 0 0-4-4h-2a4 4 0 0 0-4 4v1H4a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM9 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1H9V6zm8 15H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v11a1 1 0 0 1-1 1z"/>
              </svg>
            </div>
          `;
        }}
      />
    </div>
  );
};

const LoanHistory = () => {
  const [allLoans, setAllLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [showStatsModal, setShowStatsModal] = useState(false);

  useEffect(() => {
    const fetchClosedLoans = async () => {
      try {
        setLoading(true);

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

        console.log('🔍 מחפש הזמנות סגורות...');
        const q = query(
          collection(db, 'orders'),
          where('status', '==', 'closed')
        );
        const snapshot = await getDocs(q);
        const loans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log('✅ הזמנות סגורות:', loans);
        setAllLoans(loans);

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

  const getDetailedConditionText = (item, inspection) => {
    if (!inspection) return 'לא נבדק';
    
    const quantityBorrowed = item.quantity;
    const quantityReturned = inspection.quantityReturned || 0;
    const quantityMissing = Math.max(0, quantityBorrowed - quantityReturned);
    
    if (quantityMissing === 0) {
      switch (inspection.condition) {
        case 'good': return 'תקין';
        case 'damaged': return `${quantityReturned} פגום`;
        default: return 'תקין';
      }
    }
    
    if (quantityReturned === 0) {
      return `${quantityMissing} אבד/לא הוחזר`;
    }
    
    let statusParts = [];
    
    if (quantityReturned > 0) {
      if (inspection.condition === 'damaged') {
        statusParts.push(`${quantityReturned} פגום`);
      } else {
        statusParts.push(`${quantityReturned} תקין`);
      }
    }
    
    if (quantityMissing > 0) {
      statusParts.push(`${quantityMissing} אבד/לא הוחזר`);
    }
    
    return statusParts.join(', ');
  };

  const openReportWindow = (loan) => {
    const summary = calculateReturnSummary(loan);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>דוח השאלה - ${loan.clientName}</title>
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  direction: rtl; 
                  text-align: right;
                  margin: 20px;
                  line-height: 1.6;
                  padding-bottom: 100px;
              }
              .header { 
                  text-align: center; 
                  margin-bottom: 30px;
                  border-bottom: 2px solid #333;
                  padding-bottom: 15px;
              }
              .header h1 {
                  font-size: 24px;
                  color: #2c5aa0;
                  margin: 0 0 5px 0;
              }
              .header h2 {
                  font-size: 20px;
                  color: #333;
                  margin: 0 0 10px 0;
              }
              .info-grid { 
                  display: grid; 
                  grid-template-columns: 1fr 1fr; 
                  gap: 20px; 
                  margin-bottom: 30px;
              }
              .info-item { 
                  margin-bottom: 10px; 
              }
              .label { 
                  font-weight: bold; 
                  color: #333;
              }
              table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin-bottom: 30px;
              }
              th, td { 
                  border: 1px solid #ddd; 
                  padding: 8px; 
                  text-align: center;
              }
              th { 
                  background-color: #f5f5f5; 
                  font-weight: bold;
              }
              .summary { 
                  background-color: #f9f9f9; 
                  padding: 20px; 
                  border-radius: 5px;
                  margin-top: 20px;
              }
              .summary h3 {
                  margin-top: 0;
                  color: #2c5aa0;
              }
              
              .download-btn {
                  position: fixed;
                  bottom: 20px;
                  right: 20px;
                  background: linear-gradient(45deg, #2196F3, #21CBF3);
                  color: white;
                  border: none;
                  padding: 15px 25px;
                  border-radius: 50px;
                  cursor: pointer;
                  font-size: 16px;
                  font-weight: bold;
                  box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
                  transition: all 0.3s ease;
                  z-index: 1000;
                  display: flex;
                  align-items: center;
                  gap: 8px;
              }
              
              .download-btn:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
              }
              
              .download-btn:active {
                  transform: translateY(0);
              }
              
              @media print {
                  body { margin: 0; font-size: 14px; }
                  .header { page-break-after: avoid; }
                  .download-btn { display: none !important; }
              }
          </style>
      </head>
      <body>
          <button class="download-btn" onclick="window.print(); return false;">
              📥 הורדת דוח
          </button>
          
          <div class="header">
              <h1>גמ"ח שמחת זקנתי</h1>
              <h2>דוח השאלה - ${loan.clientName}</h2>
              <p>נוצר בתאריך: ${new Date().toLocaleDateString('he-IL')}</p>
          </div>
          
          <div class="info-grid">
              <div>
                  <div class="info-item">
                      <span class="label">מתנדבת:</span> ${loan.volunteerName}
                  </div>
                  <div class="info-item">
                      <span class="label">טלפון:</span> ${loan.phone}
                  </div>
                  <div class="info-item">
                      <span class="label">כתובת:</span> ${loan.address}
                  </div>
              </div>
              <div>
                  <div class="info-item">
                      <span class="label">תאריך איסוף:</span> ${formatDate(loan.pickupDate)}
                  </div>
                  <div class="info-item">
                      <span class="label">תאריך החזרה:</span> ${formatDate(loan.returnDate)}
                  </div>
                  <div class="info-item">
                      <span class="label">סוג אירוע:</span> ${loan.eventType}
                  </div>
              </div>
          </div>

          <h3>פריטים בהזמנה</h3>
          <table>
              <thead>
                  <tr>
                      <th>#</th>
                      <th>שם פריט</th>
                      <th>כמות שהושאלה</th>
                      <th>תקין</th>
                      <th>אבד/לא הוחזר</th>
                  </tr>
              </thead>
              <tbody>
                  ${loan.items?.map((item, i) => {
                    const inspection = loan.returnInspection?.itemInspections?.find(insp => 
                      insp.itemId === item.id || insp.name === item.name
                    );
                    
                    const quantityBorrowed = item.quantity;
                    const quantityReturned = inspection?.quantityReturned || 0;
                    const quantityMissing = Math.max(0, quantityBorrowed - quantityReturned);
                    
                    let goodQuantity = 0;
                    let badQuantity = quantityMissing;
                    
                    if (inspection && quantityReturned > 0) {
                      if (inspection.condition === 'good') {
                        goodQuantity = quantityReturned;
                      } else if (inspection.condition === 'damaged') {
                        badQuantity += quantityReturned;
                      } else {
                        goodQuantity = quantityReturned;
                      }
                    }
                    
                    return `
                      <tr>
                          <td>${i + 1}</td>
                          <td>${item.name}</td>
                          <td>${quantityBorrowed}</td>
                          <td>${goodQuantity}</td>
                          <td>${badQuantity}</td>
                      </tr>
                    `;
                  }).join('') || '<tr><td colspan="5">אין פריטים</td></tr>'}
              </tbody>
          </table>

          ${loan.returnInspection ? `
          <div class="summary">
              <h3 style="text-align: center;">סיכום בדיקת החזרה</h3>
              <div style="text-align: center;">
                  <div class="info-item">
                      <span class="label">סה"כ פריטים שהושאלו:</span> ${summary.totalItemsExpected}
                  </div>
                  <div class="info-item">
                      <span class="label">סה"כ פריטים שהוחזרו:</span> ${summary.totalItemsReturned}
                  </div>
                  <div class="info-item">
                      <span class="label">פריטים שלא הוחזרו:</span> ${summary.totalItemsNotReturned}
                  </div>
              </div>
              
              ${loan.returnInspection.summary?.managerNotes ? `
              <div class="info-item" style="margin-top: 20px; text-align: center;">
                  <span class="label">הערות מנהל:</span><br>
                  ${loan.returnInspection.summary.managerNotes}
              </div>
              ` : ''}
          </div>
          ` : ''}
      </body>
      </html>
    `;

    const reportWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes,resizable=yes');
    reportWindow.document.write(htmlContent);
    reportWindow.document.close();
    reportWindow.focus();
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
      
      <div style={{
        background: 'linear-gradient(to right, #3b82f6, #1e40af)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ textAlign: window.innerWidth < 768 ? 'center' : 'right', flex: '1' }}>
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

        <button
          onClick={() => setShowStatsModal(true)}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <BarChart3 size={20} />
          📊 סטטיסטיקות
        </button>
      </div>

      {!selectedLoan && (
        <>
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
                        {formatDate(loan.pickupDate)} ← {formatDate(loan.returnDate)}
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

      {selectedLoan && (
        <div style={{
          background: 'white',
          padding: window.innerWidth < 768 ? '1rem' : '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
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
                {formatDate(selectedLoan.pickupDate)} ← {formatDate(selectedLoan.returnDate)}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>סוג אירוע</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1f2937' }}>{selectedLoan.eventType}</span>
            </div>
          </div>

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
                      <ItemImage item={item} size={window.innerWidth < 768 ? 50 : 60} />
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
                          הושאל: {item.quantity} | תקין: {(() => {
                            const quantityReturned = inspection?.quantityReturned || 0;
                            if (inspection && quantityReturned > 0 && inspection.condition === 'good') {
                              return quantityReturned;
                            } else if (inspection && quantityReturned > 0 && inspection.condition !== 'damaged') {
                              return quantityReturned;
                            }
                            return 0;
                          })()} | אבד/פגום: {(() => {
                            const quantityBorrowed = item.quantity;
                            const quantityReturned = inspection?.quantityReturned || 0;
                            const quantityMissing = Math.max(0, quantityBorrowed - quantityReturned);
                            let badQuantity = quantityMissing;
                            if (inspection && quantityReturned > 0 && inspection.condition === 'damaged') {
                              badQuantity += quantityReturned;
                            }
                            return badQuantity;
                          })()}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {(() => {
                        const quantityBorrowed = item.quantity;
                        const quantityReturned = inspection?.quantityReturned || 0;
                        const quantityMissing = Math.max(0, quantityBorrowed - quantityReturned);
                        let badQuantity = quantityMissing;
                        if (inspection && quantityReturned > 0 && inspection.condition === 'damaged') {
                          badQuantity += quantityReturned;
                        }
                        
                        if (badQuantity === 0) {
                          return (
                            <>
                              <CheckCircle size={16} style={{ color: '#10b981' }} />
                              <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.875rem' }}>
                                הכל תקין
                              </span>
                            </>
                          );
                        } else {
                          return (
                            <>
                              <XCircle size={16} style={{ color: '#ef4444' }} />
                              <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.875rem' }}>
                                {badQuantity} חסר/פגום
                              </span>
                            </>
                          );
                        }
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            marginTop: '3rem'
          }}>
            <button
              onClick={() => openReportWindow(selectedLoan)}
              style={{
                background: 'linear-gradient(to right, #10b981, #059669)',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s ease',
                minWidth: window.innerWidth < 768 ? '100%' : '250px',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
            >
              <Download size={20} />
              🖨️ הדפס דוח עברית
            </button>
          </div>
        </div>
      )}
      
      <LoanStatisticsModal
        showStatsModal={showStatsModal}
        setShowStatsModal={setShowStatsModal}
        loanHistory={allLoans}
      />
      <EmailReminderSystem />
    </div>
  );
};

export default LoanHistory;