// src/components/AlertBanner.jsx - Component to display alerts on home page
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { AlertTriangle, Info, CheckCircle, X, Bell } from 'lucide-react';

const AlertBanner = () => {
    const [alerts, setAlerts] = useState([]);
    const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

    useEffect(() => {
        // Load dismissed alerts from localStorage
        const dismissed = localStorage.getItem('dismissedAlerts');
        if (dismissed) {
            setDismissedAlerts(new Set(JSON.parse(dismissed)));
        }

        // Listen for active alerts
        const alertsQuery = query(
            collection(db, 'alerts'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
            const activeAlerts = [];

            snapshot.docs.forEach(doc => {
                const alert = { id: doc.id, ...doc.data() };

                // Only show active alerts
                if (alert.isActive) {
                    activeAlerts.push(alert);
                }
            });

            setAlerts(activeAlerts);
        });

        return () => unsubscribe();
    }, []);

    const handleDismiss = (alertId) => {
        const newDismissed = new Set([...dismissedAlerts, alertId]);
        setDismissedAlerts(newDismissed);
        localStorage.setItem('dismissedAlerts', JSON.stringify([...newDismissed]));
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case 'warning': return <AlertTriangle size={20} />;
            case 'success': return <CheckCircle size={20} />;
            case 'info': return <Info size={20} />;
            default: return <Bell size={20} />;
        }
    };

    const getAlertStyles = (type) => {
        const baseStyles = {
            padding: '16px 20px',
            marginBottom: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            direction: 'rtl',
            fontFamily: '"Assistant", "Heebo", system-ui, sans-serif',
            fontSize: '16px',
            fontWeight: '500',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        };

        switch (type) {
            case 'warning':
                return { ...baseStyles, backgroundColor: '#fef3c7', color: '#92400e', border: '2px solid #f59e0b' };
            case 'success':
                return { ...baseStyles, backgroundColor: '#d1fae5', color: '#065f46', border: '2px solid #10b981' };
            case 'info':
                return { ...baseStyles, backgroundColor: '#dbeafe', color: '#1e40af', border: '2px solid #3b82f6' };
            default:
                return { ...baseStyles, backgroundColor: '#f3f4f6', color: '#374151', border: '2px solid #6b7280' };
        }
    };

    // Filter out dismissed alerts
    const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

    if (visibleAlerts.length === 0) {
        return null;
    }

    return (
        <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '8px 16px'
        }}>
            {visibleAlerts.map(alert => (
                <div key={alert.id} style={getAlertStyles(alert.type)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        {getAlertIcon(alert.type)}
                        <div>
                            {alert.title && (
                                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                    {alert.title}
                                </div>
                            )}
                            <div>{alert.message}</div>
                        </div>
                    </div>

                    <button
                        onClick={() => handleDismiss(alert.id)}
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: 0.7,
                            transition: 'opacity 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.opacity = '1'}
                        onMouseOut={(e) => e.target.style.opacity = '0.7'}
                    >
                        <X size={20} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default AlertBanner;