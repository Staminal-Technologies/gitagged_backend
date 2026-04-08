import { Controller, Post, Body } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('location')
export class LocationController {
  constructor(private locationService: LocationService) {}

  @Post('reverse')
  reverseGeocode(@Body() body: { lat: number; lng: number }) {
    return this.locationService.getAddress(body.lat, body.lng);
  }
}