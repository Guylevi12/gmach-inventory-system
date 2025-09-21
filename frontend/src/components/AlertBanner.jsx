// src/components/AlertBanner.jsx - Enhanced visual design
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { AlertTriangle, Info, CheckCircle, X, Bell, Calendar, Clock, Users } from 'lucide-react';

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
        const iconStyle = {
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            flexShrink: 0
        };

        switch (type) {
            case 'warning':
                return <AlertTriangle size={24} style={{ ...iconStyle, color: '#d97706' }} />;
            case 'success':
                return <CheckCircle size={24} style={{ ...iconStyle, color: '#059669' }} />;
            case 'info':
                return <Info size={24} style={{ ...iconStyle, color: '#2563eb' }} />;
            default:
                return <Bell size={24} style={{ ...iconStyle, color: '#6b7280' }} />;
        }
    };

    const getAlertStyles = (type) => {
        const baseStyles = {
            position: 'relative',
            padding: '20px 24px',
            marginBottom: '12px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            direction: 'rtl',
            fontFamily: '"Assistant", "Heebo", system-ui, sans-serif',
            fontSize: '16px',
            fontWeight: '500',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            cursor: 'default'
        };

        const typeStyles = {
            warning: {
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#b45309',
                borderLeft: '4px solid #f59e0b',
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.15)'
            },
            success: {
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#047857',
                borderLeft: '4px solid #10b981',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)'
            },
            info: {
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#1d4ed8',
                borderLeft: '4px solid #3b82f6',
                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)'
            },
            default: {
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#374151',
                borderLeft: '4px solid #6b7280',
                boxShadow: '0 4px 20px rgba(107, 114, 128, 0.15)'
            }
        };

        return {
            ...baseStyles,
            ...typeStyles[type] || typeStyles.default
        };
    };

    const getBackgroundPattern = (type) => {
        return {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: `
                radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 2px, transparent 2px),
                radial-gradient(circle at 80% 80%, rgba(255,255,255,0.3) 2px, transparent 2px),
                radial-gradient(circle at 40% 60%, rgba(255,255,255,0.2) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px, 40px 40px, 20px 20px',
            pointerEvents: 'none'
        };
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'warning': return 'הודעה חשובה';
            case 'success': return 'עדכון חיובי';
            case 'info': return 'מידע כללי';
            default: return 'הודעה';
        }
    };

    // Filter out dismissed alerts
    const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

    if (visibleAlerts.length === 0) {
        return null;
    }

    return (
        <>
            <style jsx>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                    }
                }
                
                .alert-container {
                    animation: slideDown 0.5s ease-out;
                }
                
                .alert-banner:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 40px rgba(0,0,0,0.15);
                }
                
                .dismiss-button:hover {
                    background-color: rgba(255,255,255,0.2) !important;
                    transform: scale(1.1);
                }
                
                .type-badge {
                    animation: pulse 2s infinite;
                }
            `}</style>

            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                padding: '16px 20px 8px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }} className="alert-container">
                {visibleAlerts.map((alert, index) => (
                    <div key={alert.id} style={getAlertStyles(alert.type)} className="alert-banner">
                        {/* Background pattern */}
                        <div style={getBackgroundPattern(alert.type)}></div>

                        {/* Content */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '16px',
                            flex: 1,
                            position: 'relative',
                            zIndex: 1
                        }}>
                            {/* Icon */}
                            <div style={{
                                padding: '6px 10px',
                                backgroundColor: 'rgba(0,0,0,0.05)',
                                borderRadius: '8px',
                                marginTop: '2px'
                            }}>
                                {getAlertIcon(alert.type)}
                            </div>

                            {/* Text content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                {/* Type badge and title */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: alert.title ? '8px' : '4px',
                                    flexWrap: 'wrap'
                                }}>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '3px 10px',
                                        backgroundColor: 'rgba(0,0,0,0.08)',
                                        borderRadius: '12px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        {getTypeLabel(alert.type)}
                                    </span>

                                    {alert.title && (
                                        <h3 style={{
                                            margin: 0,
                                            fontSize: '18px',
                                            fontWeight: '700',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                            {alert.title}
                                        </h3>
                                    )}
                                </div>

                                {/* Message */}
                                <div style={{
                                    fontSize: '16px',
                                    lineHeight: '1.6',
                                    fontWeight: '500',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                    wordBreak: 'break-word'
                                }}>
                                    {alert.message}
                                </div>

                                {/* Timestamp */}
                                {alert.createdAt && (
                                    <div style={{
                                        marginTop: '8px',
                                        fontSize: '13px',
                                        opacity: 0.8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <Clock size={14} />
                                        פורסם: {alert.createdAt.toDate().toLocaleDateString('he-IL', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dismiss button */}
                        <button
                            onClick={() => handleDismiss(alert.id)}
                            style={{
                                position: 'relative',
                                zIndex: 2,
                                backgroundColor: 'rgba(0,0,0,0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                padding: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                marginTop: '2px',
                                flexShrink: 0
                            }}
                            className="dismiss-button"
                            title="סגור הודעה"
                        >
                            <X size={20} style={{
                                color: 'currentColor',
                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                            }} />
                        </button>
                    </div>
                ))}
            </div>
        </>
    );
};

export default AlertBanner;