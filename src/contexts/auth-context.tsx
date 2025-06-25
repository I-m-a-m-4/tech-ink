
"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db, initializationError } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, increment, collection, query, where, writeBatch, deleteDoc, getDocs } from 'firebase/firestore';

export interface UserProfile {
  handle: string;
  points: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  likedPosts: Set<string>;
  signOut: () => Promise<void>;
  addPoints: (amount: number) => Promise<void>;
  addLike: (postId: string, collectionName: 'feedItems' | 'dailyTopics') => Promise<void>;
  removeLike: (postId: string, collectionName: 'feedItems' | 'dailyTopics') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to check handle uniqueness and find an available one.
const findUniqueHandle = async (baseHandle: string): Promise<string> => {
    if (!db) throw new Error("Firestore not initialized");
    let handle = baseHandle;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
        const handleDocRef = doc(db, 'handles', handle);
        const docSnap = await getDoc(handleDocRef);
        if (!docSnap.exists()) {
            isUnique = true;
        } else {
            handle = `${baseHandle}${Math.floor(100 + Math.random() * 900)}`;
        }
        attempts++;
    }
    if (!isUnique) return `${baseHandle}${Date.now()}`; // Fallback for rare cases
    return handle;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const addPoints = useCallback(async (amount: number) => {
    if (!user || !db) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, { points: increment(amount) });
      setProfile(prevProfile => prevProfile ? { ...prevProfile, points: prevProfile.points + amount } : null);
    } catch (error) {
      console.error("Error adding points: ", error);
    }
  }, [user]);

  const addLike = useCallback(async (postId: string, collectionName: 'feedItems' | 'dailyTopics') => {
    if (!user || !db) return;
    setLikedPosts(prev => new Set(prev).add(postId)); // Optimistic update
    try {
        const batch = writeBatch(db);
        const postRef = doc(db, collectionName, postId);
        batch.update(postRef, { likes: increment(1) });
        const likeRef = doc(db, "likes", `${user.uid}_${postId}`);
        batch.set(likeRef, { userId: user.uid, postId: postId, createdAt: serverTimestamp() });
        await batch.commit();
    } catch(e) {
        setLikedPosts(prev => { // Revert on failure
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
        });
        throw e;
    }
  }, [user]);

  const removeLike = useCallback(async (postId: string, collectionName: 'feedItems' | 'dailyTopics') => {
    if (!user || !db) return;
    setLikedPosts(prev => { // Optimistic update
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
    });

    try {
        const batch = writeBatch(db);
        const postRef = doc(db, collectionName, postId);
        batch.update(postRef, { likes: increment(-1) });
        const likeRef = doc(db, "likes", `${user.uid}_${postId}`);
        batch.delete(likeRef);
        await batch.commit();
    } catch (e) {
        setLikedPosts(prev => new Set(prev).add(postId)); // Revert on failure
        throw e;
    }
  }, [user]);

  useEffect(() => {
    if (initializationError || !auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          const userRef = doc(db, 'users', currentUser.uid);
          const likesQuery = query(collection(db, 'likes'), where('userId', '==', currentUser.uid));
          
          const [docSnap, likesSnap] = await Promise.all([
            getDoc(userRef),
            getDocs(likesQuery)
          ]);

          if (docSnap.exists()) {
            setProfile({ points: 0, ...docSnap.data() } as UserProfile);
          } else {
            const baseHandle = (currentUser.displayName || currentUser.email?.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
            const uniqueHandle = await findUniqueHandle(baseHandle);
            
            const newProfile: UserProfile = {
              handle: `@${uniqueHandle}`,
              points: 0,
            };

            const batch = writeBatch(db);
            batch.set(userRef, {
              ...newProfile,
              email: currentUser.email,
              createdAt: serverTimestamp(),
              displayName: currentUser.displayName,
            });
            batch.set(doc(db, 'handles', uniqueHandle), { userId: currentUser.uid });
            await batch.commit();
            
            setProfile(newProfile);
          }

          const userLikedPosts = new Set(likesSnap.docs.map(d => d.data().postId));
          setLikedPosts(userLikedPosts);

        } else {
          setUser(null);
          setProfile(null);
          setLikedPosts(new Set());
        }
      } catch (error) {
        console.error("Error in onAuthStateChanged:", error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
  }, []);

  const value = useMemo(() => ({ user, profile, loading, signOut, addPoints, likedPosts, addLike, removeLike }), [user, profile, loading, signOut, addPoints, likedPosts, addLike, removeLike]);
  
  if (initializationError) {
    const errorValue = {
        user: null,
        profile: null,
        loading: false,
        likedPosts: new Set<string>(),
        signOut: async () => { console.error("Firebase not initialized."); },
        addPoints: async () => { console.error("Firebase not initialized."); },
        addLike: async () => { console.error("Firebase not initialized."); },
        removeLike: async () => { console.error("Firebase not initialized."); },
    };
    return <AuthContext.Provider value={errorValue}>{children}</AuthContext.Provider>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
