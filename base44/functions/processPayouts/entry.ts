import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MINIMUM_PAYOUT = 100; // S/ 100

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all owner tiers with pending balance >= minimum
    const ownerTiers = await base44.asServiceRole.entities.OwnerTier.filter({});
    
    const payoutsProcessed = [];
    const payoutsFailed = [];

    for (const ownerTier of ownerTiers) {
      if (ownerTier.pending_payout >= MINIMUM_PAYOUT && ownerTier.bank_account_verified) {
        try {
          // Get all released commissions not yet paid out
          const commissions = await base44.asServiceRole.entities.Commission.filter({
            owner_id: ownerTier.owner_id,
            status: 'released',
            payout_status: 'pending'
          });

          if (commissions.length === 0) continue;

          const totalPayout = commissions.reduce((sum, c) => sum + c.owner_payout, 0);

          // In production, integrate with bank transfer API here
          // For now, simulate successful payout
          
          const payoutDate = new Date().toISOString();

          // Update commissions
          for (const commission of commissions) {
            await base44.asServiceRole.entities.Commission.update(commission.id, {
              payout_status: 'completed',
              payout_date: payoutDate
            });
          }

          // Update owner tier
          await base44.asServiceRole.entities.OwnerTier.update(ownerTier.id, {
            pending_payout: 0,
            last_payout_date: payoutDate
          });

          // Send notification
          await base44.asServiceRole.entities.Notification.create({
            owner_id: ownerTier.owner_id,
            title: 'Payout procesado',
            message: `Se ha transferido S/ ${totalPayout.toFixed(2)} a tu cuenta ${ownerTier.bank_name} terminada en ${ownerTier.bank_account?.slice(-4)}`,
            type: 'system'
          });

          payoutsProcessed.push({
            owner_id: ownerTier.owner_id,
            amount: totalPayout,
            commissions_count: commissions.length
          });

        } catch (error) {
          console.error(`Failed payout for owner ${ownerTier.owner_id}:`, error);
          payoutsFailed.push({
            owner_id: ownerTier.owner_id,
            error: error.message
          });
        }
      }
    }

    return Response.json({
      success: true,
      processed: payoutsProcessed.length,
      failed: payoutsFailed.length,
      total_amount: payoutsProcessed.reduce((sum, p) => sum + p.amount, 0),
      details: { payoutsProcessed, payoutsFailed }
    });

  } catch (error) {
    console.error('Error processing payouts:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});