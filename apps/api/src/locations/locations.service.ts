import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationEntity } from '../entities/location.entity';
import { GeocodingService, GeocodedLocation } from './geocoding.service';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(LocationEntity)
    private readonly locationRepo: Repository<LocationEntity>,
    private readonly geocodingService: GeocodingService,
  ) {}

  async findAll(teamId: string): Promise<LocationEntity[]> {
    return this.locationRepo.find({ 
      where: { teamId },
      order: { name: 'ASC' } 
    });
  }

  async findOne(teamId: string, id: string): Promise<LocationEntity> {
    const loc = await this.locationRepo.findOne({ where: { id, teamId } });
    if (!loc) throw new NotFoundException(`Location ${id} not found for team ${teamId}`);
    return loc;
  }

  async search(query: string): Promise<GeocodedLocation[]> {
    return this.geocodingService.geocode(query);
  }

  async createFromGeocoded(teamId: string, data: GeocodedLocation & { address?: string }): Promise<LocationEntity> {
    // Check for existing location by lat/lon for THIS team to avoid duplicates
    const existing = await this.locationRepo.createQueryBuilder('loc')
      .where('loc.team_id = :teamId', { teamId })
      .andWhere('ABS(loc.lat - :lat) < 0.0001', { lat: data.lat })
      .andWhere('ABS(loc.lon - :lon) < 0.0001', { lon: data.lon })
      .getOne();

    if (existing) return existing;

    const loc = this.locationRepo.create({
      teamId,
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.postcode || '',
      lat: data.lat,
      lon: data.lon,
    });

    return this.locationRepo.save(loc);
  }

  async createManual(teamId: string, data: Partial<LocationEntity>): Promise<LocationEntity> {
    let { lat, lon } = data;

    if (!lat || !lon) {
      const query = `${data.address || ''} ${data.city || ''} ${data.state || ''} ${data.zipCode || ''}`.trim();
      const results = await this.geocodingService.geocode(query);
      
      if (results.length > 0) {
        lat = results[0].lat;
        lon = results[0].lon;
      } else {
        const fallbackQuery = `${data.city || ''} ${data.state || ''} ${data.zipCode || ''}`.trim();
        const fallbackResults = await this.geocodingService.geocode(fallbackQuery);
        if (fallbackResults.length > 0) {
          lat = fallbackResults[0].lat;
          lon = fallbackResults[0].lon;
        }
      }
    }

    const loc = this.locationRepo.create({
      ...data,
      teamId,
      lat,
      lon,
    });

    return this.locationRepo.save(loc);
  }
}
