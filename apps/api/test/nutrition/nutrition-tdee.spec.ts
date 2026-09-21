function calculateMifflinBmr(weightKg: number, heightCm: number, age: number, sex: 'female' | 'male'): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
}

describe('nutrition TDEE helpers', () => {
  it('computes Mifflin-St Jeor BMR for adult male', () => {
    const bmr = calculateMifflinBmr(80, 180, 30, 'male');
    expect(bmr).toBe(1780);
  });

  it('computes Mifflin-St Jeor BMR for adult female', () => {
    const bmr = calculateMifflinBmr(65, 165, 28, 'female');
    expect(bmr).toBe(1380);
  });

  it('applies activity multiplier to derive TDEE', () => {
    const bmr = 1785;
    const tdee = Math.round(bmr * 1.55);
    expect(tdee).toBe(2767);
  });
});
