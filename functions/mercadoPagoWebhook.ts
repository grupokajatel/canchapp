import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get notification from Mercado Pago
    const notification = await req.json();
    
    console.log('MercadoPago webhook received:', notification);

    // Only process payment notifications
    if (notification.type !== 'payment') {
      return Response.json({ received: true });
    }

    // Get payment info from Mercado Pago
    const paymentId = notification.data.id;
    
    // Find payment config to get access token
    const payments = await base44.asServiceRole.entities.Payment.filter({ 
      status: 'pending',
      payment_method: 'mercadopago'
    });

    if (payments.length === 0) {
      return Response.json({ received: true });
    }

    // Get owner's payment config (assuming all use same for now)
    const payment = payments[0];
    const paymentConfigs = await base44.asServiceRole.entities.PaymentConfig.filter({ 
      owner_id: payment.owner_id 
    });
    const paymentConfig = paymentConfigs[0];

    if (!paymentConfig?.mercadopago_access_token) {
      console.error('No payment config found');
      return Response.json({ error: 'Config not found' }, { status: 400 });
    }

    // Get payment details from MercadoPago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${paymentConfig.mercadopago_access_token}`
      }
    });

    if (!mpResponse.ok) {
      console.error('Error fetching payment from MercadoPago');
      return Response.json({ error: 'Error fetching payment' }, { status: 500 });
    }

    const mpPayment = await mpResponse.json();
    const reservationId = mpPayment.external_reference;

    // Find our payment record
    const ourPayments = await base44.asServiceRole.entities.Payment.filter({ 
      reservation_id: reservationId,
      payment_method: 'mercadopago'
    });

    if (ourPayments.length === 0) {
      console.error('Payment not found for reservation:', reservationId);
      return Response.json({ error: 'Payment not found' }, { status: 404 });
    }

    const ourPayment = ourPayments[0];

    // Update payment status based on MercadoPago status
    let paymentStatus = 'pending';
    let reservationStatus = null;

    if (mpPayment.status === 'approved') {
      paymentStatus = 'completed';
      reservationStatus = 'accepted';
    } else if (mpPayment.status === 'rejected' || mpPayment.status === 'cancelled') {
      paymentStatus = 'failed';
    }

    // Update payment
    await base44.asServiceRole.entities.Payment.update(ourPayment.id, {
      status: paymentStatus,
      transaction_id: mpPayment.id.toString()
    });

    // Update reservation if payment approved
    if (reservationStatus) {
      await base44.asServiceRole.entities.Reservation.update(reservationId, {
        status: reservationStatus,
        payment_method: 'mercadopago'
      });

      // Send notification to user
      const reservation = await base44.asServiceRole.entities.Reservation.get(reservationId);
      await base44.asServiceRole.entities.Notification.create({
        user_id: reservation.user_id,
        user_email: reservation.user_name,
        title: '¡Pago confirmado!',
        message: `Tu pago de S/ ${reservation.total_price} para ${reservation.court_name} ha sido confirmado.`,
        type: 'reservation_accepted',
        reference_id: reservationId,
        reference_type: 'reservation'
      });

      // Notify owner
      await base44.asServiceRole.entities.Notification.create({
        owner_id: reservation.owner_id,
        title: 'Nuevo pago recibido',
        message: `Pago de S/ ${reservation.total_price} confirmado para ${reservation.court_name}`,
        type: 'reservation_accepted',
        reference_id: reservationId,
        reference_type: 'reservation'
      });
    }

    return Response.json({ received: true, status: paymentStatus });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});