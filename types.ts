// Fix: Define and export all necessary types for the application.
// This file should only contain type definitions, not React components.

export interface User {
  id: string;
  name: string;
  isOnline: boolean;
  profilePicture?: string;
}

export interface Reaction {
  emoji: string;
  users: string[]; // array of user IDs
}

export interface PollOption {
    id: string;
    text: string;
    votes: string[]; // array of user IDs
}

export interface Poll {
    id: string;
    question: string;
    options: PollOption[];
    location?: string;
}

export interface MessageFile {
    url: string;
    name: string;
    type: string;
}

export interface MessageAudio {
    url: string;
    duration: number;
}

export interface MessageLocation {
    latitude: number;
    longitude: number;
}

export interface Message {
  id: string;
  author?: User;
  timestamp: number;
  text: string;
  type?: 'text' | 'system' | 'poll';
  reactions: Reaction[];
  poll?: Poll;
  file?: MessageFile;
  audio?: MessageAudio;
  location?: MessageLocation;
  isEdited?: boolean;
  isPinned?: boolean;
  isDeleted?: boolean;
  deletedBy?: string; // user ID who deleted it
  deletedForEveryone?: boolean;
  replyTo?: string; // message ID being replied to
  status?: 'sent' | 'delivered' | 'seen' | 'sending'; // message delivery status
  roomId?: string;
}

export interface ActiveCall {
  id: string;
  participants: string[]; // array of user IDs
  startedAt: number;
  isGroupCall: boolean;
}

export interface Room {
  id: string;
  name: string;
  type: 'self' | 'ai' | 'group';
  users: string[]; // array of user IDs
  messages: Message[];
  privacy: 'public' | 'private';
  password?: string;
  activeCall?: ActiveCall;
}

export interface SearchResult {
    message: Message;
    roomId: string;
    roomName: string;
}