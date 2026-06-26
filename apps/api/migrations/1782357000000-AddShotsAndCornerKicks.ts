import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShotsAndCornerKicks1782357000000 implements MigrationInterface {
  name = 'AddShotsAndCornerKicks1782357000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(
      `SELECT "event_definitions" FROM "sports" WHERE "name" = 'Soccer'`,
    );

    if (result.length > 0) {
      const events = result[0].event_definitions;

      const newEvents = [
        {
          type: 'SHOT',
          payloadSchema: {
            type: 'object',
            properties: {},
            additionalProperties: true
          }
        },
        {
          type: 'OPPONENT_SHOT',
          payloadSchema: {
            type: 'object',
            properties: {},
            additionalProperties: true
          }
        },
        {
          type: 'CORNER_KICK',
          payloadSchema: {
            type: 'object',
            properties: {},
            additionalProperties: true
          }
        },
        {
          type: 'OPPONENT_CORNER_KICK',
          payloadSchema: {
            type: 'object',
            properties: {},
            additionalProperties: true
          }
        }
      ];

      for (const newEvent of newEvents) {
        if (!events.find((e: any) => e.type === newEvent.type)) {
          events.push(newEvent);
        }
      }

      await queryRunner.query(
        `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Soccer'`,
        [JSON.stringify(events)]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(
      `SELECT "event_definitions" FROM "sports" WHERE "name" = 'Soccer'`,
    );

    if (result.length > 0) {
      const events = result[0].event_definitions;
      const filtered = events.filter(
        (e: any) => !['SHOT', 'OPPONENT_SHOT', 'CORNER_KICK', 'OPPONENT_CORNER_KICK'].includes(e.type),
      );

      await queryRunner.query(
        `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Soccer'`,
        [JSON.stringify(filtered)]
      );
    }
  }
}
