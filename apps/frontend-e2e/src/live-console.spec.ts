import { test, expect } from '@playwright/test';

test.describe('Live Game Console', () => {
  test.setTimeout(120000);
  test('full game flow: minimal path', async ({ page }) => {
    const email = `coach-${Date.now()}@example.com`;
    const password = 'Password123!';

    await page.setViewportSize({ width: 1280, height: 1024 });

    // 1. Sign Up
    await page.goto('/signup');
    await page.locator('ion-input[formControlName="displayName"] input').fill('Coach Test');
    await page.locator('ion-input[type="email"] input').fill(email);
    await page.locator('ion-input[type="password"] input').fill(password);
    await page.keyboard.press('Enter');

    // 2. Wait for Teams page
    await page.waitForURL('**/teams', { timeout: 30000 });

    // 3. Create a Team
    await page.getByRole('button', { name: 'Add Team' }).click();
    await page.locator('ion-input[formControlName="name"] input').fill('Thunder FC');
    await page.locator('ion-select[formControlName="sportId"]').click();
    await page.locator('ion-select-option').first().click(); // Soccer
    await page.locator('ion-button:has-text("Create Team")').click();
    await page.waitForURL('**/teams');
    
    // Select the newly created team
    await page.locator('ion-card').first().click();
    await page.waitForURL('**/teams/*');

    // 4. Create 2 Players (1 starter + 1 sub)
    for (let i = 1; i <= 2; i++) {
      await page.locator('ion-fab-button[aria-label="Add player"]').click();
      await page.locator('ion-input[formControlName="firstName"] input').fill('Player');
      await page.locator('ion-input[formControlName="lastName"] input').fill(`${i}`);
      await page.locator('ion-input[formControlName="jerseyNumber"] input').fill(`${i}`);
      await page.locator('ion-input[formControlName="parentEmail"] input').fill(`parent${i}@example.com`);
      await page.locator('ion-button:has-text("Save")').click();
      await expect(page.locator('ion-modal')).toHaveCount(0);
    }

    // 5. Create a Game
    await page.locator('ion-segment-button[value="games"]').click();
    await page.locator('ion-fab-button[aria-label="Schedule game"]').click();
    await page.waitForURL('**/games/new');
    await page.locator('ion-input[formControlName="opponent"] input').fill('Lightning SC');
    await page.locator('ion-button:has-text("Create Game")').click();
    await page.waitForURL('**/teams/*');

    // 6. Set Lineup (just 1 starter)
    await page.locator('ion-item').filter({ hasText: 'vs Lightning SC' }).first().click();
    await page.waitForURL('**/games/*');
    await page.getByRole('button', { name: 'Set Lineup' }).click();
    await page.waitForURL('**/lineup');
    
    // Assign 1 starter
    const posSelect = page.locator('ion-select[label="Pos"]').first();
    const playerSelect = page.locator('ion-select[label="Player"]').first();
    
    await posSelect.click();
    await page.locator('ion-select-option').first().click();
    
    await playerSelect.click();
    await page.locator('ion-select-option').filter({ hasText: 'Player 1' }).first().click();
    
    await page.locator('ion-button:has-text("Save Lineup")').click();
    await page.waitForURL('**/teams/*');

    // 7. Go to Live Console
    await page.locator('ion-segment-button[value="games"]').click();
    await page.locator('ion-item').filter({ hasText: 'vs Lightning SC' }).first().click();
    await page.getByRole('button', { name: 'Live Console' }).click();
    await page.waitForURL('**/console');

    // 8. Start the clock
    await page.locator('ion-button:has-text("Start")').click();
    await expect(page.locator('app-clock-display')).not.toHaveText('00:00');

    // 9. Perform a substitution
    const benchPlayer = page.locator('app-bench-view ion-card').first();
    await benchPlayer.click();
    
    const pitchPlayer = page.locator('app-soccer-pitch-view .player-slot').first();
    await pitchPlayer.click();
    
    await expect(page.locator('app-event-log')).toContainText('SUB');

    // 10. Log a goal
    await pitchPlayer.click();
    await page.locator('ion-item:has-text("Goal")').click();
    await expect(page.locator('app-event-log')).toContainText('GOAL');

    // 11. Persistence Check
    await page.reload();
    // Wait for event log to confirm state rehydrated from localStorage
    await expect(page.locator('app-event-log')).toContainText('GOAL');
    // Clock must NOT show 00:00 after reload — accumulatedMs was persisted
    await expect(page.locator('app-clock-display')).not.toHaveText('00:00');

    // 12. Undo
    await page.locator('ion-button:has-text("Undo Last")').click();
    await expect(page.locator('app-event-log')).not.toContainText('GOAL');
    await expect(page.locator('app-event-log')).toContainText('SUB');
  });
});
