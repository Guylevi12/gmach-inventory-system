// Updated EmailReminderSystem.jsx - Now handles both reminders AND pickup confirmations
// Replace your existing EmailReminderSystem.jsx with this

import React, { useState, useEffect } from 'react';
import { checkAndSendAllEmails } from '@/services/emailService';

// Email reminder + pickup confirmation system component
const EmailReminderSystem = () => {
    const [isChecking, setIsChecking] = useState(false);
    const [lastCheck, setLastCheck] = useState(null);
    const [results, setResults] = useState(null);

    // Initialize and set up daily checks
    useEffect(() => {
        // Auto-check on component mount
        checkAllEmails();

        // Set up daily check (run every hour, but only send once per day)
        const interval = setInterval(() => {
            const now = new Date();
            const hour = now.getHours();

            // Run at 9 AM Israeli time
            if (hour === 9) {
                checkAllEmails();
            }
        }, 60 * 60 * 1000); // Check every hour

        return () => clearInterval(interval);
    }, []);

    // Check for all email types (pickup confirmations + reminders)
    const checkAllEmails = async () => {
        setIsChecking(true);
        setResults(null);

        try {
            console.log('📧 Starting email check for pickup confirmations and reminders...');
            const emailResults = await checkAndSendAllEmails();
            setResults(emailResults);

        } catch (error) {
            console.error('❌ Error in email check:', error);
            setResults({
                pickupConfirmations: { sent: 0, alreadySent: 0, errors: [] },
                reminders: { sent: 0, alreadySent: 0, errors: [] },
                totalFound: 0,
                totalSent: 0,
                totalErrors: 1,
                errors: [{ error: error.message }],
                message: 'שגיאה בבדיקת אימיילים'
            });
        } finally {
            setIsChecking(false);
            setLastCheck(new Date());
        }
    };

    // Manual trigger for testing
    const handleManualCheck = () => {
        checkAllEmails();
    };

    return (
        <div style={{
            padding: '2rem',
            maxWidth: '900px',
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif'
        }} dir="rtl">

            {/* Header */}
            <div style={{
                background: 'linear-gradient(to right, #3b82f6, #1e40af)',
                color: 'white',
                padding: '2rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                textAlign: 'center'
            }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem' }}>
                    📧 מערכת אימיילים אוטומטית
                </h1>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                    אישורי איסוף (יום האיסוף) • תזכורות החזרה (2 ימים לפני)
                </p>
            </div>

            {/* Status Card */}
            <div style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <h2 style={{ margin: 0, color: '#1f2937' }}>סטטוס המערכת</h2>
                    <button
                        onClick={handleManualCheck}
                        disabled={isChecking}
                        style={{
                            background: isChecking ? '#9ca3af' : '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            cursor: isChecking ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}
                    >
                        {isChecking ? '🔄 בודק...' : '🔍 בדוק אימיילים'}
                    </button>
                </div>

                {/* Last Check Info */}
                {lastCheck && (
                    <div style={{
                        background: '#f3f4f6',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        fontSize: '0.9rem',
                        color: '#6b7280'
                    }}>
                        <strong>בדיקה אחרונה:</strong> {lastCheck.toLocaleString('he-IL')}
                    </div>
                )}

                {/* Results */}
                {results && (
                    <div style={{
                        background: results.totalErrors > 0 ? '#fef2f2' :
                            results.weekend ? '#f0f9ff' : '#f0fdf4',
                        border: `1px solid ${results.totalErrors > 0 ? '#fecaca' :
                            results.weekend ? '#7dd3fc' : '#bbf7d0'}`,
                        borderRadius: '8px',
                        padding: '1.5rem'
                    }}>
                        <h3 style={{
                            margin: '0 0 1rem 0',
                            color: results.totalErrors > 0 ? '#dc2626' :
                                results.weekend ? '#0369a1' : '#059669'
                        }}>
                            {results.message}
                        </h3>

                        {/* Weekend Notice */}
                        {results.weekend && (
                            <div style={{
                                background: '#e0f2fe',
                                border: '1px solid #0284c7',
                                borderRadius: '8px',
                                padding: '1rem',
                                marginBottom: '1rem',
                                textAlign: 'center'
                            }}>
                                <p style={{ margin: 0, color: '#0369a1', fontWeight: 'bold' }}>
                                    🕊️ המערכת לא שולחת אימיילים בימי שישי ושבת מטעמים דתיים
                                </p>
                                <p style={{ margin: '0.5rem 0 0 0', color: '#0369a1', fontSize: '0.9rem' }}>
                                    אימיילים שאמורים להישלח היום יישלחו ביום ראשון
                                </p>
                            </div>
                        )}

                        {/* Email Type Stats - only show if not weekend */}
                        {!results.weekend && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                gap: '1rem',
                                marginBottom: '1rem'
                            }}>
                                {/* Pickup Confirmation Emails */}
                                <div style={{
                                    background: 'white',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#059669' }}>
                                        📦 אישורי איסוף (יום האיסוף)
                                    </h4>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        נשלחו: <strong>{results.pickupConfirmations?.sent || 0}</strong><br />
                                        כבר נשלחו: <strong>{results.pickupConfirmations?.alreadySent || 0}</strong><br />
                                        שגיאות: <strong style={{ color: results.pickupConfirmations?.errors?.length > 0 ? '#dc2626' : 'inherit' }}>
                                            {results.pickupConfirmations?.errors?.length || 0}
                                        </strong>
                                    </div>
                                </div>

                                {/* Reminder Emails */}
                                <div style={{
                                    background: 'white',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b' }}>
                                        ⏰ תזכורות החזרה (2 ימים לפני)
                                    </h4>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        נשלחו: <strong>{results.reminders?.sent || 0}</strong><br />
                                        כבר נשלחו: <strong>{results.reminders?.alreadySent || 0}</strong><br />
                                        שגיאות: <strong style={{ color: results.reminders?.errors?.length > 0 ? '#dc2626' : 'inherit' }}>
                                            {results.reminders?.errors?.length || 0}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Overall Stats - only show if not weekend */}
                        {!results.weekend && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                                gap: '1rem',
                                marginBottom: '1rem'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                        {results.totalFound || 0}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>נמצאו</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                                        {results.totalSent || 0}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>נשלחו</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                                        {results.totalErrors || 0}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>שגיאות</div>
                                </div>
                            </div>
                        )}

                        {/* Error Details - only show if not weekend and there are errors */}
                        {!results.weekend && results.totalErrors > 0 && (
                            <div style={{
                                background: 'white',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                padding: '1rem'
                            }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#dc2626' }}>שגיאות:</h4>
                                {[
                                    ...(results.pickupConfirmations?.errors || []).map(e => ({ ...e, type: 'אישור איסוף' })),
                                    ...(results.reminders?.errors || []).map(e => ({ ...e, type: 'תזכורת' }))
                                ].map((error, index) => (
                                    <div key={index} style={{
                                        fontSize: '0.875rem',
                                        color: '#7f1d1d',
                                        marginBottom: '0.25rem'
                                    }}>
                                        <strong>[{error.type}]</strong> {error.clientName ? `${error.clientName} (${error.email})` : 'שגיאה כללית'}: {error.error}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div style={{
                background: '#fffbeb',
                border: '1px solid #fed7aa',
                borderRadius: '12px',
                padding: '2rem'
            }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#92400e' }}>
                    🔧 איך המערכת עובדת
                </h3>
                <ul style={{ color: '#92400e', paddingRight: '1.5rem' }}>
                    <li><strong>אישורי איסוף:</strong> נשלחים אוטומטית ביום האיסוף (היום הירוק בלוח השנה)</li>
                    <li><strong>תזכורות החזרה:</strong> נשלחים אוטומטית 2 ימים לפני תאריך ההחזרה</li>
                    <li><strong>בדיקה יומית:</strong> המערכת בודקת אוטומטית כל יום ב-9:00 בבוקר (מלבד שישי ושבת)</li>
                    <li><strong>מטעמים דתיים:</strong> לא נשלחים אימיילים בימי שישי ושבת</li>
                    <li><strong>מניעת כפילויות:</strong> כל אימייל נשלח רק פעם אחת לכל הזמנה</li>
                    <li><strong>בדיקה ידנית:</strong> ניתן להפעיל בדיקה ידנית בכל עת באמצעות הכפתור למעלה</li>
                    <li><strong>מעקב מלא:</strong> כל האימיילים נרשמים במסד הנתונים למעקב</li>
                </ul>
            </div>
        </div>
    );
};

export default EmailReminderSystem;