import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoalkeeperEventDefinitions1780900000000 implements MigrationInterface {
  name = 'AddGoalkeeperEventDefinitions1780900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(
      `SELECT "event_definitions" FROM "sports" WHERE "name" = 'Soccer'`,
    );

    if (result.length > 0) {
      const events = result[0].event_definitions;

      const newEvents = [
        {
          type: 'BLOCKED_SHOT',
          payloadSchema: {
            type: 'object',
            properties: {
              playerId: { type: 'string', format: 'uuid' }
            },
            required: ['playerId'],
            additionalProperties: true
          }
        },
        {
          type: 'BLOCKED_PENALTY',
          payloadSchema: {
            type: 'object',
            properties: {
              playerId: { type: 'string', format: 'uuid' }
            },
            required: ['playerId'],
            additionalProperties: true
          }
        },
        {
          type: 'SHOOTOUT_KICK',
          payloadSchema: {
            type: 'object',
            properties: {
              round: { type: 'integer' },
              team: { type: 'string', enum: ['team', 'opponent'] },
              playerId: { type: 'string', format: 'uuid' },
              goalkeeperId: { type: 'string', format: 'uuid' },
              outcome: { type: 'string', enum: ['goal', 'miss', 'save'] }
            },
            required: ['round', 'team', 'outcome'],
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
        (e: any) => !['BLOCKED_SHOT', 'BLOCKED_PENALTY', 'SHOOTOUT_KICK'].includes(e.type),
      );

      await queryRunner.query(
        `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Soccer'`,
        [JSON.stringify(filtered)]
      );
    }
  }
}
