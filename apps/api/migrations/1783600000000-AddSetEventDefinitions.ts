import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSetEventDefinitions1783600000000 implements MigrationInterface {
  name = 'AddSetEventDefinitions1783600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(
      `SELECT "event_definitions" FROM "sports" WHERE "name" = 'Volleyball'`
    );
    if (result && result.length > 0) {
      let defs = result[0].event_definitions || [];
      
      // Remove old Volleyball ASSIST event definition if it exists
      defs = defs.filter((d: any) => d.type !== 'ASSIST');

      const setAttemptDef = {
        type: 'SET_ATTEMPT',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' }
          },
          required: ['playerId'],
          additionalProperties: true
        }
      };

      const setAssistDef = {
        type: 'SET_ASSIST',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' }
          },
          required: ['playerId'],
          additionalProperties: true
        }
      };

      const setErrorDef = {
        type: 'SET_ERROR',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' }
          },
          required: ['playerId'],
          additionalProperties: true
        }
      };

      if (!defs.some((d: any) => d.type === 'SET_ATTEMPT')) {
        defs.push(setAttemptDef);
      }
      if (!defs.some((d: any) => d.type === 'SET_ASSIST')) {
        defs.push(setAssistDef);
      }
      if (!defs.some((d: any) => d.type === 'SET_ERROR')) {
        defs.push(setErrorDef);
      }

      await queryRunner.query(
        `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Volleyball'`,
        [JSON.stringify(defs)]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(
      `SELECT "event_definitions" FROM "sports" WHERE "name" = 'Volleyball'`
    );
    if (result && result.length > 0) {
      let defs = result[0].event_definitions || [];
      
      // Remove the added SET_* definitions
      defs = defs.filter(
        (d: any) => d.type !== 'SET_ATTEMPT' && d.type !== 'SET_ASSIST' && d.type !== 'SET_ERROR'
      );

      // Restore the old Volleyball ASSIST definition
      const oldAssistDef = {
        type: 'ASSIST',
        payloadSchema: {
          type: 'object',
          properties: {
            assistorId: { type: 'string', format: 'uuid' }
          },
          required: ['assistorId'],
          additionalProperties: true
        }
      };
      if (!defs.some((d: any) => d.type === 'ASSIST')) {
        defs.push(oldAssistDef);
      }

      await queryRunner.query(
        `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Volleyball'`,
        [JSON.stringify(defs)]
      );
    }
  }
}
