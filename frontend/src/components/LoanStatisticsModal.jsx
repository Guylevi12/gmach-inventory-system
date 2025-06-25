import React, { useMemo } from 'react';

const LoanStatisticsModal = ({ showStatsModal, setShowStatsModal, loanHistory }) => {
    const statistics = useMemo(() => {
        if (!loanHistory || loanHistory.length === 0) {
            return null;
        }

        // Helper function to parse dates (Firebase Timestamp or regular date)
        const parseDate = (dateField) => {
            if (!dateField) return null;
            return dateField.seconds ? new Date(dateField.seconds * 1000) : new Date(dateField);
        };

        // Basic counts - all loans in history are completed (status === 'closed')
        const totalLoans = loanHistory.length;
        const completedLoans = totalLoans; // All loans in history are completed
        const activeLoans = 0; // No active loans in closed history

        // Item statistics
        const allItems = loanHistory.flatMap(loan => loan.items || []);
        const totalItemsLoaned = allItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

        // Most popular items
        const itemCounts = {};
        allItems.forEach(item => {
            const key = item.name;
            itemCounts[key] = (itemCounts[key] || 0) + (item.quantity || 1);
        });

        const mostPopularItems = Object.entries(itemCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // Client statistics (borrowers)
        const clientCounts = {};
        loanHistory.forEach(loan => {
            const client = loan.clientName || 'לא צוין';
            clientCounts[client] = (clientCounts[client] || 0) + 1;
        });

        const topBorrowers = Object.entries(clientCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // Volunteer statistics
        const volunteerCounts = {};
        loanHistory.forEach(loan => {
            const volunteer = loan.volunteerName || 'לא צוין';
            volunteerCounts[volunteer] = (volunteerCounts[volunteer] || 0) + 1;
        });

        const topVolunteers = Object.entries(volunteerCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // Date statistics
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const thisMonthLoans = loanHistory.filter(loan => {
            const loanDate = parseDate(loan.pickupDate);
            if (!loanDate) return false;
            return loanDate.getMonth() === currentMonth && loanDate.getFullYear() === currentYear;
        }).length;

        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const lastMonthLoans = loanHistory.filter(loan => {
            const loanDate = parseDate(loan.pickupDate);
            if (!loanDate) return false;
            return loanDate.getMonth() === lastMonth && loanDate.getFullYear() === lastMonthYear;
        }).length;

        // Average loan duration (planned duration)
        const loansWithDuration = loanHistory.filter(loan =>
            loan.pickupDate && loan.returnDate
        );

        let averageDuration = 0;
        if (loansWithDuration.length > 0) {
            const totalDuration = loansWithDuration.reduce((sum, loan) => {
                const pickup = parseDate(loan.pickupDate);
                const returnPlanned = parseDate(loan.returnDate);
                if (!pickup || !returnPlanned) return sum;
                const duration = Math.ceil((returnPlanned - pickup) / (1000 * 60 * 60 * 24));
                return sum + Math.max(0, duration); // Ensure positive duration
            }, 0);
            averageDuration = Math.round(totalDuration / loansWithDuration.length);
        }

        // Return inspection statistics
        const loansWithInspection = loanHistory.filter(loan => loan.returnInspection);
        const totalItemsReturned = loansWithInspection.reduce((sum, loan) => {
            if (!loan.returnInspection?.itemInspections) return sum;
            return sum + loan.returnInspection.itemInspections.reduce((itemSum, item) =>
                itemSum + (item.quantityReturned || 0), 0
            );
        }, 0);

        const damagedItems = loansWithInspection.reduce((sum, loan) => {
            if (!loan.returnInspection?.itemInspections) return sum;
            return sum + loan.returnInspection.itemInspections
                .filter(item => item.condition === 'damaged')
                .reduce((itemSum, item) => itemSum + (item.quantityReturned || 0), 0);
        }, 0);

        const lostItems = loansWithInspection.reduce((sum, loan) => {
            if (!loan.returnInspection?.itemInspections) return sum;
            return sum + loan.returnInspection.itemInspections
                .filter(item => item.condition === 'lost')
                .reduce((itemSum, item) => itemSum + Math.max(0,
                    (item.quantityExpected || 0) - (item.quantityReturned || 0)
                ), 0);
        }, 0);

        // Event type statistics
        const eventTypeCounts = {};
        loanHistory.forEach(loan => {
            const eventType = loan.eventType || 'לא צוין';
            eventTypeCounts[eventType] = (eventTypeCounts[eventType] || 0) + 1;
        });

        const topEventTypes = Object.entries(eventTypeCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        return {
            totalLoans,
            activeLoans,
            completedLoans,
            totalItemsLoaned,
            totalItemsReturned,
            damagedItems,
            lostItems,
            mostPopularItems,
            topBorrowers,
            topVolunteers,
            topEventTypes,
            thisMonthLoans,
            lastMonthLoans,
            averageDuration,
            loansWithInspection: loansWithInspection.length
        };
    }, [loanHistory]);

    if (!showStatsModal) return null;

    if (!statistics) {
        return (
            <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
                <div className="modal-box" dir="rtl" onClick={(e) => e.stopPropagation()}>
                    <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>📊 סטטיסטיקות השאלות</h2>
                    <p style={{ textAlign: 'center' }}>אין נתונים זמינים</p>
                    <div className="modal-actions">
                        <button className="btn btn-gray" onClick={() => setShowStatsModal(false)}>
                            סגור
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
            <div className="modal-box" dir="rtl" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#2196F3' }}>
                    📊 סטטיסטיקות השאלות
                </h2>

                {/* General Statistics */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ borderBottom: '2px solid #2196F3', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                        📈 נתונים כלליים
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                        <div style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>
                                {statistics.totalLoans}
                            </div>
                            <div>סה"כ השאלות</div>
                        </div>
                        <div style={{ backgroundColor: '#e8f5e8', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#388e3c' }}>
                                {statistics.completedLoans}
                            </div>
                            <div>השאלות שהושלמו</div>
                        </div>
                        <div style={{ backgroundColor: '#fff3e0', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f57c00' }}>
                                {statistics.totalItemsLoaned}
                            </div>
                            <div>פריטים הושאלו</div>
                        </div>
                        <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                                {statistics.totalItemsReturned}
                            </div>
                            <div>פריטים הוחזרו</div>
                        </div>
                    </div>
                </div>

                {/* Monthly Comparison */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ borderBottom: '2px solid #2196F3', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                        📅 השוואה חודשית
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2' }}>
                                {statistics.thisMonthLoans}
                            </div>
                            <div>השאלות החודש</div>
                        </div>
                        <div style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#666' }}>
                                {statistics.lastMonthLoans}
                            </div>
                            <div>השאלות החודש שעבר</div>
                        </div>
                    </div>
                    {statistics.lastMonthLoans > 0 && (
                        <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                            {statistics.thisMonthLoans > statistics.lastMonthLoans ? (
                                <span style={{ color: '#388e3c' }}>
                                    ⬆️ עלייה של {((statistics.thisMonthLoans - statistics.lastMonthLoans) / statistics.lastMonthLoans * 100).toFixed(1)}%
                                </span>
                            ) : statistics.thisMonthLoans < statistics.lastMonthLoans ? (
                                <span style={{ color: '#d32f2f' }}>
                                    ⬇️ ירידה של {((statistics.lastMonthLoans - statistics.thisMonthLoans) / statistics.lastMonthLoans * 100).toFixed(1)}%
                                </span>
                            ) : (
                                <span style={{ color: '#666' }}>➡️ ללא שינוי</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Item Statistics */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ borderBottom: '2px solid #2196F3', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                        📦 סטטיסטיקות פריטים
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2' }}>
                                {statistics.totalItemsLoaned}
                            </div>
                            <div>סה"כ פריטים הושאלו</div>
                        </div>
                        <div style={{ backgroundColor: '#e8f5e8', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                                {statistics.totalItemsReturned}
                            </div>
                            <div>פריטים הוחזרו</div>
                        </div>
                        {statistics.damagedItems > 0 && (
                            <div style={{ backgroundColor: '#fff3e0', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                    {statistics.damagedItems}
                                </div>
                                <div>פריטים פגומים</div>
                            </div>
                        )}
                        {statistics.lostItems > 0 && (
                            <div style={{ backgroundColor: '#ffebee', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                                    {statistics.lostItems}
                                </div>
                                <div>פריטים אבודים</div>
                            </div>
                        )}
                    </div>

                    {statistics.mostPopularItems.length > 0 && (
                        <div>
                            <h4 style={{ marginBottom: '0.5rem' }}>🏆 הפריטים הפופולריים ביותר:</h4>
                            {statistics.mostPopularItems.map((item, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.5rem',
                                    backgroundColor: index === 0 ? '#fff3e0' : '#f5f5f5',
                                    borderRadius: '4px',
                                    marginBottom: '0.3rem'
                                }}>
                                    <span>{index + 1}. {item.name}</span>
                                    <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                                        {item.count} פעמים
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Client Statistics */}
                {statistics.topBorrowers.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ borderBottom: '2px solid #2196F3', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                            👥 הלקוחות הפעילים ביותר
                        </h3>
                        {statistics.topBorrowers.map((borrower, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.5rem',
                                backgroundColor: index === 0 ? '#e8f5e8' : '#f5f5f5',
                                borderRadius: '4px',
                                marginBottom: '0.3rem'
                            }}>
                                <span>{index + 1}. {borrower.name}</span>
                                <span style={{ fontWeight: 'bold', color: '#388e3c' }}>
                                    {borrower.count} השאלות
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Volunteer Statistics */}
                {statistics.topVolunteers.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ borderBottom: '2px solid #2196F3', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                            🌟 המתנדבות הפעילות ביותר
                        </h3>
                        {statistics.topVolunteers.map((volunteer, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.5rem',
                                backgroundColor: index === 0 ? '#e3f2fd' : '#f5f5f5',
                                borderRadius: '4px',
                                marginBottom: '0.3rem'
                            }}>
                                <span>{index + 1}. {volunteer.name}</span>
                                <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                                    {volunteer.count} השאלות
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Event Type Statistics */}
                {statistics.topEventTypes.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ borderBottom: '2px solid #2196F3', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                            🎉 סוגי האירועים הפופולריים
                        </h3>
                        {statistics.topEventTypes.map((eventType, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.5rem',
                                backgroundColor: index === 0 ? '#f0fdf4' : '#f5f5f5',
                                borderRadius: '4px',
                                marginBottom: '0.3rem'
                            }}>
                                <span>{index + 1}. {eventType.name}</span>
                                <span style={{ fontWeight: 'bold', color: '#10b981' }}>
                                    {eventType.count} פעמים
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Average Duration */}
                {statistics.averageDuration > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ borderBottom: '2px solid #2196F3', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                            ⏱️ משך השאלה ממוצע
                        </h3>
                        <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2' }}>
                                {statistics.averageDuration} ימים
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                (מבוסס על {loanHistory.filter(loan => loan.pickupDate && loan.returnDate).length} השאלות)
                            </div>
                        </div>
                    </div>
                )}

                {/* Return Inspection Summary */}
                {statistics.loansWithInspection > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ borderBottom: '2px solid #2196F3', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                            🔍 סיכום בדיקות החזרה
                        </h3>
                        <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                                {statistics.loansWithInspection}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                השאלות עם בדיקת החזרה מתוך {statistics.totalLoans} סה"כ
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                                ({((statistics.loansWithInspection / statistics.totalLoans) * 100).toFixed(1)}% מהשאלות נבדקו)
                            </div>
                        </div>
                    </div>
                )}

                <div className="modal-actions">
                    <button className="btn btn-blue" onClick={() => setShowStatsModal(false)}>
                        ✔️ סגור
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoanStatisticsModal;