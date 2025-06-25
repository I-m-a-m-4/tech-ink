
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
    const batch = writeBatch(db);
    const postRef = doc(db, collectionName, postId);
    batch.update(postRef, { likes: increment(1) });
    const likeRef = doc(db, "likes", `${user.uid}_${postId}`);
    batch.set(likeRef, { userId: user.uid, postId: postId, createdAt: serverTimestamp() });
    await batch.commit();
    setLikedPosts(prev => new Set(prev).add(postId));
  }, [user]);

  const removeLike = useCallback(async (postId: string, collectionName: 'feedItems' | 'dailyTopics') => {
    if (!user || !db) return;
    const batch = writeBatch(db);
    const postRef = doc(db, collectionName, postId);
    batch.update(postRef, { likes: increment(-1) });
    const likeRef = doc(db, "likes", `${user.uid}_${postId}`);
    batch.delete(likeRef);
    await batch.commit();
    setLikedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
    });
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
            const newProfile: UserProfile = {
              handle: `@${(currentUser.displayName || currentUser.email?.split('@')[0] || 'user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}${Math.floor(100 + Math.random() * 900)}`,
              points: 0,
            };
            await setDoc(userRef, {
              ...newProfile,
              email: currentUser.email,
              createdAt: serverTimestamp(),
              displayName: currentUser.displayName,
            });
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
    // Gracefully fail. The app will behave as if the user is logged out.
    // The console will show the detailed error.
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
