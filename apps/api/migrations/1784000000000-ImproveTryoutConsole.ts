import { MigrationInterface, QueryRunner } from "typeorm";

export class ImproveTryoutConsole1784000000000 implements MigrationInterface {
    name = 'ImproveTryoutConsole1784000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop NOT NULL constraint on candidates.parent_email
        await queryRunner.query(`ALTER TABLE "candidates" ALTER COLUMN "parent_email" DROP NOT NULL`);

        // 2. Add tryout_jersey_number to candidates
        await queryRunner.query(`ALTER TABLE "candidates" ADD COLUMN "tryout_jersey_number" integer`);

        // 3. Create candidate_notes table
        await queryRunner.query(`
            CREATE TABLE "candidate_notes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "candidate_id" uuid NOT NULL,
                "coach_id" uuid NOT NULL,
                "event_id" uuid,
                "content" text NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_candidate_notes" PRIMARY KEY ("id")
            )
        `);

        // 4. Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "candidate_notes" 
            ADD CONSTRAINT "FK_candidate_notes_candidate" 
            FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "candidate_notes" 
            ADD CONSTRAINT "FK_candidate_notes_coach" 
            FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "candidate_notes" 
            ADD CONSTRAINT "FK_candidate_notes_event" 
            FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop constraints first
        await queryRunner.query(`ALTER TABLE "candidate_notes" DROP CONSTRAINT "FK_candidate_notes_event"`);
        await queryRunner.query(`ALTER TABLE "candidate_notes" DROP CONSTRAINT "FK_candidate_notes_coach"`);
        await queryRunner.query(`ALTER TABLE "candidate_notes" DROP CONSTRAINT "FK_candidate_notes_candidate"`);

        // Drop table
        await queryRunner.query(`DROP TABLE "candidate_notes"`);

        // Drop column
        await queryRunner.query(`ALTER TABLE "candidates" DROP COLUMN "tryout_jersey_number"`);

        // Restore NOT NULL constraint (caution: might fail if there are null values, but standard down method behavior)
        await queryRunner.query(`ALTER TABLE "candidates" ALTER COLUMN "parent_email" SET NOT NULL`);
    }
}
