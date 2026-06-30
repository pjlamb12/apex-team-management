import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedVolleyballEventDefinitions1783000000000 implements MigrationInterface {
  name = 'SeedVolleyballEventDefinitions1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const volleyballEvents = [
      {
        type: 'KILL',
        payloadSchema: {
          type: 'object',
          properties: {
            scorerId: { type: 'string', format: 'uuid' },
            assistorId: { type: 'string', format: 'uuid' }
          },
          required: ['scorerId'],
          additionalProperties: true
        }
      },
      {
        type: 'ACE',
        payloadSchema: {
          type: 'object',
          properties: {
            scorerId: { type: 'string', format: 'uuid' }
          },
          required: ['scorerId'],
          additionalProperties: true
        }
      },
      {
        type: 'BLOCK',
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
        type: 'DIG',
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
        type: 'ASSIST',
        payloadSchema: {
          type: 'object',
          properties: {
            assistorId: { type: 'string', format: 'uuid' }
          },
          required: ['assistorId'],
          additionalProperties: true
        }
      },
      {
        type: 'SERVICE_ERROR',
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
        type: 'HITTING_ERROR',
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
        type: 'POINT_WON',
        payloadSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['kill', 'ace', 'block', 'error', 'other'] },
            playerId: { type: 'string', format: 'uuid' }
          },
          additionalProperties: true
        }
      },
      {
        type: 'POINT_LOST',
        payloadSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['kill', 'ace', 'block', 'error', 'other'] },
            playerId: { type: 'string', format: 'uuid' }
          },
          additionalProperties: true
        }
      },
      {
        type: 'SUB',
        payloadSchema: {
          type: 'object',
          properties: {
            inPlayerId: { type: 'string', format: 'uuid' },
            outPlayerId: { type: 'string', format: 'uuid' },
            positionName: { type: 'string' }
          },
          required: ['inPlayerId', 'outPlayerId', 'positionName'],
          additionalProperties: true
        }
      },
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

    await queryRunner.query(
      `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Volleyball'`,
      [JSON.stringify(volleyballEvents)]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "sports" SET "event_definitions" = '[]'::jsonb WHERE "name" = 'Volleyball'`
    );
  }
}
