import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();

    // Get all held commissions past their hold period
    const commissions = await base44.asServiceRole.entities.Commission.filter({
      status: 'held'
    });

    const released = [];
    const stillHeld = [];

    for (const commission of commissions) {
      const holdUntil = new Date(commission.hold_until);
      
      if (now >= holdUntil) {
        // Check if reservation was completed successfully
        const reservation = await base44.asServiceRole.entities.Reservation.get(commission.reservation_id);
        
        if (reservation && reservation.status === 'completed') {
          // Release payment
          await base44.asServiceRole.entities.Commission.update(commission.id, {
            status: 'released',
            release_date: now.toISOString()
          });

          // Add to owner's pending payout
          const ownerTiers = await base44.asServiceRole.entities.OwnerTier.filter({ 
            owner_id: commission.owner_id 
          });
          
          if (ownerTiers[0]) {
            const newBalance = (ownerTiers[0].pending_payout || 0) + commission.owner_payout;
            await base44.asServiceRole.entities.OwnerTier.update(ownerTiers[0].id, {
              pending_payout: newBalance,
              total_revenue: (ownerTiers[0].total_revenue || 0) + commission.reservation_amount
            });
          }

          released.push({
            commission_id: commission.id,
            owner_id: commission.owner_id,
            amount: commission.owner_payout
          });
        } else if (reservation && (reservation.status === 'cancelled' || reservation.status === 'rejected')) {
          // Mark as cancelled
          await base44.asServiceRole.entities.Commission.update(commission.id, {
            status: 'cancelled'
          });
        }
      } else {
        stillHeld.push(commission.id);
      }
    }

    return Response.json({
      success: true,
      released: released.length,
      still_held: stillHeld.length,
      total_released: released.reduce((sum, r) => sum + r.amount, 0),
      details: released
    });

  } catch (error) {
    console.error('Error releasing payments:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});