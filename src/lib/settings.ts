
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { BackgroundType } from '@/contexts/background-context';

export type SiteSettings = {
  defaultBackground: BackgroundType;
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const defaultConfig: SiteSettings = { defaultBackground: 'grid' };
  if (!db) {
    return defaultConfig;
  }
  try {
    const settingsRef = doc(db, 'settings', 'site_config');
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
      return { ...defaultConfig, ...docSnap.data() } as SiteSettings;
    }
    return defaultConfig;
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return defaultConfig;
  }
}
