import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class LocationService {

    constructor(private configService: ConfigService) { }

    async getAddress(lat: number, lng: number) {

        const apiKey = this.configService.get<string>('GOOGLE_GEOCODING_API_KEY');

        const url =
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

        try {

            const res = await axios.get(url);

            console.log(JSON.stringify(res.data, null, 2));

            const result = res.data.results[0];

            const components = result.address_components;

            let houseNumber = '';
            let plot = '';
            let street = '';
            let area = '';
            let landmark = '';
            let city = '';
            let state = '';
            let pincode = '';

            for (const c of components) {

                // house number
                if (c.types.includes('street_number')) {
                    houseNumber = c.long_name;
                }

                // Plot / Building
                if (
                    c.types.includes('premise') ||
                    c.types.includes('subpremise')
                ) {
                    plot = c.long_name;
                }

                // Street
                if (c.types.includes('route')) {
                    street = c.long_name;
                }

                // Area / locality
                if (
                    c.types.includes('sublocality') ||
                    c.types.includes('sublocality_level_1')
                ) {
                    area = c.long_name;
                }

                // City
                if (
                    c.types.includes('locality')
                ) {
                    city = c.long_name;
                }

                // State
                if (
                    c.types.includes('administrative_area_level_1')
                ) {
                    state = c.long_name;
                }

                // Pincode
                if (
                    c.types.includes('postal_code')
                ) {
                    pincode = c.long_name;
                }

                // Landmark
                if (
                    c.types.includes('point_of_interest')
                ) {
                    landmark = c.long_name;
                }
            }

            const addressLine = [
                houseNumber,
                plot,
                street,
                landmark ? `near ${landmark}` : '',
                area,
            ]
                .filter(Boolean)
                .join(', ');

            return {
                addressLine,
                city,
                state,
                pincode,
                lat,
                lng,
            };

        } catch (err: any) {

            console.log(err.response?.data || err.message);
            return {

                addressLine: '',
                city: '',
                state: '',
                pincode: '',
                lat,
                lng,
            };
        }
    }
}