import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedBasketballSportAndEventDefinitions1785100000000 implements MigrationInterface {
  name = 'SeedBasketballSportAndEventDefinitions1785100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add foul limit and bonus threshold columns to leagues table
    await queryRunner.query(`
      ALTER TABLE "leagues"
      ADD COLUMN IF NOT EXISTS "foul_limit" integer NOT NULL DEFAULT 5,
      ADD COLUMN IF NOT EXISTS "bonus_threshold" integer NOT NULL DEFAULT 5;
    `);

    // 2. Add foul limit and bonus threshold columns to events table
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "foul_limit" integer DEFAULT 5,
      ADD COLUMN IF NOT EXISTS "bonus_threshold" integer DEFAULT 5;
    `);

    // 3. Define basketball events with JSON schemas
    const basketballEvents = [
      {
        type: 'MADE_1PT',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' },
            x: { type: 'number' },
            y: { type: 'number' },
            distanceFeet: { type: 'number' },
          },
          required: ['playerId'],
          additionalProperties: true,
        },
      },
      {
        type: 'MISSED_1PT',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' },
            x: { type: 'number' },
            y: { type: 'number' },
            distanceFeet: { type: 'number' },
          },
          required: ['playerId'],
          additionalProperties: true,
        },
      },
      {
        type: 'MADE_2PT',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' },
            x: { type: 'number' },
            y: { type: 'number' },
            distanceFeet: { type: 'number' },
            assistorId: { type: 'string', format: 'uuid' },
          },
          required: ['playerId'],
          additionalProperties: true,
        },
      },
      {
        type: 'MISSED_2PT',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' },
            x: { type: 'number' },
            y: { type: 'number' },
            distanceFeet: { type: 'number' },
          },
          required: ['playerId'],
          additionalProperties: true,
        },
      },
      {
        type: 'MADE_3PT',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' },
            x: { type: 'number' },
            y: { type: 'number' },
            distanceFeet: { type: 'number' },
            assistorId: { type: 'string', format: 'uuid' },
          },
          required: ['playerId'],
          additionalProperties: true,
        },
      },
      {
        type: 'MISSED_3PT',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' },
            x: { type: 'number' },
            y: { type: 'number' },
            distanceFeet: { type: 'number' },
          },
          required: ['playerId'],
          additionalProperties: true,
        },
      },
      {
        type: 'OPPONENT_SCORE',
        payloadSchema: {
          type: 'object',
          properties: {
            points: { type: 'integer', minimum: 1, maximum: 3 },
          },
          additionalProperties: true,
        },
      },
      {
        type: 'REBOUND_OFFENSIVE',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' },
          },
          required: ['playerId'],
          additionalProperties: true,
        },
      },
      {
        type: 'REBOUND_DEFENSIVE',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' },
          },
          required: ['playerId'],
          additionalProperties: true,
        },
      },
      {
        type: 'ASSIST',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' },
            assistorId: { type: 'string', format: 'uuid' },
          },
          additionalProperties: true,
        },
      },
      {
        type: 'STEAL',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' },
          },
          required: ['playerId'],
          additionalProperties: true,
        },
      },
      {
        type: 'BLOCK',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' },
          },
          required: ['playerId'],
          additionalProperties: true,
        },
      },
      {
        type: 'TURNOVER',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' },
          },
          required: ['playerId'],
          additionalProperties: true,
        },
      },
      {
        type: 'FOUL',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' },
            foulType: { type: 'string' },
          },
          required: ['playerId'],
          additionalProperties: true,
        },
      },
      {
        type: 'OPPONENT_FOUL',
        payloadSchema: {
          type: 'object',
          properties: {
            opponentPlayerNumber: { type: 'string' },
          },
          additionalProperties: true,
        },
      },
      {
        type: 'TIMEOUT',
        payloadSchema: {
          type: 'object',
          properties: {
            team: { type: 'string', enum: ['us', 'opponent'] },
          },
          additionalProperties: true,
        },
      },
      {
        type: 'SUB',
        payloadSchema: {
          type: 'object',
          properties: {
            inPlayerId: { type: 'string', format: 'uuid' },
            outPlayerId: { type: 'string', format: 'uuid' },
            positionName: { type: 'string' },
          },
          required: ['inPlayerId', 'outPlayerId', 'positionName'],
          additionalProperties: true,
        },
      },
      {
        type: 'POSITION_SWAP',
        payloadSchema: {
          type: 'object',
          properties: {
            playerIdA: { type: 'string', format: 'uuid' },
            playerIdB: { type: 'string', format: 'uuid' },
            slotIndexA: { type: 'integer' },
            slotIndexB: { type: 'integer' },
            positionNameA: { type: 'string' },
            positionNameB: { type: 'string' },
          },
          required: ['playerIdA'],
          additionalProperties: true,
        },
      },
      {
        type: 'PERIOD_START',
        payloadSchema: {
          type: 'object',
          properties: {
            period: { type: 'integer' },
          },
          required: ['period'],
          additionalProperties: true,
        },
      },
      {
        type: 'PERIOD_END',
        payloadSchema: {
          type: 'object',
          properties: {
            period: { type: 'integer' },
          },
          required: ['period'],
          additionalProperties: true,
        },
      },
    ];

    // 4. Seed Basketball sport and event definitions
    await queryRunner.query(
      `
      INSERT INTO "sports" ("name", "position_types", "is_enabled", "event_definitions")
      VALUES (
        'Basketball',
        '["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"]'::jsonb,
        true,
        $1::jsonb
      )
      ON CONFLICT ("name") DO UPDATE
      SET "position_types" = EXCLUDED."position_types",
          "is_enabled" = true,
          "event_definitions" = EXCLUDED."event_definitions";
    `,
      [JSON.stringify(basketballEvents)]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "sports" WHERE "name" = 'Basketball';
    `);

    await queryRunner.query(`
      ALTER TABLE "events"
      DROP COLUMN IF EXISTS "foul_limit",
      DROP COLUMN IF EXISTS "bonus_threshold";
    `);

    await queryRunner.query(`
      ALTER TABLE "leagues"
      DROP COLUMN IF EXISTS "foul_limit",
      DROP COLUMN IF EXISTS "bonus_threshold";
    `);
  }
}
