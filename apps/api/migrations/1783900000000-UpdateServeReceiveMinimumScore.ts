import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateServeReceiveMinimumScore1783900000000 implements MigrationInterface {
  name = 'UpdateServeReceiveMinimumScore1783900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(
      `SELECT "event_definitions" FROM "sports" WHERE "name" = 'Volleyball'`
    );
    if (result && result.length > 0) {
      const defs = result[0].event_definitions || [];
      const serveReceive = defs.find((d: any) => d.type === 'SERVE_RECEIVE');
      if (serveReceive && serveReceive.payloadSchema?.properties?.score) {
        serveReceive.payloadSchema.properties.score.minimum = 0;
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
      const defs = result[0].event_definitions || [];
      const serveReceive = defs.find((d: any) => d.type === 'SERVE_RECEIVE');
      if (serveReceive && serveReceive.payloadSchema?.properties?.score) {
        serveReceive.payloadSchema.properties.score.minimum = 1;
      }
      await queryRunner.query(
        `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Volleyball'`,
        [JSON.stringify(defs)]
      );
    }
  }
}
