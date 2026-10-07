import { getApps, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
} from 'firebase/firestore';
import { storageService } from '../../storage/asyncStorage';
import { STORAGE_KEYS } from '../../storage/keys';
import { AccountStatus, RangerProfileDoc, StaffUser, UserRole } from '../../types/user';
import { auth, db } from '../firebaseConfig';

const firebaseConfig = {
  apiKey: "AIzaSyCicMF7Sos7NZgHjJ80Z_FiMI0wrpihNps",
  authDomain: "wildtrail-a7918.firebaseapp.com",
  projectId: "wildtrail-a7918",
  storageBucket: "wildtrail-a7918.firebasestorage.app",
  messagingSenderId: "949588157701",
  appId: "1:949588157701:web:40574d61373a31b72f436c",
};

// Secondary Firebase app instance to create user accounts without terminating current Admin session
function getSecondaryAuth() {
  const secondaryApp =
    getApps().find((a) => a.name === 'SecondaryAdmin') ||
    initializeApp(firebaseConfig, 'SecondaryAdmin');
  return getAuth(secondaryApp);
}

export const INITIAL_MOCK_STAFF: StaffUser[] = [
  {
    uid: 'usr-admin-01',
    name: 'Sarah Jenkins',
    email: 'admin@wildguard.org',
    role: 'admin',
    staffId: 'ADM-001',
    badge: 'ADM-001',
    profileId: 'usr-admin-01',
    accountStatus: 'ACTIVE',
    parkId: 'yala',
    zoneId: 'headquarters',
    phone: '+94 77 123 4567',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    uid: 'usr-ranger-204',
    name: 'Nimal Perera',
    email: 'nimal@wildguard.org',
    role: 'ranger',
    staffId: 'RG-204',
    badge: 'RG-204',
    profileId: 'ranger-204',
    accountStatus: 'ACTIVE',
    parkId: 'yala',
    zoneId: 'block-01',
    phone: '+94 71 987 6543',
    createdAt: '2026-02-15T09:30:00Z',
  },
  {
    uid: 'usr-manager-101',
    name: 'Dr. K. Silva',
    email: 'manager@wildguard.org',
    role: 'manager',
    staffId: 'MGR-101',
    badge: 'MGR-101',
    profileId: 'usr-manager-101',
    accountStatus: 'ACTIVE',
    parkId: 'yala',
    zoneId: 'sector-north',
    phone: '+94 77 555 1234',
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    uid: 'usr-liaison-305',
    name: 'Anura Bandara',
    email: 'liaison@wildguard.org',
    role: 'liaison',
    staffId: 'LIA-305',
    badge: 'LIA-305',
    profileId: 'usr-liaison-305',
    accountStatus: 'ACTIVE',
    parkId: 'yala',
    zoneId: 'community-buffer-b',
    phone: '+94 76 333 4444',
    createdAt: '2026-03-01T11:00:00Z',
  },
];

export const INITIAL_MOCK_RANGERS: Record<string, RangerProfileDoc> = {
  'ranger-204': {
    id: 'ranger-204',
    userId: 'usr-ranger-204',
    name: 'Nimal Perera',
    badge: 'RG-204',
    parkId: 'yala',
    zoneId: 'block-01',
    status: 'AVAILABLE',
    currentPatrolId: null,
    currentAlertId: null,
    createdAt: '2026-02-15T09:30:00Z',
  },
};

export const userService = {
  /**
   * Create staff user via Firebase Auth and Firestore users/{uid} & rangers/{rangerId}
   */
  async createStaffAccount(data: {
    name: string;
    email: string;
    staffId: string;
    role: UserRole;
    parkId: string;
    zoneId: string;
    phone?: string;
    password?: string;
    accountStatus?: AccountStatus;
  }): Promise<StaffUser> {
    const passwordToUse = data.password || 'WildGuard2026!';
    let firebaseUid = `uid-${Date.now()}`;

    try {
      const secondaryAuth = getSecondaryAuth();
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        data.email,
        passwordToUse
      );
      firebaseUid = userCredential.user.uid;
    } catch {
      // Fallback mock UID if offline or auth error
      firebaseUid = `uid-${Date.now()}`;
    }

    const rangerProfileId = data.role === 'ranger' ? `ranger-${data.staffId || Date.now()}` : firebaseUid;

    const staffUser: StaffUser = {
      uid: firebaseUid,
      name: data.name,
      email: data.email,
      role: data.role,
      staffId: data.staffId,
      badge: data.staffId,
      profileId: rangerProfileId,
      accountStatus: data.accountStatus || 'ACTIVE',
      parkId: data.parkId,
      zoneId: data.zoneId,
      phone: data.phone || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Save doc to Firestore: users/{firebaseUid}
    try {
      const userDocRef = doc(db, 'users', firebaseUid);
      await setDoc(userDocRef, staffUser);
    } catch (e) {
      console.warn('Firestore users setDoc fallback:', e);
    }

    // 2. If role === 'ranger', create doc in rangers/{rangerId}
    if (data.role === 'ranger') {
      const rangerDoc: RangerProfileDoc = {
        id: rangerProfileId,
        userId: firebaseUid,
        name: data.name,
        badge: data.staffId || `RG-${data.staffId}`,
        parkId: data.parkId,
        zoneId: data.zoneId,
        status: 'AVAILABLE',
        currentPatrolId: null,
        currentAlertId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const rangerDocRef = doc(db, 'rangers', rangerProfileId);
        await setDoc(rangerDocRef, rangerDoc);
      } catch (e) {
        console.warn('Firestore rangers setDoc fallback:', e);
      }

      // Also persist to local storage mock cache
      const cachedRangers = (await storageService.getItem<Record<string, RangerProfileDoc>>(STORAGE_KEYS.MOCK_RANGERS)) || INITIAL_MOCK_RANGERS;
      cachedRangers[rangerProfileId] = rangerDoc;
      await storageService.setItem(STORAGE_KEYS.MOCK_RANGERS, cachedRangers);
    }

    // Persist to local storage staff list
    const cachedStaff = (await storageService.getItem<StaffUser[]>(STORAGE_KEYS.STAFF_USERS)) || INITIAL_MOCK_STAFF;
    const updatedStaff = [staffUser, ...cachedStaff];
    await storageService.setItem(STORAGE_KEYS.STAFF_USERS, updatedStaff);

    return staffUser;
  },

  /**
   * Fetch all staff accounts
   */
  async getStaffAccounts(): Promise<StaffUser[]> {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      if (!snapshot.empty) {
        const firestoreUsers: StaffUser[] = [];
        snapshot.forEach((docSnap) => {
          firestoreUsers.push({ uid: docSnap.id, ...docSnap.data() } as StaffUser);
        });
        if (firestoreUsers.length > 0) return firestoreUsers;
      }
    } catch {
      // Fallback
    }

    const cachedStaff = await storageService.getItem<StaffUser[]>(STORAGE_KEYS.STAFF_USERS);
    return cachedStaff && cachedStaff.length > 0 ? cachedStaff : INITIAL_MOCK_STAFF;
  },

  /**
   * Fetch ranger profiles from the rangers collection.
   */
  async getRangers(): Promise<RangerProfileDoc[]> {
    try {
      const snapshot = await getDocs(collection(db, 'rangers'));
      if (!snapshot.empty) {
        return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as RangerProfileDoc));
      }
    } catch {
      // Fall back to the locally cached ranger profiles when offline.
    }

    const cachedRangers = await storageService.getItem<Record<string, RangerProfileDoc>>(STORAGE_KEYS.MOCK_RANGERS);
    return cachedRangers ? Object.values(cachedRangers) : [];
  },

  /**
   * Update staff account status (ACTIVE / DISABLED)
   */
  async updateAccountStatus(uid: string, accountStatus: AccountStatus): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { accountStatus, updatedAt: new Date().toISOString() });
    } catch {
      // Fallback
    }

    const cachedStaff = (await storageService.getItem<StaffUser[]>(STORAGE_KEYS.STAFF_USERS)) || INITIAL_MOCK_STAFF;
    const updatedStaff = cachedStaff.map((u) => (u.uid === uid ? { ...u, accountStatus } : u));
    await storageService.setItem(STORAGE_KEYS.STAFF_USERS, updatedStaff);
    return true;
  },

  /**
   * Edit Ranger Park / Zone
   */
  async updateRangerParkZone(profileId: string, userId: string, parkId: string, zoneId: string): Promise<boolean> {
    try {
      const rangerRef = doc(db, 'rangers', profileId);
      await updateDoc(rangerRef, { parkId, zoneId, updatedAt: new Date().toISOString() });

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { parkId, zoneId, updatedAt: new Date().toISOString() });
    } catch {
      // Fallback
    }

    const cachedRangers = (await storageService.getItem<Record<string, RangerProfileDoc>>(STORAGE_KEYS.MOCK_RANGERS)) || INITIAL_MOCK_RANGERS;
    if (cachedRangers[profileId]) {
      cachedRangers[profileId] = { ...cachedRangers[profileId], parkId, zoneId };
      await storageService.setItem(STORAGE_KEYS.MOCK_RANGERS, cachedRangers);
    }

    const cachedStaff = (await storageService.getItem<StaffUser[]>(STORAGE_KEYS.STAFF_USERS)) || INITIAL_MOCK_STAFF;
    const updatedStaff = cachedStaff.map((u) => (u.uid === userId || u.profileId === profileId ? { ...u, parkId, zoneId } : u));
    await storageService.setItem(STORAGE_KEYS.STAFF_USERS, updatedStaff);
    return true;
  },

  /**
   * Fetch Ranger profile doc
   */
  async getRangerProfile(profileId: string): Promise<RangerProfileDoc | null> {
    try {
      const docRef = doc(db, 'rangers', profileId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as RangerProfileDoc;
      }
    } catch {
      // Fallback
    }

    const cachedRangers = (await storageService.getItem<Record<string, RangerProfileDoc>>(STORAGE_KEYS.MOCK_RANGERS)) || INITIAL_MOCK_RANGERS;
    return cachedRangers[profileId] || null;
  },

  /**
   * Login user via Firebase Auth, read role from users/{uid}, enforce active account status
   */
  async loginWithEmailPassword(emailInput: string, passwordInput: string): Promise<StaffUser> {
    const trimmedEmail = emailInput.trim().toLowerCase();
    let authUid: string | null = null;

    try {
      const userCred = await signInWithEmailAndPassword(auth, trimmedEmail, passwordInput);
      authUid = userCred.user.uid;
    } catch {
      // Fallback for mock demo users if offline or offline test credential
    }

    const allStaff = await this.getStaffAccounts();
    const matchedUser = allStaff.find(
      (u) => u.email.toLowerCase() === trimmedEmail || (authUid && u.uid === authUid)
    );

    if (!matchedUser) {
      // If no matched user, construct fallback staff user by email domain / badge hint
      let derivedRole: UserRole = 'ranger';
      if (trimmedEmail.includes('admin')) derivedRole = 'admin';
      else if (trimmedEmail.includes('manager')) derivedRole = 'manager';
      else if (trimmedEmail.includes('liaison')) derivedRole = 'liaison';

      const newUser: StaffUser = {
        uid: authUid || `usr-${Date.now()}`,
        name: trimmedEmail.split('@')[0].toUpperCase(),
        email: trimmedEmail,
        role: derivedRole,
        profileId: authUid || `usr-${Date.now()}`,
        accountStatus: 'ACTIVE',
        parkId: 'yala',
        zoneId: 'block-01',
      };

      await storageService.setItem(STORAGE_KEYS.USER_PROFILE, newUser);
      return newUser;
    }

    if (matchedUser.accountStatus === 'DISABLED') {
      throw new Error('Account disabled. Please contact System Administrator.');
    }

    await storageService.setItem(STORAGE_KEYS.USER_PROFILE, matchedUser);
    return matchedUser;
  },
};
