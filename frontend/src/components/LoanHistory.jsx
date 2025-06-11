import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const LoanHistory = () => {
  const [allLoans, setAllLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const fetchClosedLoans = async () => {
      const q = query(collection(db, 'orders'), where('status', '==', 'closed'));
      const snapshot = await getDocs(q);
      const loans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllLoans(loans);
    };
    fetchClosedLoans();
  }, []);

  const formatDate = (d) => {
    if (!d) return '';
    const date = d.seconds ? new Date(d.seconds * 1000) : new Date(d);
    return date.toLocaleDateString('he-IL');
  };

  useEffect(() => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    const filtered = allLoans.filter(loan => {
      const nameMatch = loan.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      const pickup = loan.pickupDate?.seconds
        ? new Date(loan.pickupDate.seconds * 1000)
        : new Date(loan.pickupDate);
      const dateMatch = (!from || pickup >= from) && (!to || pickup <= to);
      return nameMatch && dateMatch;
    });
    setFilteredLoans(filtered);
  }, [searchTerm, dateFrom, dateTo, allLoans]);

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-800">היסטוריית השאלות</h2>

      {!selectedLoan && (
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">חיפוש לפי שם לקוח:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="border rounded px-3 py-1 w-48"
              placeholder="הקלד שם..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">מתאריך:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="border rounded px-3 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">עד תאריך:</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="border rounded px-3 py-1"
            />
          </div>
        </div>
      )}

      {selectedLoan && (
        <div className="bg-white p-6 rounded-xl shadow border max-w-3xl mx-auto text-sm text-gray-800">
          <h3 className="text-2xl font-bold mb-4 text-blue-700 text-center">פרטי ההשאלה</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <p><strong>לקוח:</strong> {selectedLoan.clientName}</p>
            <p><strong>מתנדבת:</strong> {selectedLoan.volunteerName}</p>
            <p><strong>טלפון:</strong> {selectedLoan.phone}</p>
            <p><strong>כתובת:</strong> {selectedLoan.address}</p>
            <p><strong>תאריכים:</strong> {formatDate(selectedLoan.pickupDate)} → {formatDate(selectedLoan.returnDate)}</p>
            <p><strong>סוג אירוע:</strong> {selectedLoan.eventType}</p>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-2 text-gray-700">📦 פריטים:</h4>
            <ul className="list-disc list-inside">
              {selectedLoan.items?.map((item, i) => (
                <li key={i}>{item.name} (×{item.quantity})</li>
              ))}
            </ul>
          </div>

          {selectedLoan.returnInspection && (
            <div className="bg-gray-50 p-4 rounded-lg border mb-6">
              <h4 className="text-lg font-bold mb-2 text-green-700">בדיקת החזרה</h4>
              <p><strong>מצב:</strong> {selectedLoan.returnInspection.inspectionStatus}</p>
              <p><strong>בדק/ה:</strong> {selectedLoan.returnInspection.inspectedBy}</p>
              <p><strong>סה"כ פריטים שהוחזרו:</strong> {selectedLoan.returnInspection.totalItemsReturned}</p>
              <p><strong>סה"כ נזקים:</strong> ₪{selectedLoan.returnInspection.totalRepairCost}</p>
              {selectedLoan.returnInspection.managerNotes && (
                <p><strong>הערות מנהל:</strong> {selectedLoan.returnInspection.managerNotes}</p>
              )}
            </div>
          )}

          <div className="flex justify-between mt-6 gap-4">
            <button
              onClick={() => setSelectedLoan(null)}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded text-sm"
            >
              ← חזרה לרשימה
            </button>

            <button
              onClick={() => {
                const doc = new jsPDF();
                doc.setFont('helvetica');
                doc.setFontSize(12);
                doc.text('דו"ח הלוואה - לקוח: ' + selectedLoan.clientName, 14, 20);
                const rows = selectedLoan.items?.map((item, i) => [
                  i + 1,
                  item.name,
                  item.quantity
                ]);
                autoTable(doc, {
                  head: [['#', 'פריט', 'כמות']],
                  body: rows,
                  startY: 30
                });
                doc.text(`מתנדבת: ${selectedLoan.volunteerName}`, 14, doc.lastAutoTable.finalY + 10);
                doc.text(`תאריכים: ${formatDate(selectedLoan.pickupDate)} → ${formatDate(selectedLoan.returnDate)}`, 14, doc.lastAutoTable.finalY + 20);
                if (selectedLoan.returnInspection) {
                  doc.text(`סטטוס בדיקה: ${selectedLoan.returnInspection.inspectionStatus}`, 14, doc.lastAutoTable.finalY + 30);
                  doc.text(`סה"כ נזקים: ₪${selectedLoan.returnInspection.totalRepairCost}`, 14, doc.lastAutoTable.finalY + 40);
                }
                doc.save(`loan_${selectedLoan.clientName}.pdf`);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              ייצוא להזמנה כ־PDF
            </button>
          </div>
        </div>
      )}

      {!selectedLoan && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredLoans.length === 0 ? (
            <p className="text-center">לא נמצאו השאלות.</p>
          ) : (
            filteredLoans.map(loan => (
              <div
                key={loan.id}
                className="bg-white p-5 rounded-xl shadow hover:shadow-md transition border cursor-pointer"
                onClick={() => setSelectedLoan(loan)}
              >
                <h3 className="text-xl font-bold text-gray-800 mb-1">{loan.clientName}</h3>
                <p className="text-sm text-gray-600">מתנדבת: {loan.volunteerName}</p>
                <p className="text-sm text-gray-500">{formatDate(loan.pickupDate)} → {formatDate(loan.returnDate)}</p>
                <p className="text-xs text-gray-400">סה"כ פריטים: {loan.items?.reduce((sum, item) => sum + item.quantity, 0)}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LoanHistory;