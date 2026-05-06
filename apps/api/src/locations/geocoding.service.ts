import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface GeocodedLocation {
  name: string;
  lat: number;
  lon: number;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  postcode?: string;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  /**
   * Searches for a location using Photon (OpenStreetMap based).
   * No API key required.
   */
  async geocode(query: string): Promise<GeocodedLocation[]> {
    try {
      const response = await axios.get(`https://photon.komoot.io/api/`, {
        params: {
          q: query,
          limit: 10, // Fetch more to allow for filtering duplicates
        },
      });

      if (!response.data || !response.data.features) {
        return [];
      }

      const results: GeocodedLocation[] = response.data.features.map((feature: any) => {
        const props = feature.properties;
        const coords = feature.geometry.coordinates;

        // 1. Build a precise Primary Name
        // Prefer the place name if available, otherwise use street address
        let name = '';
        if (props.name) {
          name = props.name;
        } else if (props.housenumber && props.street) {
          name = `${props.housenumber} ${props.street}`;
        } else {
          name = props.street || props.city || 'Unknown Location';
        }

        // 2. Build the detailed address string for storage
        const addressParts = [props.housenumber, props.street].filter(Boolean);
        const address = addressParts.join(' ');

        return {
          name: name,
          lat: coords[1],
          lon: coords[0],
          city: props.city || props.locality,
          state: props.state,
          country: props.country,
          address: address,
          postcode: props.postcode,
        };
      });

      // 3. Filter duplicates that would look identical in the UI
      const seen = new Set<string>();
      return results.filter(res => {
        const displayKey = `${res.name}|${res.city}|${res.state}|${res.postcode}`.toLowerCase();
        if (seen.has(displayKey)) return false;
        seen.add(displayKey);
        return true;
      }).slice(0, 5); // Return top 5 unique results

    } catch (error) {
      this.logger.error(`Photon geocoding failed for "${query}": ${error.message}`);
      return [];
    }
  }

  /**
   * Reverse geocoding using Photon.
   */
  async reverseGeocode(lat: number, lon: number): Promise<GeocodedLocation[]> {
    try {
      const response = await axios.get(`https://photon.komoot.io/reverse`, {
        params: {
          lat,
          lon,
        },
      });

      if (!response.data || !response.data.features) {
        return [];
      }

      return response.data.features.map((feature: any) => {
        const props = feature.properties;
        const coords = feature.geometry.coordinates;

        return {
          name: props.name || props.city || 'Unknown',
          lat: coords[1],
          lon: coords[0],
          city: props.city || props.locality,
          state: props.state,
          country: props.country,
          postcode: props.postcode,
        };
      });
    } catch (error) {
      this.logger.error(`Photon reverse geocoding failed: ${error.message}`);
      return [];
    }
  }
}
