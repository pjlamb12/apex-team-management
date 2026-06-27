import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOwnGoalEventDefinition1782600000000 implements MigrationInterface {
  name = 'AddOwnGoalEventDefinition1782600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(
      `SELECT "event_definitions" FROM "sports" WHERE "name" = 'Soccer'`,
    );

    if (result.length > 0) {
      const events = result[0].event_definitions;

      if (!events.find((e: any) => e.type === 'OWN_GOAL')) {
        events.push({
          type: 'OWN_GOAL',
          payloadSchema: {
            type: 'object',
            properties: {
              playerId: { type: 'string', format: 'uuid' }
            },
            required: ['playerId'],
            additionalProperties: true
          }
        });

        await queryRunner.query(
          `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Soccer'`,
          [JSON.stringify(events)]
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(
      `SELECT "event_definitions" FROM "sports" WHERE "name" = 'Soccer'`,
    );

    if (result.length > 0) {
      const events = result[0].event_definitions;
      const filtered = events.filter((e: any) => e.type !== 'OWN_GOAL');

      await queryRunner.query(
        `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Soccer'`,
        [JSON.stringify(filtered)]
      );
    }
  }
}
