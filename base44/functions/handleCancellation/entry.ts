import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reservation_id, cancelled_by } = await req.json();

    // Get reservation
    const reservation = await base44.asServiceRole.entities.Reservation.get(reservation_id);
    if (!reservation) {
      return Response.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Get payment
    const payments = await base44.asServiceRole.entities.Payment.filter({ reservation_id });
    const payment = payments[0];

    // Calculate hours until reservation
    const reservationDateTime = new Date(`${reservation.date}T${String(reservation.start_hour).padStart(2, '0')}:00:00`);
    const now = new Date();
    const hoursUntil = (reservationDateTime - now) / (1000 * 60 * 60);

    let refundPercentage = 0;
    let commissionRate = 0;

    if (cancelled_by === 'owner') {
      // Owner cancellation - full refund + penalty
      refundPercentage = 1.0;
      commissionRate = 0;
      
      // TODO: Apply penalty to owner
    } else if (cancelled_by === 'user') {
      if (hoursUntil > 48) {
        refundPercentage = 1.0;
        commissionRate = 0;
      } else if (hoursUntil >= 24) {
        refundPercentage = 0.5;
        commissionRate = 0.05;
      } else {
        refundPercentage = 0;
        commissionRate = 0.10;
      }
    }

    const refundAmount = Math.round(reservation.total_price * refundPercentage * 100) / 100;
    const commissionAmount = Math.round(reservation.total_price * commissionRate * 100) / 100;

    // Update payment
    if (payment) {
      await base44.asServiceRole.entities.Payment.update(payment.id, {
        status: refundPercentage > 0 ? 'refunded' : 'completed'
      });
    }

    // Update or create commission
    const commissions = await base44.asServiceRole.entities.Commission.filter({ reservation_id });
    
    if (commissions[0]) {
      await base44.asServiceRole.entities.Commission.update(commissions[0].id, {
        status: 'cancelled',
        commission_amount: commissionAmount,
        owner_payout: reservation.total_price - commissionAmount - refundAmount
      });
    }

    // Update reservation
    await base44.asServiceRole.entities.Reservation.update(reservation_id, {
      status: 'cancelled'
    });

    // Send notifications
    await base44.asServiceRole.entities.Notification.create({
      user_id: reservation.user_id,
      user_email: reservation.user_name,
      title: 'Reserva cancelada',
      message: refundAmount > 0 
        ? `Se reembolsará S/ ${refundAmount} a tu método de pago.`
        : 'Tu reserva ha sido cancelada. No se procesará reembolso según la política de cancelación.',
      type: 'reservation_cancelled',
      reference_id: reservation_id,
      reference_type: 'reservation'
    });

    return Response.json({
      success: true,
      refund_amount: refundAmount,
      commission_amount: commissionAmount,
      policy_applied: {
        hours_until: hoursUntil,
        refund_percentage: refundPercentage,
        commission_rate: commissionRate
      }
    });

  } catch (error) {
    console.error('Error handling cancellation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});