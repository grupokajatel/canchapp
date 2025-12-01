import { base44 } from "@/api/base44Client";

// Notification types and templates
const NOTIFICATION_TEMPLATES = {
  // User notifications
  reservation_confirmed: (data) => ({
    title: "¡Reserva Confirmada!",
    message: `Tu reserva en ${data.courtName} para el ${data.date} a las ${data.time} ha sido confirmada.`,
    type: "reservation_accepted"
  }),
  reservation_rejected: (data) => ({
    title: "Reserva Rechazada",
    message: `Tu reserva en ${data.courtName} para el ${data.date} no pudo ser confirmada.`,
    type: "reservation_rejected"
  }),
  reservation_reminder: (data) => ({
    title: "Recordatorio de Reserva",
    message: `Tu reserva en ${data.courtName} es mañana a las ${data.time}. ¡No olvides asistir!`,
    type: "reminder"
  }),
  payment_pending: (data) => ({
    title: "Pago Pendiente",
    message: `Tienes un pago pendiente de S/ ${data.amount} para tu reserva en ${data.courtName}.`,
    type: "payment_pending"
  }),
  
  // Owner notifications
  new_reservation: (data) => ({
    title: "Nueva Reserva",
    message: `${data.userName} ha reservado ${data.courtName} para el ${data.date} a las ${data.time}.`,
    type: "reservation_created"
  }),
  payment_received: (data) => ({
    title: "Pago Recibido",
    message: `Has recibido un pago de S/ ${data.amount} de ${data.userName} por ${data.courtName}.`,
    type: "payment_received"
  }),
  reservation_cancelled: (data) => ({
    title: "Reserva Cancelada",
    message: `${data.userName} ha cancelado su reserva en ${data.courtName} del ${data.date}.`,
    type: "reservation_cancelled"
  }),
  new_review: (data) => ({
    title: "Nueva Reseña",
    message: `${data.userName} ha dejado una reseña de ${data.rating} estrellas en ${data.courtName}.`,
    type: "review"
  })
};

export const NotificationService = {
  // Create notification for user
  async notifyUser(userId, userEmail, templateKey, data) {
    const template = NOTIFICATION_TEMPLATES[templateKey];
    if (!template) return null;

    const { title, message, type } = template(data);
    
    return base44.entities.Notification.create({
      user_id: userId,
      user_email: userEmail,
      title,
      message,
      type,
      reference_id: data.referenceId,
      reference_type: data.referenceType || "reservation",
      is_read: false
    });
  },

  // Create notification for owner
  async notifyOwner(ownerId, templateKey, data) {
    const template = NOTIFICATION_TEMPLATES[templateKey];
    if (!template) return null;

    const { title, message, type } = template(data);
    
    return base44.entities.Notification.create({
      owner_id: ownerId,
      title,
      message,
      type,
      reference_id: data.referenceId,
      reference_type: data.referenceType || "reservation",
      is_read: false
    });
  },

  // Batch notify (for reminders, etc.)
  async sendReminders(reservations) {
    const notifications = reservations.map(reservation => ({
      user_id: reservation.user_id,
      user_email: reservation.user_email,
      title: "Recordatorio de Reserva",
      message: `Tu reserva en ${reservation.court_name} es mañana a las ${reservation.start_hour}:00. ¡No olvides asistir!`,
      type: "reminder",
      reference_id: reservation.id,
      reference_type: "reservation",
      is_read: false
    }));

    return Promise.all(notifications.map(n => base44.entities.Notification.create(n)));
  }
};

export default NotificationService;