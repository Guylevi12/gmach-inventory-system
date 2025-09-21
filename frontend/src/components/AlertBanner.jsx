// src/components/AlertBanner.jsx - Dynamic design with better mobile handling
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { AlertTriangle, Info, CheckCircle, X, Bell, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const AlertBanner = () => {
    const [alerts, setAlerts] = useState([]);
    const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [maxVisibleAlerts, setMaxVisibleAlerts] = useState(3);

    useEffect(() => {
        // Load dismissed alerts from sessionStorage (not localStorage)
        const dismissed = sessionStorage.getItem('dismissedAlerts');
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

                // Only show active alerts that haven't expired
                if (alert.isActive) {
                    // Check if alert has expired
                    if (alert.expirationDate) {
                        const now = new Date();
                        const expirationDate = alert.expirationDate.toDate ? alert.expirationDate.toDate() : new Date(alert.expirationDate);

                        if (now <= expirationDate) {
                            activeAlerts.push(alert);
                        }
                    } else {
                        // No expiration date, show the alert
                        activeAlerts.push(alert);
                    }
                }
            });

            setAlerts(activeAlerts);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Adjust max visible alerts based on screen size
    useEffect(() => {
        const updateMaxAlerts = () => {
            const isMobile = window.innerWidth <= 768;
            setMaxVisibleAlerts(isMobile ? 2 : 3);
        };

        updateMaxAlerts();
        window.addEventListener('resize', updateMaxAlerts);
        return () => window.removeEventListener('resize', updateMaxAlerts);
    }, []);

    const handleDismiss = (alertId) => {
        const newDismissed = new Set([...dismissedAlerts, alertId]);
        setDismissedAlerts(newDismissed);
        sessionStorage.setItem('dismissedAlerts', JSON.stringify([...newDismissed]));
    };

    const handleRestoreDismissed = () => {
        setDismissedAlerts(new Set());
        sessionStorage.removeItem('dismissedAlerts');
    };

    const getAlertIcon = (type) => {
        const iconStyle = {
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
            flexShrink: 0
        };

        switch (type) {
            case 'warning':
                return <AlertTriangle size={20} style={{ ...iconStyle, color: '#d97706' }} />;
            case 'success':
                return <CheckCircle size={20} style={{ ...iconStyle, color: '#059669' }} />;
            case 'info':
                return <Info size={20} style={{ ...iconStyle, color: '#2563eb' }} />;
            default:
                return <Bell size={20} style={{ ...iconStyle, color: '#6b7280' }} />;
        }
    };

    const getAlertStyles = (type, isCompact = false) => {
        const baseStyles = {
            position: 'relative',
            padding: isCompact ? '12px 16px' : '16px 20px',
            marginBottom: '8px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            direction: 'rtl',
            fontFamily: '"Assistant", "Heebo", system-ui, sans-serif',
            fontSize: isCompact ? '14px' : '15px',
            fontWeight: '500',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
            cursor: 'default'
        };

        const typeStyles = {
            warning: {
                background: 'rgba(255, 255, 255, 0.98)',
                color: '#b45309',
                borderLeft: '3px solid #f59e0b'
            },
            success: {
                background: 'rgba(255, 255, 255, 0.98)',
                color: '#047857',
                borderLeft: '3px solid #10b981'
            },
            info: {
                background: 'rgba(255, 255, 255, 0.98)',
                color: '#1d4ed8',
                borderLeft: '3px solid #3b82f6'
            },
            default: {
                background: 'rgba(255, 255, 255, 0.98)',
                color: '#374151',
                borderLeft: '3px solid #6b7280'
            }
        };

        return {
            ...baseStyles,
            ...typeStyles[type] || typeStyles.default
        };
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'warning': return 'חשוב';
            case 'success': return 'עדכון';
            case 'info': return 'מידע';
            default: return 'הודעה';
        }
    };

    // Filter out dismissed alerts
    const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));
    const dismissedCount = alerts.length - visibleAlerts.length;

    // Don't render anything while loading to prevent stutter
    if (loading) {
        return (
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 500,
                height: '0px',
                overflow: 'hidden'
            }} />
        );
    }

    // If no alerts are visible but some are dismissed, show restore button
    if (visibleAlerts.length === 0 && dismissedCount > 0) {
        return (
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 500,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '8px 16px',
                borderBottom: '1px solid rgba(0,0,0,0.08)',
                textAlign: 'center'
            }}>
                <button
                    onClick={handleRestoreDismissed}
                    style={{
                        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        margin: '0 auto',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                    onMouseOver={(e) => {
                        e.target.style.background = 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)';
                        e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.background = 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
                        e.target.style.transform = 'translateY(0)';
                    }}
                >
                    <Bell size={14} />
                    הצג {dismissedCount} הודע{dismissedCount === 1 ? 'ה' : 'ות'} שהוסתר{dismissedCount === 1 ? 'ה' : 'ו'}
                </button>
            </div>
        );
    }

    if (visibleAlerts.length === 0) {
        return null;
    }

    const displayedAlerts = isCollapsed ? visibleAlerts.slice(0, maxVisibleAlerts) : visibleAlerts;
    const hasMoreAlerts = visibleAlerts.length > maxVisibleAlerts;
    const shouldShowHeader = hasMoreAlerts || dismissedCount > 0;

    return (
        <>
            <style jsx>{`
                .alert-container {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .alert-banner:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
                }
                
                .dismiss-button:hover {
                    background-color: rgba(0,0,0,0.15) !important;
                }
                
                .collapse-button:hover {
                    background-color: rgba(59, 130, 246, 0.1) !important;
                }
                
                /* Mobile optimizations */
                @media (max-width: 768px) {
                    .alert-banner:hover {
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
                    }
                }
            `}</style>

            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 500,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '12px 16px 8px 16px',
                borderBottom: '1px solid rgba(0,0,0,0.08)',
                maxHeight: '50vh',
                overflowY: hasMoreAlerts && !isCollapsed ? 'auto' : 'visible'
            }} className="alert-container">

                {/* Header with controls - show when there are dismissed alerts OR many visible alerts */}
                {shouldShowHeader && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                        padding: '8px 12px',
                        background: 'rgba(59, 130, 246, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(59, 130, 246, 0.1)'
                    }}>
                        <div style={{
                            fontSize: '13px',
                            color: '#2563eb',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <Bell size={14} />
                            {visibleAlerts.length} הודעות חדשות
                            {dismissedCount > 0 && (
                                <span style={{
                                    fontSize: '11px',
                                    color: '#6b7280',
                                    fontWeight: '400'
                                }}>
                                    • {dismissedCount} מוסתר{dismissedCount === 1 ? 'ת' : 'ות'}
                                </span>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {/* Always show restore dismissed button when there are dismissed alerts */}
                            {dismissedCount > 0 && (
                                <button
                                    onClick={handleRestoreDismissed}
                                    style={{
                                        background: 'none',
                                        border: '1px solid rgba(59, 130, 246, 0.2)',
                                        color: '#2563eb',
                                        cursor: 'pointer',
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                    }}
                                    title={`הצג ${dismissedCount} הודעות שהוסתרו`}
                                >
                                    הצג מוסתר ({dismissedCount})
                                </button>
                            )}

                            {/* Always show collapse toggle when there are many alerts */}
                            {hasMoreAlerts && (
                                <button
                                    onClick={() => setIsCollapsed(!isCollapsed)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#2563eb',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        transition: 'background-color 0.2s ease',
                                        whiteSpace: 'nowrap'
                                    }}
                                    className="collapse-button"
                                >
                                    {isCollapsed ? (
                                        <>
                                            הצג הכל
                                            <ChevronDown size={14} />
                                        </>
                                    ) : (
                                        <>
                                            צמצם
                                            <ChevronUp size={14} />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Alerts list */}
                {displayedAlerts.map((alert, index) => {
                    const isCompact = hasMoreAlerts && index >= maxVisibleAlerts - 1;

                    return (
                        <div key={alert.id} style={getAlertStyles(alert.type, isCompact)} className="alert-banner">

                            {/* Content */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                                flex: 1,
                                minWidth: 0
                            }}>
                                {/* Icon */}
                                <div style={{
                                    padding: '4px 6px',
                                    backgroundColor: 'rgba(0,0,0,0.04)',
                                    borderRadius: '6px',
                                    marginTop: '1px'
                                }}>
                                    {getAlertIcon(alert.type)}
                                </div>

                                {/* Text content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {/* Type badge and title */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: alert.title ? '6px' : '2px',
                                        flexWrap: 'wrap'
                                    }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            backgroundColor: 'rgba(0,0,0,0.06)',
                                            borderRadius: '10px',
                                            fontSize: '10px',
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.3px'
                                        }}>
                                            {getTypeLabel(alert.type)}
                                        </span>

                                        {alert.title && (
                                            <h3 style={{
                                                margin: 0,
                                                fontSize: isCompact ? '15px' : '16px',
                                                fontWeight: '600',
                                                lineHeight: '1.2'
                                            }}>
                                                {alert.title}
                                            </h3>
                                        )}
                                    </div>

                                    {/* Message */}
                                    <div style={{
                                        fontSize: isCompact ? '13px' : '14px',
                                        lineHeight: '1.4',
                                        fontWeight: '500',
                                        wordBreak: 'break-word',
                                        color: 'inherit'
                                    }}>
                                        {alert.message}
                                    </div>

                                    {/* Timestamp - only show on non-compact alerts */}
                                    {!isCompact && alert.createdAt && (
                                        <div style={{
                                            marginTop: '6px',
                                            fontSize: '11px',
                                            opacity: 0.7,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <Clock size={11} />
                                            {alert.createdAt.toDate().toLocaleDateString('he-IL', {
                                                month: 'short',
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
                                    backgroundColor: 'rgba(0,0,0,0.08)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    padding: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background-color 0.2s ease',
                                    marginTop: '1px',
                                    flexShrink: 0
                                }}
                                className="dismiss-button"
                                title="סגור הודעה"
                            >
                                <X size={16} style={{ color: 'currentColor' }} />
                            </button>
                        </div>
                    );
                })}

                {/* Show count when collapsed */}
                {isCollapsed && hasMoreAlerts && (
                    <div style={{
                        textAlign: 'center',
                        padding: '8px',
                        fontSize: '12px',
                        color: '#6b7280',
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        borderRadius: '6px',
                        marginTop: '4px'
                    }}>
                        ועוד {visibleAlerts.length - maxVisibleAlerts} הודעות...
                    </div>
                )}
            </div>
        </>
    );
};

export default AlertBanner;