import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEventNotes1782532847433 implements MigrationInterface {
    name = 'CreateEventNotes1782532847433'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "event_notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" uuid NOT NULL, "user_id" uuid NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5ca649a6f1fafb2bbdad4f5e7ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "event_notes" ADD CONSTRAINT "FK_bead8e48e1d1367618b29640d93" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_notes" ADD CONSTRAINT "FK_08f0947df7ad9c53d38e36b7f4d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_notes" DROP CONSTRAINT "FK_08f0947df7ad9c53d38e36b7f4d"`);
        await queryRunner.query(`ALTER TABLE "event_notes" DROP CONSTRAINT "FK_bead8e48e1d1367618b29640d93"`);
        await queryRunner.query(`DROP TABLE "event_notes"`);
    }

}
