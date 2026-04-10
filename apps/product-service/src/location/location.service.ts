import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LocationService {

    async getAddress(lat: number, lng: number) {

        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

        try {

            const res = await axios.get(url, {
                headers: {
                    'User-Agent': 'gitagged-app',
                },
            });

            const data = res.data;

            return {
                addressLine: data.display_name,
                city: data.address.city || data.address.town || data.address.village || data.address.county || '',
                state: data.address.state,
                pincode: data.address.postcode,
                lat,
                lng,
            };
        } catch (err) {
            console.error('Error fetching address:', err);
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