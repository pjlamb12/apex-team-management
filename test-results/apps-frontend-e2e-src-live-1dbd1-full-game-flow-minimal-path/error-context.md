# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps/frontend-e2e/src/live-console.spec.ts >> Live Game Console >> full game flow: minimal path
- Location: apps/frontend-e2e/src/live-console.spec.ts:5:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/signup", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Live Game Console', () => {
  4   |   test.setTimeout(120000);
  5   |   test('full game flow: minimal path', async ({ page }) => {
  6   |     const email = `coach-${Date.now()}@example.com`;
  7   |     const password = 'Password123!';
  8   | 
  9   |     await page.setViewportSize({ width: 1280, height: 1024 });
  10  | 
  11  |     // 1. Sign Up
> 12  |     await page.goto('/signup');
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  13  |     await page.locator('ion-input[formControlName="displayName"] input').fill('Coach Test');
  14  |     await page.locator('ion-input[type="email"] input').fill(email);
  15  |     await page.locator('ion-input[type="password"] input').fill(password);
  16  |     await page.keyboard.press('Enter');
  17  | 
  18  |     // 2. Wait for Teams page
  19  |     await page.waitForURL('**/teams', { timeout: 30000 });
  20  | 
  21  |     // 3. Create a Team
  22  |     await page.getByRole('button', { name: 'Add Team' }).click();
  23  |     await page.locator('ion-input[formControlName="name"] input').fill('Thunder FC');
  24  |     await page.locator('ion-select[formControlName="sportId"]').click();
  25  |     await page.locator('ion-select-option').first().click(); // Soccer
  26  |     await page.locator('ion-button:has-text("Create Team")').click();
  27  |     await page.waitForURL('**/teams');
  28  |     
  29  |     // Select the newly created team
  30  |     await page.locator('ion-card').first().click();
  31  |     await page.waitForURL('**/teams/*');
  32  | 
  33  |     // 4. Create 2 Players (1 starter + 1 sub)
  34  |     for (let i = 1; i <= 2; i++) {
  35  |       await page.locator('ion-fab-button[aria-label="Add player"]').click();
  36  |       await page.locator('ion-input[formControlName="firstName"] input').fill('Player');
  37  |       await page.locator('ion-input[formControlName="lastName"] input').fill(`${i}`);
  38  |       await page.locator('ion-input[formControlName="jerseyNumber"] input').fill(`${i}`);
  39  |       await page.locator('ion-input[formControlName="parentEmail"] input').fill(`parent${i}@example.com`);
  40  |       await page.locator('ion-button:has-text("Save")').click();
  41  |       await expect(page.locator('ion-modal')).toHaveCount(0);
  42  |     }
  43  | 
  44  |     // 5. Create a Game
  45  |     await page.locator('ion-segment-button[value="games"]').click();
  46  |     await page.locator('ion-fab-button[aria-label="Schedule game"]').click();
  47  |     await page.waitForURL('**/games/new');
  48  |     await page.locator('ion-input[formControlName="opponent"] input').fill('Lightning SC');
  49  |     await page.locator('ion-button:has-text("Create Game")').click();
  50  |     await page.waitForURL('**/teams/*');
  51  | 
  52  |     // 6. Set Lineup (just 1 starter)
  53  |     await page.locator('ion-item').filter({ hasText: 'vs Lightning SC' }).first().click();
  54  |     await page.waitForURL('**/games/*');
  55  |     await page.getByRole('button', { name: 'Set Lineup' }).click();
  56  |     await page.waitForURL('**/lineup');
  57  |     
  58  |     // Assign 1 starter
  59  |     const posSelect = page.locator('ion-select[label="Pos"]').first();
  60  |     const playerSelect = page.locator('ion-select[label="Player"]').first();
  61  |     
  62  |     await posSelect.click();
  63  |     await page.locator('ion-select-option').first().click();
  64  |     
  65  |     await playerSelect.click();
  66  |     await page.locator('ion-select-option').filter({ hasText: 'Player 1' }).first().click();
  67  |     
  68  |     await page.locator('ion-button:has-text("Save Lineup")').click();
  69  |     await page.waitForURL('**/teams/*');
  70  | 
  71  |     // 7. Go to Live Console
  72  |     await page.locator('ion-segment-button[value="games"]').click();
  73  |     await page.locator('ion-item').filter({ hasText: 'vs Lightning SC' }).first().click();
  74  |     await page.getByRole('button', { name: 'Live Console' }).click();
  75  |     await page.waitForURL('**/console');
  76  | 
  77  |     // 8. Start the clock
  78  |     await page.locator('ion-button:has-text("Start")').click();
  79  |     await expect(page.locator('app-clock-display')).not.toHaveText('00:00');
  80  | 
  81  |     // 9. Perform a substitution
  82  |     const benchPlayer = page.locator('app-bench-view ion-card').first();
  83  |     await benchPlayer.click();
  84  |     
  85  |     const pitchPlayer = page.locator('app-soccer-pitch-view .player-slot').first();
  86  |     await pitchPlayer.click();
  87  |     
  88  |     await expect(page.locator('app-event-log')).toContainText('SUB');
  89  | 
  90  |     // 10. Log a goal
  91  |     await pitchPlayer.click();
  92  |     await page.locator('ion-item:has-text("Goal")').click();
  93  |     await expect(page.locator('app-event-log')).toContainText('GOAL');
  94  | 
  95  |     // 11. Persistence Check
  96  |     await page.reload();
  97  |     // Wait for event log to confirm state rehydrated from localStorage
  98  |     await expect(page.locator('app-event-log')).toContainText('GOAL');
  99  |     // Clock must NOT show 00:00 after reload — accumulatedMs was persisted
  100 |     await expect(page.locator('app-clock-display')).not.toHaveText('00:00');
  101 | 
  102 |     // 12. Undo
  103 |     await page.locator('ion-button:has-text("Undo Last")').click();
  104 |     await expect(page.locator('app-event-log')).not.toContainText('GOAL');
  105 |     await expect(page.locator('app-event-log')).toContainText('SUB');
  106 |   });
  107 | });
  108 | 
```