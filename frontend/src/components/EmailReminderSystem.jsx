// Updated EmailReminderSystem.jsx - Manual checking only (automatic is handled globally)

import React, { useState, useEffect } from 'react';
import { checkAndSendAllEmails } from '@/services/emailService';

// Email reminder system - now only for manual checking and display
const EmailReminderSystem = () => {
    const [isChecking, setIsChecking] = useState(false);
    const [lastCheck, setLastCheck] = useState(null);
    const [results, setResults] = useState(null);

    // Initialize with a manual check on component mount (for display purposes)
    useEffect(() => {
        checkReminders();
    }, []);

    // Manual check for reminder emails (triggered by UI)
    const checkReminders = async () => {
        setIsChecking(true);
        setResults(null);

        try {
            console.log('👤 Manual: Starting manual email check from history page...');
            const emailResults = await checkAndSendAllEmails();
            setResults(emailResults);

        } catch (error) {
            console.error('❌ Manual: Error in email check:', error);
            setResults({
                reminders: { sent: 0, alreadySent: 0, errors: [], skippedToday: 0 },
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
        checkReminders();
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
                background: 'linear-gradient(to right, #20b2aa, #48d1cc)',
                color: 'white',
                padding: '2rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                textAlign: 'center'
            }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem' }}>
                    🤖 מערכת תזכורות חכמה
                </h1>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                    תזכורות אוטומטיות גלובליות • אישורי איסוף ידניים • פעילה תמיד ברקע
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
                            background: isChecking ? '#9ca3af' : 'linear-gradient(45deg, #20b2aa, #48d1cc)',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            cursor: isChecking ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}
                    >
                        {isChecking ? '🔄 בודק...' : '🔍 בדוק תזכורות עכשיו'}
                    </button>
                </div>

                {/* Global Auto-Check Status */}
                <div style={{
                    background: 'linear-gradient(135deg, #f0fdfa, #ecfeff)',
                    border: '1px solid #5eead4',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>🌐</span>
                        <h3 style={{ margin: 0, color: '#0f766e' }}>בדיקה אוטומטית גלובלית</h3>
                    </div>
                    <p style={{
                        margin: 0,
                        color: '#0f766e',
                        fontSize: '0.9rem'
                    }}>
                        ✅ המערכת פועלת אוטומטית ברקע בכל דפי האתר (8:00-20:00, פעם ביום)
                    </p>
                    <p style={{
                        margin: '0.5rem 0 0 0',
                        color: '#0f766e',
                        fontSize: '0.8rem',
                        fontStyle: 'italic'
                    }}>
                        💡 אין צורך לבקר בעמוד זה כדי לשלוח תזכורות - הן נשלחות אוטומטית!
                    </p>
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
                        <strong>בדיקה אחרונה (ידנית):</strong> {lastCheck.toLocaleString('he-IL')}
                    </div>
                )}

                {/* Results */}
                {results && (
                    <div style={{
                        background: results.totalErrors > 0 ? '#fef2f2' :
                            results.weekend ? '#f0f9ff' : 'linear-gradient(135deg, #f0fdfa, #ecfeff)',
                        border: `1px solid ${results.totalErrors > 0 ? '#fecaca' :
                            results.weekend ? '#7dd3fc' : '#5eead4'}`,
                        borderRadius: '8px',
                        padding: '1.5rem'
                    }}>
                        <h3 style={{
                            margin: '0 0 1rem 0',
                            color: results.totalErrors > 0 ? '#dc2626' :
                                results.weekend ? '#0369a1' : '#0f766e'
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
                                    תזכורות שאמורות להישלח היום יישלחו ביום ראשון
                                </p>
                            </div>
                        )}

                        {/* Reminder Stats - only show if not weekend */}
                        {!results.weekend && (
                            <div style={{
                                background: 'linear-gradient(135deg, #f0fdfa, #ecfeff)',
                                padding: '1.5rem',
                                borderRadius: '8px',
                                border: '1px solid #5eead4',
                                marginBottom: '1rem'
                            }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: '#0f766e' }}>
                                    ⏰ תזכורות החזרה (2 ימים לפני)
                                </h4>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                                    gap: '1rem',
                                    textAlign: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                            {results.totalFound || 0}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>נמצאו</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                                            {results.reminders?.sent || 0}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>נשלחו</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6b7280' }}>
                                            {results.reminders?.alreadySent || 0}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>כבר נשלחו</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                            {results.reminders?.skippedToday || 0}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>דולגו היום</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                                            {results.reminders?.errors?.length || 0}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>שגיאות</div>
                                    </div>
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
                                {(results.reminders?.errors || []).map((error, index) => (
                                    <div key={index} style={{
                                        fontSize: '0.875rem',
                                        color: '#7f1d1d',
                                        marginBottom: '0.25rem'
                                    }}>
                                        <strong>[תזכורת]</strong> {error.clientName ? `${error.clientName} (${error.email})` : 'שגיאה כללית'}: {error.error}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div style={{
                background: '#fdf2f8',
                border: '1px solid #f8b2dd',
                borderRadius: '12px',
                padding: '2rem'
            }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#be185d' }}>
                    🔧 איך המערכת החכמה עובדת
                </h3>
                <ul style={{ color: '#be185d', paddingRight: '1.5rem' }}>
                    <li><strong>🌐 בדיקה אוטומטית גלובלית:</strong> המערכת פועלת ברקע בכל דפי האתר (8:00-20:00)</li>
                    <li><strong>📧 תזכורות החזרה:</strong> נשלחים אוטומטית 2 ימים לפני תאריך ההחזרה</li>
                    <li><strong>📦 אישורי איסוף:</strong> נשלחים רק ידנית על ידי לחיצה על הכפתור במערכת הזמנות</li>
                    <li><strong>🔒 מניעת כפילויות:</strong> המערכת מונעת שליחת אימיילים כפולים</li>
                    <li><strong>🕊️ מטעמים דתיים:</strong> לא נשלחים אימיילים בימי שישי ושבת</li>
                    <li><strong>👤 בדיקה ידנית:</strong> ניתן להפעיל בדיקה ידנית בכל עת באמצעות הכפתור למעלה</li>
                    <li><strong>📊 מעקב מלא:</strong> כל האימיילים נרשמים במסד הנתונים למעקב</li>
                </ul>

                <div style={{
                    background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
                    border: '1px solid #f8b2dd',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginTop: '1rem'
                }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#be185d' }}>
                        🎯 המערכת החדשה - פועלת בכל מקום!
                    </h4>
                    <p style={{ margin: 0, color: '#be185d', fontSize: '0.9rem' }}>
                        ✅ <strong>אוטומטית באמת</strong> - עובדת בכל דף באתר<br />
                        ✅ <strong>אין צורך לבקר כאן</strong> - תזכורות נשלחות בכל מקרה<br />
                        ✅ <strong>פעם ביום בלבד</strong> - מונעת כפילויות<br />
                        ✅ <strong>פועלת ברקע</strong> - בשקט ובדיסקרטיות
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmailReminderSystem;