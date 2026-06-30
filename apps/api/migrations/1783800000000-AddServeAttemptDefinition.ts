import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServeAttemptDefinition1783800000000 implements MigrationInterface {
  name = 'AddServeAttemptDefinition1783800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(
      `SELECT "event_definitions" FROM "sports" WHERE "name" = 'Volleyball'`
    );
    if (result && result.length > 0) {
      const defs = result[0].event_definitions || [];

      const serveAttemptDef = {
        type: 'SERVE_ATTEMPT',
        payloadSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', format: 'uuid' }
          },
          required: ['playerId'],
          additionalProperties: true
        }
      };

      if (!defs.some((d: any) => d.type === 'SERVE_ATTEMPT')) {
        defs.push(serveAttemptDef);
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

      defs = defs.filter((d: any) => d.type !== 'SERVE_ATTEMPT');

      await queryRunner.query(
        `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Volleyball'`,
        [JSON.stringify(defs)]
      );
    }
  }
}
