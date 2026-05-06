import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationEntity } from '../entities/location.entity';
import { LocationsService } from './locations.service';
import { GeocodingService } from './geocoding.service';
import { LocationsController } from './locations.controller';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LocationEntity]),
    MembershipsModule,
  ],
  controllers: [LocationsController],
  providers: [LocationsService, GeocodingService],
  exports: [LocationsService, GeocodingService],
})
export class LocationsModule {}
