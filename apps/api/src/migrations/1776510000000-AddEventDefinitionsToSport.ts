import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventDefinitionsToSport1776510000000 implements MigrationInterface {
  name = 'AddEventDefinitionsToSport1776510000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sports" ADD "event_definitions" jsonb NOT NULL DEFAULT '[]'`);

    const soccerEvents = [
      {
        type: 'GOAL',
        payloadSchema: {
          type: 'object',
          properties: {
            scorerId: { type: 'string', format: 'uuid' },
            assistorId: { type: 'string', format: 'uuid' }
          },
          required: ['scorerId'],
          additionalProperties: false
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
          additionalProperties: false
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
          additionalProperties: false
        }
      },
      {
        type: 'CARD',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' },
            color: { type: 'string', enum: ['yellow', 'red'] }
          },
          required: ['playerId', 'color'],
          additionalProperties: false
        }
      }
    ];

    await queryRunner.query(
      `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Soccer'`,
      [JSON.stringify(soccerEvents)]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sports" DROP COLUMN "event_definitions"`);
  }
}
