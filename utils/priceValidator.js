const BASE_PRICES = {
  '0-2':  20,
  '2-5':  25,
  '5-10': 32,
  '10-20':42,
  '20+':  55,
};

const WEIGHT_PRICES = {
  light:      0,
  medium:     5,
  heavy:      12,
  very_heavy: 20,
};

const TIME_PRICES = {
  asap:      8,
  same_day:  0,
  scheduled: -3,
};

export function validatePrice(form, cityMultiplier = 1.0) {
  const distanceKm = form.distanceKm || 3;
  let distanceTier = '0-2';
  if (distanceKm > 20)     distanceTier = '20+';
  else if (distanceKm > 10) distanceTier = '10-20';
  else if (distanceKm > 5)  distanceTier = '5-10';
  else if (distanceKm > 2)  distanceTier = '2-5';

  const base         = BASE_PRICES[distanceTier] || 25;
  const weightFee    = WEIGHT_PRICES[form.weight] || 0;
  const timeFee      = TIME_PRICES[form.timeWindow] || 0;
  const insuranceFee = form.insuranceSelected ? 3 : 0;
  const subtotal     = (base + weightFee + timeFee + insuranceFee) * cityMultiplier;

  return {
    base,
    weightFee,
    timeFee,
    insuranceFee,
    subtotal:       Math.round(subtotal),
    courierEarning: Math.round(subtotal * 0.71),
    platformFee:    Math.round(subtotal * 0.15),
  };
}
