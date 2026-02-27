import * as admin from 'firebase-admin';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FirebaseService {
  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
  }

  async verifyToken(token: string) {
    return admin.auth().verifyIdToken(token);
  }

  // async verifyTokenAp(idToken: string) {
  //   try {
  //     const decoded = await admin.auth().verifyIdToken(idToken);
  //     return decoded;
  //   } catch (error) {
  //     throw new UnauthorizedException('Invalid OTP token');
  //   }
  // }

}
