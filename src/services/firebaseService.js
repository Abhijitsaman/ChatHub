import { db } from '../firebase/config';
import { ref, set, push, get, update, remove, query, orderByChild, limitToLast, onValue, off, serverTimestamp } from 'firebase/database';

export class FirebaseService {
  static ref(path) {
    return ref(db, path);
  }

  static async set(path, data) {
    const reference = typeof path === 'string' ? ref(db, path) : path;
    return set(reference, data);
  }

  static async push(path, data) {
    const reference = typeof path === 'string' ? ref(db, path) : path;
    const newRef = push(reference);
    await set(newRef, data);
    return newRef.key;
  }

  static async get(path) {
    const reference = typeof path === 'string' ? ref(db, path) : path;
    const snapshot = await get(reference);
    return snapshot.val();
  }

  static async update(path, data) {
    const reference = typeof path === 'string' ? ref(db, path) : path;
    return update(reference, data);
  }

  static async remove(path) {
    const reference = typeof path === 'string' ? ref(db, path) : path;
    return remove(reference);
  }

  static on(path, callback) {
    const reference = typeof path === 'string' ? ref(db, path) : path;
    return onValue(reference, (snapshot) => {
      callback(snapshot.val());
    });
  }

  static off(path) {
    const reference = typeof path === 'string' ? ref(db, path) : path;
    return off(reference);
  }

  static query(path, constraints) {
    let reference = typeof path === 'string' ? ref(db, path) : path;
    if (constraints) {
      if (constraints.orderByChild) {
        reference = query(reference, orderByChild(constraints.orderByChild));
      }
      if (constraints.limitToLast) {
        reference = query(reference, limitToLast(constraints.limitToLast));
      }
    }
    return reference;
  }

  static getTimestamp() {
    return serverTimestamp();
  }
}
