/**
 * @fileOverview Defines the shared Post type to avoid circular dependencies.
 */
import type { SocialFeedItem } from '@/ai/schemas/social-feed-item-schema';
import { Timestamp } from 'firebase/firestore';

// This is the version of the post passed from Server to Client components.
// The Timestamp is converted to a string to be serializable.
export type PostWithId = Omit<SocialFeedItem, 'createdAt' | 'likes'> & {
  id: string;
  createdAt?: string;
  collectionName: 'feedItems' | 'dailyTopics';
  likes: number;
};

// This is the version of the comment passed from Server to Client components.
export type CommentWithId = {
    id: string;
    text: string;
    author: string;
    avatar: string;
    userId: string;
    createdAt?: string; // Serialized for client
}
