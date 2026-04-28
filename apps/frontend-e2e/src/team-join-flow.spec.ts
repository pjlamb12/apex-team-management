import { test, expect } from '@playwright/test';

test.describe('Team Join Flow & RBAC', () => {
  test.setTimeout(120000);

  test('Coach A creates team, Coach B joins via code', async ({ browser }) => {
    // Create two separate browser contexts for Coach A and Coach B
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    const emailA = `coach-a-${Date.now()}@example.com`;
    const emailB = `coach-b-${Date.now()}@example.com`;
    const password = 'Password123!';

    // 1. Coach A Sign Up
    await pageA.goto('/signup');
    await pageA.locator('ion-input[formControlName="displayName"] input').fill('Coach A');
    await pageA.locator('ion-input[type="email"] input').fill(emailA);
    await pageA.locator('ion-input[type="password"] input').fill(password);
    await pageA.keyboard.press('Enter');
    await pageA.waitForURL('**/teams', { timeout: 30000 });

    // 2. Coach A creates a Team
    await pageA.getByRole('button', { name: 'Add Team' }).click();
    await pageA.locator('ion-input[formControlName="name"] input').fill('Testing FC');
    await pageA.locator('ion-select[formControlName="sportId"]').click();
    await pageA.locator('ion-select-option').first().click(); // Soccer
    await pageA.locator('ion-button:has-text("Create Team")').click();
    await pageA.waitForURL('**/teams');

    // 3. Coach A goes to Settings and copies Join Code
    // Click the edit/settings button on the card
    await pageA.locator('ion-button[aria-label="Edit Team"]').first().click();
    await pageA.waitForURL('**/settings');
    
    const joinCode = await pageA.locator('h2.font-mono').innerText();
    expect(joinCode).toHaveLength(6);

    // 4. Coach B Sign Up
    await pageB.goto('/signup');
    await pageB.locator('ion-input[formControlName="displayName"] input').fill('Coach B');
    await pageB.locator('ion-input[type="email"] input').fill(emailB);
    await pageB.locator('ion-input[type="password"] input').fill(password);
    await pageB.keyboard.press('Enter');
    await pageB.waitForURL('**/teams', { timeout: 30000 });

    // 5. Coach B joins the team
    await pageB.getByRole('button', { name: 'Join Team' }).first().click();
    await pageB.locator('ion-input[placeholder="e.g. A4K9X2"] input').fill(joinCode);
    await pageB.locator('ion-button:has-text("Join")').click();
    
    // 6. Verify Coach B sees the team
    await expect(pageB.locator('ion-card:has-text("Testing FC")')).toBeVisible();
    await pageB.locator('ion-card:has-text("Testing FC")').click();
    await pageB.waitForURL('**/teams/*');

    // 7. Verify Coach B (Assistant) RBAC
    await pageB.locator('ion-button[aria-label="Team settings"]').click();
    await pageB.waitForURL('**/settings');
    
    // Coach B should see the code but NOT the refresh/regenerate button or delete button
    await expect(pageB.locator('h2.font-mono')).toHaveText(joinCode);
    await expect(pageB.locator('ion-icon[name="refresh-outline"]')).not.toBeVisible();
    await expect(pageB.locator('ion-button:has-text("Delete Team")')).not.toBeVisible();

    // 8. Coach A (Head Coach) regenerates code
    await pageA.locator('ion-icon[name="refresh-outline"]').click();
    await pageA.locator('ion-button:has-text("Regenerate")').click();
    
    const newJoinCode = await pageA.locator('h2.font-mono').innerText();
    expect(newJoinCode).not.toBe(joinCode);
    expect(newJoinCode).toHaveLength(6);

    // 9. Coach B reloads and sees new code (since they are in the team)
    await pageB.reload();
    await expect(pageB.locator('h2.font-mono')).toHaveText(newJoinCode);

    await contextA.close();
    await contextB.close();
  });
});
