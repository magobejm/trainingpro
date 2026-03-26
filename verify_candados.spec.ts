import { test, expect } from '@playwright/test';

test('Verify persistent locked fields', async ({ page }) => {
  // 1. Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'coach@trainerpro.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/coach');

  // 2. Go to routines
  await page.click('text=Librería');
  await page.click('text=Rutinas');
  await page.click('text=Nueva');
  await page.waitForTimeout(1000);

  // 3. Add a block
  await page.click('text=+ Día');
  await page.click('.addBlockBtn', { force: true }); // Assume some add block mechanism
  await page.click('text=Fuerza');

  // Pick first exercise
  await page.click('.exerciseListItem >> nth=0');

  // 4. Lock a field
  await page.click('text=RPE'); // the header cell
  await page.click('.lockBtn >> nth=0'); // click the first lock button

  // Save routine
  await page.click('text=Guardar');
  await page.fill('input[placeholder="Nombre de la rutina"]', 'Test Candados');
  await page.click('button:has-text("Guardar"):visible');

  // Wait for success toast or redirection
  await page.waitForTimeout(2000);

  // 5. Reload the routine editor for this routine
  // Go back to list and open it
  await page.goto('http://localhost:5173/coach/library/routines');
  await page.click('text=Test Candados');
  await page.waitForTimeout(1000);

  // 6. Verify the field is still locked
  const lockIcon = page.locator('.lockIconActive').first();
  await expect(lockIcon).toBeVisible();
});
