import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSoccerEventDefinitions1778000000000 implements MigrationInterface {
  name = 'UpdateSoccerEventDefinitions1778000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(
      `SELECT "event_definitions" FROM "sports" WHERE "name" = 'Soccer'`,
    );

    if (result.length > 0) {
      const events = result[0].event_definitions;

      const newEvents = [
        {
          type: 'POSITION_SWAP',
          payloadSchema: {
            type: 'object',
            properties: {
              playerIdA: { type: 'string', format: 'uuid' },
              playerIdB: { type: 'string', format: 'uuid' },
              slotIndexA: { type: 'integer' },
              slotIndexB: { type: 'integer' }
            },
            required: ['playerIdA', 'playerIdB', 'slotIndexA', 'slotIndexB'],
            additionalProperties: true
          }
        },
        {
          type: 'PERIOD_START',
          payloadSchema: {
            type: 'object',
            properties: {
              period: { type: 'integer' }
            },
            required: ['period'],
            additionalProperties: true
          }
        },
        {
          type: 'PERIOD_END',
          payloadSchema: {
            type: 'object',
            properties: {
              period: { type: 'integer' }
            },
            required: ['period'],
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
        (e: any) => !['POSITION_SWAP', 'PERIOD_START', 'PERIOD_END'].includes(e.type),
      );

      await queryRunner.query(
        `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Soccer'`,
        [JSON.stringify(filtered)]
      );
    }
  }
}
