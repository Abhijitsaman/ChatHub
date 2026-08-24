import { db } from '../firebase/config';
import { serverTimestamp } from 'firebase/firestore';

export class FirebaseService {
  static getTimestamp() {
    return serverTimestamp();
  }
}
