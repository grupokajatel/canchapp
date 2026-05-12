import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { reservation_id, owner_id } = await req.json();

    // Get payment config
    const paymentConfigs = await base44.asServiceRole.entities.PaymentConfig.filter({ owner_id });
    const paymentConfig = paymentConfigs[0];

    if (!paymentConfig || !paymentConfig.mercadopago_enabled) {
      return Response.json({ error: 'Mercado Pago no está configurado' }, { status: 400 });
    }

    // Get reservation details
    const reservation = await base44.asServiceRole.entities.Reservation.get(reservation_id);
    if (!reservation) {
      return Response.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    // Create Mercado Pago preference
    const preferenceData = {
      items: [
        {
          title: `Reserva: ${reservation.court_name}`,
          description: `Fecha: ${reservation.date} - ${reservation.start_hour}:00`,
          quantity: 1,
          unit_price: parseFloat(reservation.total_price),
          currency_id: 'PEN'
        }
      ],
      payer: {
        name: user.full_name,
        email: user.email,
        phone: {
          number: reservation.user_phone || ''
        }
      },
      back_urls: {
        success: `${req.headers.get('origin')}/reservations?payment_success=true&reservation_id=${reservation_id}`,
        failure: `${req.headers.get('origin')}/reservations?payment_failed=true`,
        pending: `${req.headers.get('origin')}/reservations?payment_pending=true`
      },
      auto_return: 'approved',
      external_reference: reservation_id,
      notification_url: `${req.headers.get('origin')}/api/mercadopago-webhook`,
      statement_descriptor: 'CanchApp'
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${paymentConfig.mercadopago_access_token}`
      },
      body: JSON.stringify(preferenceData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('MercadoPago error:', error);
      return Response.json({ error: 'Error al crear preferencia de pago' }, { status: 500 });
    }

    const preference = await response.json();

    // Create payment record
    await base44.asServiceRole.entities.Payment.create({
      reservation_id,
      court_id: reservation.court_id,
      court_name: reservation.court_name,
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      owner_id,
      amount: reservation.total_price,
      payment_method: 'mercadopago',
      status: 'pending',
      transaction_id: preference.id
    });

    return Response.json({
      success: true,
      init_point: preference.init_point,
      preference_id: preference.id
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});