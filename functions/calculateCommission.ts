import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TIER_CONFIG = {
  bronze: { min_reservations: 0, base_rate: 0.10 },
  silver: { min_reservations: 20, base_rate: 0.07 },
  gold: { min_reservations: 50, base_rate: 0.05 },
  platinum: { min_reservations: 100, base_rate: 0.03, min_rating: 4.5 }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { reservation_id, owner_id, amount } = await req.json();

    // Get or create owner tier
    let ownerTiers = await base44.asServiceRole.entities.OwnerTier.filter({ owner_id });
    let ownerTier = ownerTiers[0];

    if (!ownerTier) {
      ownerTier = await base44.asServiceRole.entities.OwnerTier.create({
        owner_id,
        current_tier: 'bronze',
        total_reservations: 0,
        average_rating: 0,
        account_age_months: 0
      });
    }

    // Determine tier
    const tier = ownerTier.current_tier;
    let baseRate = TIER_CONFIG[tier].base_rate;

    // Calculate adjustments
    const adjustments = [];
    let totalAdjustment = 0;

    // Rating bonus
    if (ownerTier.average_rating >= 4.5) {
      adjustments.push({ type: 'rating', description: 'Rating >4.5', value: -0.01 });
      totalAdjustment -= 0.01;
    }

    // Seniority bonus
    if (ownerTier.account_age_months >= 12) {
      adjustments.push({ type: 'seniority', description: '12+ meses', value: -0.01 });
      totalAdjustment -= 0.01;
    } else if (ownerTier.account_age_months >= 6) {
      adjustments.push({ type: 'seniority', description: '6+ meses', value: -0.005 });
      totalAdjustment -= 0.005;
    }

    // Exclusivity bonus
    if (ownerTier.is_exclusive) {
      adjustments.push({ type: 'exclusivity', description: 'Exclusivo', value: -0.02 });
      totalAdjustment -= 0.02;
    }

    // Volume bonus (monthly)
    if (ownerTier.monthly_reservations >= 30) {
      adjustments.push({ type: 'volume', description: '>30 reservas/mes', value: -0.01 });
      totalAdjustment -= 0.01;
    }

    const finalRate = Math.max(0.03, baseRate + totalAdjustment);
    const commissionAmount = Math.round(amount * finalRate * 100) / 100;
    const ownerPayout = Math.round((amount - commissionAmount) * 100) / 100;

    // Calculate hold date (48 hours from now)
    const holdUntil = new Date();
    holdUntil.setHours(holdUntil.getHours() + 48);

    // Create commission record
    const commission = await base44.asServiceRole.entities.Commission.create({
      reservation_id,
      owner_id,
      tier,
      base_rate: baseRate,
      adjustments,
      final_rate: finalRate,
      reservation_amount: amount,
      commission_amount: commissionAmount,
      owner_payout: ownerPayout,
      status: 'held',
      hold_until: holdUntil.toISOString()
    });

    return Response.json({
      success: true,
      commission: {
        id: commission.id,
        tier,
        base_rate: baseRate,
        adjustments,
        final_rate: finalRate,
        commission_amount: commissionAmount,
        owner_payout: ownerPayout,
        hold_until: holdUntil
      }
    });

  } catch (error) {
    console.error('Error calculating commission:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});