
"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db, initializationError } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, increment, collection, query, where, writeBatch, getDocs, runTransaction } from 'firebase/firestore';
import type { Poll } from '@/ai/schemas/social-feed-item-schema';

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "bimex4@gmail.com").toLowerCase();

export interface UserProfile {
  handle: string;
  points: number;
  publicName: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  likedPosts: Set<string>;
  votedOnPolls: Map<string, string[]>; // <postId, optionTexts[]>
  signOut: () => Promise<void>;
  addPoints: (amount: number) => Promise<void>;
  addLike: (postId: string, collectionName: 'feedItems' | 'dailyTopics') => Promise<void>;
  removeLike: (postId: string, collectionName: 'feedItems' | 'dailyTopics') => Promise<void>;
  voteOnPoll: (postId: string, collectionName: 'feedItems' | 'dailyTopics', selectedOptions: string[], poll: Poll) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    if (!isUnique) return `${baseHandle}${Date.now()}`;
    return handle;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [votedOnPolls, setVotedOnPolls] = useState<Map<string, string[]>>(new Map());

  const addPoints = useCallback(async (amount: number) => {
    if (!user || !db || user.email?.toLowerCase() === ADMIN_EMAIL) return;
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
    setLikedPosts(prev => new Set(prev).add(postId));
    try {
        const batch = writeBatch(db);
        const postRef = doc(db, collectionName, postId);
        batch.update(postRef, { likes: increment(1) });
        const likeRef = doc(db, "likes", `${user.uid}_${postId}`);
        batch.set(likeRef, { userId: user.uid, postId: postId, createdAt: serverTimestamp() });
        await batch.commit();
    } catch(e) {
        setLikedPosts(prev => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
        });
        throw e;
    }
  }, [user]);

  const removeLike = useCallback(async (postId: string, collectionName: 'feedItems' | 'dailyTopics') => {
    if (!user || !db) return;
    setLikedPosts(prev => {
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
        setLikedPosts(prev => new Set(prev).add(postId));
        throw e;
    }
  }, [user]);

  const voteOnPoll = useCallback(async (postId: string, collectionName: 'feedItems' | 'dailyTopics', selectedOptions: string[], poll: Poll) => {
      if (!user || !db) throw new Error("User not authenticated");
      
      setVotedOnPolls(prev => new Map(prev).set(postId, selectedOptions));

      try {
          const voteRef = doc(db, "pollVotes", `${user.uid}_${postId}`);
          const postRef = doc(db, collectionName, postId);

          await runTransaction(db, async (transaction) => {
              const voteDoc = await transaction.get(voteRef);
              if (voteDoc.exists()) {
                  throw new Error("You have already voted on this poll.");
              }

              const postDoc = await transaction.get(postRef);
              if (!postDoc.exists()) throw new Error("Post does not exist.");
              
              const currentPollData = postDoc.data().poll as Poll;
              if (!currentPollData) throw new Error("Poll data is missing from the post.");
              
              const newOptions = currentPollData.options.map(opt => {
                  if (selectedOptions.includes(opt.text)) {
                      return { ...opt, votes: (opt.votes || 0) + 1 };
                  }
                  return opt;
              });
              
              transaction.update(postRef, { 'poll.options': newOptions });
              transaction.set(voteRef, { userId: user.uid, postId: postId, options: selectedOptions, createdAt: serverTimestamp() });
          });
      } catch (error) {
          setVotedOnPolls(prev => {
              const newMap = new Map(prev);
              newMap.delete(postId);
              return newMap;
          });
          console.error("Error casting vote:", error);
          throw error;
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

            if (currentUser.email?.toLowerCase() === ADMIN_EMAIL) {
                setProfile({ handle: '@admin', points: 0, publicName: true });
                setLikedPosts(new Set());
                setVotedOnPolls(new Map());
            } else {
                const userRef = doc(db, 'users', currentUser.uid);
                const likesQuery = query(collection(db, 'likes'), where('userId', '==', currentUser.uid));
                const pollVotesQuery = query(collection(db, "pollVotes"), where("userId", "==", currentUser.uid));
                
                const [docSnap, likesSnap, pollVotesSnap] = await Promise.all([
                    getDoc(userRef),
                    getDocs(likesQuery),
                    getDocs(pollVotesQuery)
                ]);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProfile({ points: 0, publicName: true, ...data } as UserProfile);
                } else {
                    const baseHandle = (currentUser.displayName || currentUser.email?.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                    const uniqueHandle = await findUniqueHandle(baseHandle);
                    
                    const newProfile: UserProfile = { handle: `@${uniqueHandle}`, points: 0, publicName: true };

                    const batch = writeBatch(db);
                    batch.set(userRef, { ...newProfile, email: currentUser.email, createdAt: serverTimestamp(), displayName: currentUser.displayName });
                    batch.set(doc(db, 'handles', uniqueHandle), { userId: currentUser.uid });
                    await batch.commit();
                    
                    setProfile(newProfile);
                }

                const userLikedPosts = new Set(likesSnap.docs.map(d => d.data().postId));
                setLikedPosts(userLikedPosts);

                const userVotedPolls = new Map<string, string[]>();
                pollVotesSnap.forEach(doc => {
                    userVotedPolls.set(doc.data().postId, doc.data().options);
                });
                setVotedOnPolls(userVotedPolls);
            }
        } else {
          setUser(null);
          setProfile(null);
          setLikedPosts(new Set());
          setVotedOnPolls(new Map());
        }
      } catch (error) {
        console.error("Error in onAuthStateChanged:", error);
        // If an error occurs (like permissions), sign out the user to prevent a broken state
        if (auth.currentUser) {
            await firebaseSignOut(auth);
        }
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

  const value = useMemo(() => ({ user, profile, loading, signOut, addPoints, likedPosts, addLike, removeLike, votedOnPolls, voteOnPoll }), [user, profile, loading, signOut, addPoints, likedPosts, addLike, removeLike, votedOnPolls, voteOnPoll]);
  
  if (initializationError) {
    const errorValue = {
        user: null,
        profile: null,
        loading: false,
        likedPosts: new Set<string>(),
        votedOnPolls: new Map<string, string[]>(),
        signOut: async () => { console.error("Firebase not initialized."); },
        addPoints: async () => { console.error("Firebase not initialized."); },
        addLike: async () => { console.error("Firebase not initialized."); },
        removeLike: async () => { console.error("Firebase not initialized."); },
        voteOnPoll: async () => { console.error("Firebase not initialized."); throw new Error("Firebase not initialized."); },
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
