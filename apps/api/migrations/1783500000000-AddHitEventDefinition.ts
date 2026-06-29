import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHitEventDefinition1783500000000 implements MigrationInterface {
  name = 'AddHitEventDefinition1783500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(
      `SELECT "event_definitions" FROM "sports" WHERE "name" = 'Volleyball'`
    );
    if (result && result.length > 0) {
      const defs = result[0].event_definitions || [];
      
      const newHitDef = {
        type: 'HIT',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' }
          },
          required: ['playerId'],
          additionalProperties: true
        }
      };

      const newLiberoDef = {
        type: 'LIBERO_CHANGED',
        payloadSchema: {
          type: 'object',
          properties: {
            liberoId: { type: 'string' }
          },
          additionalProperties: true
        }
      };

      let updated = false;
      if (!defs.some((d: any) => d.type === 'HIT')) {
        defs.push(newHitDef);
        updated = true;
      }
      if (!defs.some((d: any) => d.type === 'LIBERO_CHANGED')) {
        defs.push(newLiberoDef);
        updated = true;
      }

      if (updated) {
        await queryRunner.query(
          `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Volleyball'`,
          [JSON.stringify(defs)]
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(
      `SELECT "event_definitions" FROM "sports" WHERE "name" = 'Volleyball'`
    );
    if (result && result.length > 0) {
      const defs = result[0].event_definitions || [];
      const filtered = defs.filter((d: any) => d.type !== 'HIT' && d.type !== 'LIBERO_CHANGED');
      await queryRunner.query(
        `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Volleyball'`,
        [JSON.stringify(filtered)]
      );
    }
  }
}
