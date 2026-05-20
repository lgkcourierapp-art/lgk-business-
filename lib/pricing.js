export function getCityMultiplier(cityKey) {
  const MULTIPLIERS = {
    warszawa: 1.30, krakow: 1.25, wroclaw: 1.20, gdansk: 1.20, sopot: 1.20,
    poznan: 1.15, gdynia: 1.15, lodz: 1.05, katowice: 1.10, gliwice: 1.05,
    zabrze: 1.05, lublin: 1.00, bydgoszcz: 1.00, szczecin: 1.00, torun: 1.00,
    bialystok: 0.95, czestochowa: 0.95, radom: 0.95, kielce: 0.95, olsztyn: 0.95,
  }
  return MULTIPLIERS[cityKey?.toLowerCase()] || 1.00
}

export function calculatePrice({ distance, weight, timeWindow, pickupCity, deliveryCity, isCOD, isFragile, hasInsurance }) {
  let basePrice = 0
  if (distance <= 2) basePrice = 20
  else if (distance <= 5) basePrice = 25
  else if (distance <= 10) basePrice = 35
  else if (distance <= 15) basePrice = 45
  else basePrice = 45 + (distance - 15) * 2

  let weightFee = 0
  if (weight === '>20kg') weightFee = 10
  else if (weight === '10-20kg') weightFee = 5

  let timeFee = 0
  if (timeWindow === 'asap') timeFee = 8
  else if (timeWindow === 'scheduled') timeFee = -5

  let specialFees = 0
  if (isCOD) specialFees += 3
  if (isFragile) specialFees += 5
  if (hasInsurance) specialFees += 3

  const multiplier = Math.max(getCityMultiplier(pickupCity), getCityMultiplier(deliveryCity))
  const subtotal = basePrice + weightFee + timeFee + specialFees
  const total = Math.ceil(subtotal * multiplier)

  return { basePrice, distance, weightFee, timeFee, specialFees, cityMultiplier: multiplier, subtotal, total }
}
