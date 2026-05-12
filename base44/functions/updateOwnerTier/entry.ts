import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TIER_REQUIREMENTS = {
  bronze: { reservations: 0, rating: 0 },
  silver: { reservations: 20, rating: 0 },
  gold: { reservations: 50, rating: 0 },
  platinum: { reservations: 100, rating: 4.5 }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { owner_id } = await req.json();

    // Get owner tier
    const ownerTiers = await base44.asServiceRole.entities.OwnerTier.filter({ owner_id });
    let ownerTier = ownerTiers[0];

    if (!ownerTier) {
      return Response.json({ error: 'Owner tier not found' }, { status: 404 });
    }

    // Get completed reservations count
    const reservations = await base44.asServiceRole.entities.Reservation.filter({
      owner_id,
      status: 'completed'
    });

    const totalReservations = reservations.length;

    // Get owner's courts average rating
    const courts = await base44.asServiceRole.entities.Court.filter({ owner_id });
    const avgRating = courts.length > 0
      ? courts.reduce((sum, c) => sum + (c.average_rating || 0), 0) / courts.length
      : 0;

    // Calculate account age
    const accountCreated = new Date(ownerTier.created_date);
    const now = new Date();
    const accountAgeMonths = Math.floor((now - accountCreated) / (1000 * 60 * 60 * 24 * 30));

    // Determine tier
    let newTier = 'bronze';
    if (totalReservations >= TIER_REQUIREMENTS.platinum.reservations && avgRating >= TIER_REQUIREMENTS.platinum.rating) {
      newTier = 'platinum';
    } else if (totalReservations >= TIER_REQUIREMENTS.gold.reservations) {
      newTier = 'gold';
    } else if (totalReservations >= TIER_REQUIREMENTS.silver.reservations) {
      newTier = 'silver';
    }

    // Calculate next tier info
    let nextTier = null;
    let reservationsToNext = 0;

    if (newTier === 'bronze') {
      nextTier = 'silver';
      reservationsToNext = TIER_REQUIREMENTS.silver.reservations - totalReservations;
    } else if (newTier === 'silver') {
      nextTier = 'gold';
      reservationsToNext = TIER_REQUIREMENTS.gold.reservations - totalReservations;
    } else if (newTier === 'gold') {
      nextTier = 'platinum';
      reservationsToNext = TIER_REQUIREMENTS.platinum.reservations - totalReservations;
    }

    // Update tier
    const updated = await base44.asServiceRole.entities.OwnerTier.update(ownerTier.id, {
      current_tier: newTier,
      total_reservations: totalReservations,
      average_rating: avgRating,
      account_age_months: accountAgeMonths,
      next_tier: nextTier,
      reservations_to_next_tier: reservationsToNext
    });

    // Send notification if tier changed
    if (newTier !== ownerTier.current_tier) {
      await base44.asServiceRole.entities.Notification.create({
        owner_id,
        title: `¡Nuevo tier alcanzado: ${newTier.toUpperCase()}!`,
        message: `Has sido promovido al tier ${newTier}. Ahora pagas menos comisión por cada reserva.`,
        type: 'system'
      });
    }

    return Response.json({
      success: true,
      tier: updated
    });

  } catch (error) {
    console.error('Error updating tier:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});