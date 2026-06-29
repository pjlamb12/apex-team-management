import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServeReceiveEventDefinition1783400000000 implements MigrationInterface {
  name = 'AddServeReceiveEventDefinition1783400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(
      `SELECT "event_definitions" FROM "sports" WHERE "name" = 'Volleyball'`
    );
    if (result && result.length > 0) {
      const defs = result[0].event_definitions || [];
      const newDef = {
        type: 'SERVE_RECEIVE',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' },
            score: { type: 'integer', minimum: 1, maximum: 3 }
          },
          required: ['playerId', 'score'],
          additionalProperties: true
        }
      };
      if (!defs.some((d: any) => d.type === 'SERVE_RECEIVE')) {
        defs.push(newDef);
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
      const filtered = defs.filter((d: any) => d.type !== 'SERVE_RECEIVE');
      await queryRunner.query(
        `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Volleyball'`,
        [JSON.stringify(filtered)]
      );
    }
  }
}
