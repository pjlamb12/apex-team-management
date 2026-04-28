import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamMemberEntity } from '../entities/team-member.entity';
import { MembershipService } from './membership.service';

@Module({
  imports: [TypeOrmModule.forFeature([TeamMemberEntity])],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipsModule {}
