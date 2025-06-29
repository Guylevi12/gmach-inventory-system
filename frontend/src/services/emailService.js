// src/services/emailService.js
// Automated Pickup Confirmation Email Service (same pattern as reminder emails)

import { updateDoc, doc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_CONFIG = {
    serviceId: 'service_zbzqfa3',
    reminderTemplateId: 'template_02cqfdn',
    confirmationTemplateId: 'template_lv2sc1p',
    publicKey: 'gJHtAe_l22dY8tKju'
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

// Helper function to format date
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
};

// Send pickup confirmation email (automated - called by daily check)
export const sendPickupConfirmationEmail = async (order, orderId) => {
    try {
        console.log(`📧 Sending pickup confirmation for order ${orderId}`);

        const templateParams = {
            to_email: order.email,
            to_name: order.clientName,
            client_name: order.clientName,
            pickup_date: formatDate(order.pickupDate),
            return_date: formatDate(order.returnDate),
            volunteer_name: order.volunteerName || 'צוות הארגון',
            volunteer_phone: '054-2575886', // Your fixed phone number
            organization_name: 'גמח שמחת זקנתי',
            items_list: order.items?.map(item =>
                `• ${item.name} - כמות: ${item.quantity}`
            ).join('\n') || 'לא צוינו פריטים',
            total_items: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
            event_type: order.eventType || 'כללי',
            order_id: orderId,
            pickup_location: order.pickupLocation || 'מיקום לפי תיאום',
            special_instructions: order.specialInstructions || 'אין הוראות מיוחדות'
        };

        const result = await emailjs.send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.confirmationTemplateId,
            templateParams
        );

        console.log(`✅ Pickup confirmation email sent successfully:`, result);

        // Mark confirmation email as sent in database
        await updateDoc(doc(db, 'orders', orderId), {
            confirmationEmailSent: true,
            confirmationEmailSentAt: Timestamp.now(),
            confirmationEmailResult: {
                status: result.status,
                text: result.text,
                sentAt: new Date().toISOString()
            }
        });

        return { success: true, result };

    } catch (error) {
        console.error(`❌ Failed to send pickup confirmation for order ${orderId}:`, error);
        return { success: false, error: error.message };
    }
};

// Send reminder email (existing function, unchanged)
export const sendReminderEmail = async (order, orderId) => {
    try {
        console.log(`📧 Sending reminder email for order ${orderId}`);

        const templateParams = {
            to_email: order.email,
            to_name: order.clientName,
            client_name: order.clientName,
            return_date: formatDate(order.returnDate),
            volunteer_name: order.volunteerName || 'צוות הארגון',
            volunteer_phone: '054-2575886',
            organization_name: 'גמח שמחת זקנתי',
            items_list: order.items?.map(item =>
                `• ${item.name} - כמות: ${item.quantity}`
            ).join('\n') || 'לא צוינו פריטים',
            total_items: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
            event_type: order.eventType || 'כללי',
            pickup_date: formatDate(order.pickupDate),
            order_id: orderId
        };

        const result = await emailjs.send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.reminderTemplateId,
            templateParams
        );

        console.log(`✅ Reminder email sent successfully:`, result);

        await updateDoc(doc(db, 'orders', orderId), {
            reminderSent: true,
            reminderSentAt: Timestamp.now(),
            emailSentResult: {
                status: result.status,
                text: result.text,
                sentAt: new Date().toISOString()
            }
        });

        return { success: true, result };

    } catch (error) {
        console.error(`❌ Failed to send reminder for order ${orderId}:`, error);
        return { success: false, error: error.message };
    }
};

// Main function: Check and send both pickup confirmations AND reminders
export const checkAndSendAllEmails = async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(today.getDate() + 2);
    const reminderDateStr = twoDaysFromNow.toISOString().split('T')[0];

    console.log(`📅 Checking emails for pickup date: ${todayStr} and reminder date: ${reminderDateStr}`);

    const results = {
        pickupConfirmations: { sent: 0, alreadySent: 0, errors: [] },
        reminders: { sent: 0, alreadySent: 0, errors: [] },
        totalFound: 0
    };

    try {
        // 1. Check for pickup confirmation emails (orders with pickup date = today)
        console.log('🔍 Checking for pickup confirmations...');
        const pickupQuery = query(
            collection(db, 'orders'),
            where('status', 'in', ['open', 'confirmed', 'approved', 'active']),
            where('pickupDate', '==', todayStr)
        );

        const pickupSnapshot = await getDocs(pickupQuery);
        results.totalFound += pickupSnapshot.size;

        for (const orderDoc of pickupSnapshot.docs) {
            const order = orderDoc.data();
            const orderId = orderDoc.id;

            if (!order.confirmationEmailSent) {
                const result = await sendPickupConfirmationEmail(order, orderId);
                if (result.success) {
                    results.pickupConfirmations.sent++;
                } else {
                    results.pickupConfirmations.errors.push({
                        orderId,
                        email: order.email,
                        clientName: order.clientName,
                        error: result.error
                    });
                }
            } else {
                results.pickupConfirmations.alreadySent++;
            }
        }

        // 2. Check for reminder emails (existing logic)
        console.log('🔍 Checking for reminders...');
        const reminderQuery = query(
            collection(db, 'orders'),
            where('status', 'in', ['active', 'confirmed', 'picked_up', 'open']),
            where('returnDate', '==', reminderDateStr)
        );

        const reminderSnapshot = await getDocs(reminderQuery);
        results.totalFound += reminderSnapshot.size;

        for (const orderDoc of reminderSnapshot.docs) {
            const order = orderDoc.data();
            const orderId = orderDoc.id;

            if (!order.reminderSent) {
                const result = await sendReminderEmail(order, orderId);
                if (result.success) {
                    results.reminders.sent++;
                } else {
                    results.reminders.errors.push({
                        orderId,
                        email: order.email,
                        clientName: order.clientName,
                        error: result.error
                    });
                }
            } else {
                results.reminders.alreadySent++;
            }
        }

        const totalSent = results.pickupConfirmations.sent + results.reminders.sent;
        const totalErrors = results.pickupConfirmations.errors.length + results.reminders.errors.length;

        console.log(`📊 Email check results:`, {
            pickupConfirmations: results.pickupConfirmations,
            reminders: results.reminders,
            totalSent,
            totalErrors
        });

        return {
            ...results,
            totalSent,
            totalErrors,
            message: totalSent > 0 ?
                `בדיקה הושלמה: ${totalSent} אימיילים נשלחו` :
                'לא נמצאו אימיילים לשליחה היום'
        };

    } catch (error) {
        console.error('❌ Error in email check:', error);
        return {
            pickupConfirmations: { sent: 0, alreadySent: 0, errors: [] },
            reminders: { sent: 0, alreadySent: 0, errors: [] },
            totalFound: 0,
            totalSent: 0,
            totalErrors: 1,
            errors: [{ error: error.message }],
            message: 'שגיאה בבדיקת אימיילים'
        };
    }
};