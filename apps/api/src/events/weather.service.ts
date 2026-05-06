import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import axios from 'axios';
import { EventEntity } from '../entities/event.entity';
import { TeamEntity } from '../entities/team.entity';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly apiKey: string | undefined;

  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepo: Repository<TeamEntity>,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('WEATHER_API_KEY');
  }

  async getForecastForEvent(eventId: string, dateOverride?: Date, forceRefresh = false): Promise<any> {
    if (!this.apiKey || this.apiKey === 'FREE_API_KEY') {
      this.logger.warn('WEATHER_API_KEY is not set or using placeholder. Skipping weather fetch.');
      return null;
    }

    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ['locationRef', 'season', 'season.team', 'season.team.homeLocation'],
    });

    if (!event) return null;

    const targetDate = dateOverride || event.scheduledAt;
    if (!targetDate) return null;

    // WeatherAPI.com daily forecast is available via the forecast.json endpoint
    const now = new Date();
    const eightDaysFromNow = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
    
    // Normalize dates to midnight for comparison
    const targetDateMidnight = new Date(targetDate);
    targetDateMidnight.setHours(0, 0, 0, 0);
    const nowMidnight = new Date(now);
    nowMidnight.setHours(0, 0, 0, 0);

    if (targetDateMidnight < nowMidnight || targetDateMidnight > eightDaysFromNow) {
      this.logger.debug(`Date ${targetDate.toISOString()} is outside forecast window (Now to +8 days).`);
      return null;
    }

    // Check cache (6 hours) - only for persistent events without date override
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    if (!forceRefresh && !dateOverride && event.weatherData && event.weatherLastUpdated && event.weatherLastUpdated > sixHoursAgo) {
      return event.weatherData;
    }

    // Determine lat/lon
    const location = event.locationRef || event.season?.team?.homeLocation;
    
    this.logger.debug(`Location resolution for event ${eventId}:`);
    this.logger.debug(`-- locationRef: ${event.locationId} (lat: ${event.locationRef?.lat}, lon: ${event.locationRef?.lon})`);
    this.logger.debug(`-- homeLocation: ${event.season?.team?.homeLocationId} (lat: ${event.season?.team?.homeLocation?.lat}, lon: ${event.season?.team?.homeLocation?.lon})`);

    if (!location || !location.lat || !location.lon) {
      this.logger.warn(`No coordinates found for event ${eventId} or team home field. Weather skipped.`);
      return null;
    }

    try {
      this.logger.debug(`Fetching weather for ${location.lat},${location.lon} on ${targetDate.toISOString()}`);
      
      const response = await axios.get(`https://api.weatherapi.com/v1/forecast.json`, {
        params: {
          key: this.apiKey,
          q: `${location.lat},${location.lon}`,
          dt: targetDate.toISOString().split('T')[0],
          days: 1,
          aqi: 'no',
          alerts: 'no'
        },
      });

      const daily = response.data.forecast?.forecastday?.[0]?.day;

      if (!daily) {
        this.logger.warn(`No daily forecast found in response from WeatherAPI`);
        return null;
      }

      // Ensure icon has https: prefix
      let icon = daily.condition.icon;
      if (icon && icon.startsWith('//')) {
        icon = `https:${icon}`;
      }

      const weatherData = {
        temp_f: Math.round(daily.maxtemp_f),
        condition: daily.condition.text,
        description: daily.condition.text, // WeatherAPI uses 'text' for both
        icon: icon,
        chance_of_rain: Math.round(daily.daily_chance_of_rain),
      };

      // Only save to DB if it's the primary event date (not a virtual instance)
      if (!dateOverride) {
        event.weatherData = weatherData;
        event.weatherLastUpdated = new Date();
        await this.eventRepo.save(event);
      }

      return weatherData;
    } catch (error) {
      this.logger.error(`WeatherAPI.com failed for event ${eventId}: ${error.message}`);
      return event.weatherData;
    }
  }
}
