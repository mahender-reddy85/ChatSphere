import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  User,
  Room,
  Message,
  Poll,
  SearchResult,
  MessageLocation,
  Reaction,
  MessageFile,
} from '../types';

// Helper type for messages with room ID
type MessageWithRoomId = Message & { roomId: string };

// Extend the Message type to include additional fields
interface ExtendedMessage extends Omit<Message, 'status' | 'reactions' | 'type' | 'file'> {
  status?: 'sent' | 'delivered' | 'seen' | 'sending';
  reactions: Reaction[];
  file?: (MessageFile & { size?: number }) | undefined;
  poll?: Poll;
  isPinned?: boolean;
  isEdited?: boolean;
  type: 'text' | 'system' | 'poll';
  roomId: string;
  isOnline?: boolean;
}

// Room type with extended message type
type ExtendedRoom = Omit<Room, 'messages'> & {
  messages: ExtendedMessage[];
};

import { MOCK_USERS } from '../constants';
import { uploadFile } from '../services/fileService';
import io, { Socket } from 'socket.io-client';

const aiBot = MOCK_USERS['ai-bot'];

export const useChat = (currentUser: User) => {
  const [rooms, setRooms] = useState<ExtendedRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ExtendedRoom | null>(null);
  const [isSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Record<string, Set<string>>>({}); // roomId -> Set of user IDs
  const socketRef = useRef<Socket | null>(null);
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const joinedRooms = useRef<Set<string>>(new Set()); // Track joined rooms to prevent duplicates
  const isConnecting = useRef(false); // Prevent multiple connection attempts

  // Initialize rooms on first render
  useEffect(() => {
    // Helper function to create a properly typed message
    const createMessage = (
      msg: Omit<Message, 'reactions' | 'type'>,
      roomId: string
    ): ExtendedMessage => ({
      ...msg,
      status: 'sent',
      reactions: [],
      type: 'text',
      roomId,
      isOnline: false,
    });

    const selfChatId = `self-chat-${currentUser.id}`;
    const aiChatId = `ai-chat-${currentUser.id}`;

    const selfChatInitialMessage = createMessage(
      {
        id: `msg-self-intro-${currentUser.id}`,
        author: currentUser,
        timestamp: Date.now(),
        text: 'This is your personal space. You can send messages, files, and notes to yourself here.',
      },
      selfChatId
    );

    const aiChatInitialMessage = createMessage(
      {
        id: `msg-ai-intro-${currentUser.id}`,
        author: aiBot,
        timestamp: Date.now(),
        text: "Hello! I'm your AI Assistant. How can I help you today?",
      },
      aiChatId
    );

    const allRooms: ExtendedRoom[] = [
      {
        id: selfChatId,
        name: '(You)',
        type: 'self',
        users: [currentUser.id],
        messages: [selfChatInitialMessage],
        privacy: 'private' as const,
        activeCall: undefined,
      },
      {
        id: aiChatId,
        name: 'AI Assistant',
        type: 'ai' as const,
        users: [currentUser.id, 'ai-bot'],
        messages: [aiChatInitialMessage],
        privacy: 'private' as const,
        activeCall: undefined,
      },
    ];

    setRooms((prevRooms) => (prevRooms.length > 0 ? prevRooms : allRooms));

    if (!activeRoom) {
      const firstRoom = allRooms.find((r) => r.type === 'self') || allRooms[0];
      setActiveRoom(firstRoom);
    }
  }, [currentUser.id]);

  // Load rooms from localStorage on initial load
  useEffect(() => {
    const savedRooms = localStorage.getItem('chatRooms');
    if (savedRooms) {
      try {
        const parsedRooms = JSON.parse(savedRooms);
        setRooms((prevRooms) => {
          // Only set rooms if we don't have any yet (first load)
          return prevRooms.length === 0 ? parsedRooms : prevRooms;
        });
      } catch (e) {
        console.error('Failed to parse saved rooms', e);
      }
    }
  }, []);

  // Save rooms to localStorage whenever they change
  useEffect(() => {
    if (rooms.length > 0) {
      localStorage.setItem('chatRooms', JSON.stringify(rooms));
    }
  }, [rooms]);

  // Initialize socket connection
  useEffect(() => {
    // Skip if already connected or connecting
    if (socketRef.current?.connected || isConnecting.current) {
      return;
    }

    isConnecting.current = true;
    
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL ||
      (import.meta.env.PROD ? 'https://chatsphere-7t8g.onrender.com' : 'http://localhost:5000');
      
    console.log('🔌 Connecting to Socket.IO server at:', backendUrl);
    
    const socket = io(backendUrl, {
      transports: ['websocket'],
      auth: { userId: currentUser.id },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    
    socketRef.current = socket;
    
    // Mark as no longer connecting
    const onConnect = () => {
      isConnecting.current = false;
      console.log('✅ Socket.IO connected');
    };
    
    const onConnectError = (error: Error) => {
      console.error('❌ Socket.IO connection error:', error);
      isConnecting.current = false;
    };
    
    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    
    // Cleanup
    return () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
    };

    // Handle connection
    socket.on('connect', () => {
      console.log('✅ Connected to backend server');
      // Only emit user_online if we're not already connected
      if (!socket.recovered) {
        console.log('📢 Notifying server that user is online');
        socket.emit('user_online', { 
          userId: currentUser.id,
          username: currentUser.name 
        });
      } else {
        console.log('🔄 Socket reconnected, skipping duplicate user_online');
      }
      
      // Re-join any rooms we were in before reconnection
      if (joinedRooms.current.size > 0) {
        console.log(`🔄 Re-joining ${joinedRooms.current.size} rooms after reconnection`);
        joinedRooms.current.forEach(roomId => {
          console.log(`🔄 Re-joining room: ${roomId}`);
          socket.emit('join_room', { 
            roomId,
            userId: currentUser.id,
            userName: currentUser.name,
            isReconnect: true
          });
        });
      }
    });

    // Handle online users update
    socket.on('online_users', (data: { users: string[] }) => {
      setOnlineUsers(new Set(data.users));
    });

    // Handle user online/offline events
    socket.on('user_online', (data: { userId: string }) => {
      setOnlineUsers((prev) => new Set(prev).add(data.userId));
    });

    socket.on('user_offline', (data: { userId: string }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
      // Remove user from typing indicators when they go offline
      setTypingUsers((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((roomId) => {
          updated[roomId].delete(data.userId);
          if (updated[roomId].size === 0) {
            delete updated[roomId];
          }
        });
        return updated;
      });
    });

    socket.on('receive_message', (data: { message: Message }) => {
      const { message } = data;
      const extendedMessage: ExtendedMessage = {
        ...message,
        type: message.type || 'text',
        roomId: message.roomId || '',
        reactions: message.reactions || [],
        status: 'delivered',
      };
      setRooms((prev) =>
        prev.map((r) =>
          r.id === message.roomId
            ? {
                ...r,
                messages: r.messages.some((m) => m.id === message.id)
                  ? r.messages
                  : [...r.messages, extendedMessage],
              }
            : r
        )
      );
      // Update unread counts for other rooms
      if (message.roomId !== activeRoom?.id) {
        setUnreadCounts((prev) => ({ ...prev, [message.roomId]: (prev[message.roomId] || 0) + 1 }));
      }
    });

    socket.on('receive_system_message', (data: { message: Message }) => {
      const { message } = data;
      const extendedMessage: ExtendedMessage = {
        ...message,
        type: message.type || 'system',
        roomId: message.roomId || '',
        reactions: message.reactions || [],
        status: 'delivered',
      };
      setRooms((prev) =>
        prev.map((r) =>
          r.id === message.roomId ? { ...r, messages: [...r.messages, extendedMessage] } : r
        )
      );
    });

    socket.on('message_delivered', (data: { messageId: string }) => {
      const { messageId } = data;
      setRooms((prev) =>
        prev.map((r) =>
          r.id === activeRoom?.id
            ? {
                ...r,
                messages: r.messages.map((m) =>
                  m.id === messageId ? { ...m, status: 'delivered' as const } : m
                ),
              }
            : r
        )
      );
    });

    socket.on('message_edited', (data: { messageId: string; newText: string; roomId: string }) => {
      const { messageId, newText, roomId } = data;
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? {
                ...r,
                messages: r.messages.map((m) =>
                  m.id === messageId
                    ? {
                        ...m,
                        text: newText,
                        isEdited: true,
                        file: undefined,
                        audio: undefined,
                        location: undefined,
                      }
                    : m
                ),
              }
            : r
        )
      );
    });

    socket.on('poll_vote', (data: { messageId: string; optionId: string; userId: string }) => {
      const { messageId, optionId, userId } = data;
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id !== activeRoom?.id) return r;
          const newMessages = r.messages.map((m) => {
            if (m.id !== messageId || !m.poll) return m;

            const newOptions = m.poll.options.map((opt) => {
              if (opt.id === optionId) {
                // Toggle vote: if user has voted for this option, remove vote; otherwise add vote
                const hasVoted = opt.votes.includes(userId);
                const newVotes = hasVoted
                  ? opt.votes.filter((voterId) => voterId !== userId)
                  : [...opt.votes, userId];
                return { ...opt, votes: newVotes };
              }
              // Keep votes on other options (multiple choice poll)
              return opt;
            });

            return { ...m, poll: { ...m.poll, options: newOptions } };
          });
          return { ...r, messages: newMessages };
        })
      );
    });

    socket.on('message_status_update', (data: { messageIds: string[]; status: 'seen' }) => {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === activeRoom?.id
            ? {
                ...r,
                messages: r.messages.map((m) =>
                  data.messageIds.includes(m.id) ? { ...m, status: 'seen' as const } : m
                ),
              }
            : r
        )
      );
    });

    // Handle typing indicators
    socket.on(
      'user_typing',
      (data: {
        userId: string;
        roomId: string;
        isTyping: boolean;
        isSelf?: boolean;
        timestamp?: number;
      }) => {
        console.log('Received typing event:', data);

        // Skip if it's the current user (unless it's a self-event for debugging)
        if (data.userId === currentUser.id && !data.isSelf) return;

        setTypingUsers((prev) => {
          const updated = { ...prev };

          if (data.isTyping) {
            if (!updated[data.roomId]) {
              updated[data.roomId] = new Set();
            }
            updated[data.roomId].add(data.userId);

            // Clear any existing timeout for this user
            const timeoutKey = `${data.roomId}-${data.userId}`;
            if (typingTimeouts.current[timeoutKey]) {
              clearTimeout(typingTimeouts.current[timeoutKey]);
              delete typingTimeouts.current[timeoutKey];
            }

            // Set a new timeout to remove the typing indicator after 3 seconds if no further typing
            const timeoutId = setTimeout(() => {
              setTypingUsers((current) => {
                const currentSet = current[data.roomId];
                if (currentSet && currentSet.has(data.userId)) {
                  const newSet = new Set(currentSet);
                  newSet.delete(data.userId);
                  console.log(
                    'Auto-removed typing indicator for user',
                    data.userId,
                    'in room',
                    data.roomId
                  );
                  return {
                    ...current,
                    [data.roomId]: newSet,
                  };
                }
                return current;
              });
            }, 3000);

            // Store the new timeout ID
            typingTimeouts.current[timeoutKey] = timeoutId;
          } else if (updated[data.roomId]) {
            // User stopped typing - clear the indicator
            const timeoutKey = `${data.roomId}-${data.userId}`;
            if (typingTimeouts.current[timeoutKey]) {
              clearTimeout(typingTimeouts.current[timeoutKey]);
              delete typingTimeouts.current[timeoutKey];
            }

            updated[data.roomId].delete(data.userId);
            if (updated[data.roomId].size === 0) {
              delete updated[data.roomId];
            }
          }

          console.log('Updated typing users:', updated);
          return updated;
        });
      }
    );

    return () => {
      const socket = socketRef.current;
      if (socket) {
        console.log('🧹 Cleaning up socket connection');
        
        // Notify server that user is going offline
        if (socket.connected) {
          socket.emit('user_offline', { userId: currentUser.id });
          
          // Leave all joined rooms
          joinedRooms.current.forEach(roomId => {
            socket.emit('leave_room', { roomId, userId: currentUser.id });
          });
          joinedRooms.current.clear();
        }
        
        // Disconnect the socket
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUser.id]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected || rooms.length === 0) return;
    
    rooms.forEach((room) => {
      // Only join if we're a member and haven't joined this room yet
      if (room.users.includes(currentUser.id) && !joinedRooms.current.has(room.id)) {
        console.log(`🚀 Joining room: ${room.id}`);
        
        socket.emit('join_room', { 
          roomId: room.id,
          userId: currentUser.id,
          userName: currentUser.name,
          isInitialJoin: true
        }, (response: { success: boolean; error?: string }) => {
          if (response?.success) {
            console.log(`✅ Successfully joined room: ${room.id}`);
            joinedRooms.current.add(room.id);
          } else {
            console.error(`❌ Failed to join room ${room.id}:`, response?.error || 'Unknown error');
          }
        });
      }
    });
    
    // Cleanup function to leave rooms when unmounting
    return () => {
      if (socket && socket.connected) {
        joinedRooms.current.forEach(roomId => {
          console.log(`🚪 Leaving room on cleanup: ${roomId}`);
          socket.emit('leave_room', { roomId, userId: currentUser.id });
        });
        joinedRooms.current.clear();
      }
    };
  }, [rooms, currentUser.id, currentUser.name]);

  // Handle updating message reactions
  const updateReactions = useCallback(
    (message: ExtendedMessage, emoji: string, newReactions: Reaction[]) => {
      const existingReaction = newReactions.find((r) => r.emoji === emoji);

      if (existingReaction) {
        const userIndex = existingReaction.users.indexOf(currentUser.id);

        if (userIndex > -1) {
          // Remove user's reaction
          const updatedUsers = [...existingReaction.users];
          updatedUsers.splice(userIndex, 1);

          if (updatedUsers.length === 0) {
            // Remove reaction if no users left
            return {
              ...message,
              reactions: newReactions.filter((r) => r.emoji !== emoji),
            };
          } else {
            // Update reaction with remaining users
            return {
              ...message,
              reactions: newReactions.map((r) =>
                r.emoji === emoji ? { ...r, users: updatedUsers } : r
              ),
            };
          }
        } else {
          // Add user to reaction
          return {
            ...message,
            reactions: newReactions.map((r) =>
              r.emoji === emoji ? { ...r, users: [...r.users, currentUser.id] } : r
            ),
          };
        }
      } else {
        // Add new reaction
        return {
          ...message,
          reactions: [...newReactions, { emoji, users: [currentUser.id] }],
        };
      }
    },
    [currentUser.id]
  );

  // Handle voting in polls
  const handleVote = useCallback(
    (messageId: string, optionId: string) => {
      if (!activeRoom) return;

      setRooms((prevRooms) => {
        return prevRooms.map((room) => {
          if (room.id !== activeRoom.id) return room;

          const updatedMessages = room.messages.map((message) => {
            if (message.id !== messageId || !message.poll) return message;

            const newOptions = message.poll.options.map((option) => {
              // Remove user's vote from all options
              const votes = option.votes.filter((voterId) => voterId !== currentUser.id);

              // Add vote to selected option if not already voted
              if (option.id === optionId && !option.votes.includes(currentUser.id)) {
                votes.push(currentUser.id);
              }

              return { ...option, votes };
            });

            return {
              ...message,
              poll: {
                ...message.poll,
                options: newOptions,
                totalVotes: newOptions.reduce((sum, opt) => sum + opt.votes.length, 0),
              },
            } as ExtendedMessage;
          });

          return { ...room, messages: updatedMessages };
        });
      });

      // Emit vote to server
      if (socketRef.current) {
        socketRef.current.emit('vote_poll', {
          roomId: activeRoom.id,
          messageId,
          optionId,
          userId: currentUser.id,
        });
      }
    },
    [activeRoom, currentUser.id, socketRef]
  );

  // Send a new message (accepts a payload and optionally editingMessageId/replyTo)
  const sendMessage = useCallback(
    async (
      payload: {
        text: string;
        audio?: { blob: Blob; duration: number };
        file?: File;
        location?: MessageLocation;
      },
      editingMessageId?: string,
      replyTo?: string
    ) => {
      const roomId = activeRoom?.id;
      if (!socketRef.current || !roomId || !payload.text?.trim()) return;

      // If editing an existing message
      if (editingMessageId) {
        setRooms((prevRooms) =>
          prevRooms.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  messages: room.messages.map((m) =>
                    m.id === editingMessageId ? { ...m, text: payload.text, isEdited: true } : m
                  ),
                }
              : room
          )
        );
        socketRef.current.emit('edit_message', {
          roomId,
          messageId: editingMessageId,
          text: payload.text,
        });
        return;
      }

      const messageId = `msg-${Date.now()}`;
      const message: ExtendedMessage = {
        id: messageId,
        author: currentUser,
        text: payload.text,
        timestamp: Date.now(),
        status: 'sending',
        reactions: [],
        type: 'text',
        roomId,
        isPinned: false,
        isEdited: false,
      } as ExtendedMessage;

      if (payload.file) {
        try {
          const url = await uploadFile(payload.file, roomId, messageId);
          message.file = { url, name: payload.file.name, type: payload.file.type } as MessageFile;
        } catch (e) {
          // upload failed; continue without file
          console.error('File upload failed', e);
        }
      }

      if (payload.location) {
        message.location = payload.location;
      }

      if (replyTo) {
        message.replyTo = replyTo;
      }

      setRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.id === roomId ? { ...room, messages: [...room.messages, message] } : room
        )
      );

      socketRef.current.emit('send_message', { message });
    },
    [currentUser, activeRoom]
  );

  // Delete a message
  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!activeRoom) return;

      setRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.id === activeRoom.id
            ? {
                ...room,
                messages: room.messages.filter((m) => m.id !== messageId),
              }
            : room
        )
      );

      // Emit to server
      if (socketRef.current) {
        socketRef.current.emit('delete_message', {
          roomId: activeRoom.id,
          messageId,
        });
      }
    },
    [activeRoom]
  );

  // Toggle pin status of a message (toggle based on current state)
  const togglePinMessage = useCallback(
    (messageId: string) => {
      const roomId = activeRoom?.id;
      if (!roomId) return;
      let newPinState = false;

      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          if (room.id !== roomId) return room;
          let newMessages = room.messages.map((m) => {
            if (m.id === messageId) {
              newPinState = !m.isPinned;
              return { ...m, isPinned: !m.isPinned };
            }
            return m;
          });

          if (newPinState) {
            newMessages = newMessages.map((m) =>
              m.id === messageId ? m : { ...m, isPinned: false }
            );
          }

          return { ...room, messages: newMessages };
        })
      );

      // Emit to server
      if (socketRef.current) {
        socketRef.current.emit(newPinState ? 'pin_message' : 'unpin_message', {
          roomId,
          messageId,
        });
      }
    },
    [activeRoom]
  );

  // Search for messages
  const searchMessages = useCallback(
    (query: string, scope: 'all' | 'current' = 'all') => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      const lowerCaseQuery = query.toLowerCase();
      const results: SearchResult[] = [];

      const roomsToSearch = scope === 'current' && activeRoom ? [activeRoom] : rooms;

      for (const room of roomsToSearch) {
        for (const message of room.messages) {
          if (message.text && message.text.toLowerCase().includes(lowerCaseQuery)) {
            results.push({
              message,
              roomId: room.id,
              roomName: room.name,
            });
          }
        }
      }

      setSearchResults(results.sort((a, b) => b.message.timestamp - a.message.timestamp));
      setIsSearching(true);
    },
    [rooms, activeRoom]
  );

  // Clear search results
  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  // Delete a room
  const deleteRoom = useCallback(
    (roomId: string) => {
      try {
        // Don't allow deleting self or AI chats
        const roomToDelete = rooms.find((r) => r.id === roomId);
        if (!roomToDelete || roomToDelete.type === 'self' || roomToDelete.type === 'ai') {
          console.warn('Cannot delete self or AI chats');
          return false;
        }

        // Update rooms state
        setRooms((prev) => {
          const updatedRooms = prev.filter((r) => r.id !== roomId);
          return updatedRooms;
        });

        // If the deleted room was active, switch to self chat
        if (activeRoom?.id === roomId) {
          const selfRoom = rooms.find((r) => r.type === 'self');
          if (selfRoom) {
            setActiveRoom(selfRoom);
          }
        }

        // Emit delete event to server if needed
        if (socketRef.current) {
          socketRef.current.emit('delete_room', { roomId });
        }

        return true;
      } catch (error) {
        console.error('Error deleting room:', error);
        return false;
      }
    },
    [rooms, activeRoom, setActiveRoom, socketRef]
  );

  // Check if a user is online
  const isUserOnline = useCallback(
    (userId: string): boolean => {
      return onlineUsers.has(userId);
    },
    [onlineUsers]
  );

  // Create a new room
  const createRoom = useCallback(
    (name: string, privacy: 'public' | 'private' = 'public'): string => {
      // Generate a random 4-character alphanumeric ID
      const randomId = Math.random().toString(36).substring(2, 6);

      // Create URL-friendly room name
      const formattedName = name
        .toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, ''); // Remove any non-alphanumeric characters except hyphens

      const newRoom: ExtendedRoom = {
        id: `${formattedName}-${randomId}`, // Format: room-name-abc1
        name,
        type: 'group', // Only 'group', 'self', or 'ai' are allowed
        users: [currentUser.id],
        messages: [],
        privacy,
        activeCall: undefined,
      };

      setRooms((prevRooms) => [...prevRooms, newRoom]);
      setActiveRoom(newRoom);

      if (socketRef.current) {
        socketRef.current.emit('create_room', { room: newRoom });
      }

      return newRoom.id; // Return the generated room ID
    },
    [currentUser.id]
  );

  // Get active typing users for a room
  const getActiveTypingUsers = useCallback(
    (roomId: string): User[] => {
      if (!roomId) return [];

      const userIds = Array.from(typingUsers[roomId] || []);
      return userIds
        .map((userId) => {
          // Skip the current user
          if (userId === currentUser.id) return null;

          // Find the user in any of the rooms
          for (const room of rooms) {
            const user = room.users.find((u) => u === userId);
            if (user)
              return {
                ...(MOCK_USERS[user] || { id: user, name: 'Unknown User' }),
                isOnline: onlineUsers.has(user),
              };
          }
          return null;
        })
        .filter(Boolean) as User[];
    },
    [typingUsers, currentUser.id, rooms, onlineUsers]
  );

  // Join an existing room
  const joinRoom = useCallback(
    async (
      roomId: string,
      password?: string
    ): Promise<
      | 'joined'
      | 'needs_password'
      | 'invalid_password'
      | 'not_found'
      | 'already_joined'
      | 'server_error'
    > => {
      // Trim and normalize the room ID
      const normalizedRoomId = roomId.trim();

      // Check if room exists locally (case-insensitive)
      const room = rooms.find((r) => r.id.toLowerCase() === normalizedRoomId.toLowerCase());

      // If not found locally, attempt to look up on the backend
      if (!room) {
        try {
          const backendUrl =
            import.meta.env.VITE_BACKEND_URL ||
            (import.meta.env.PROD
              ? 'https://chatsphere-7t8g.onrender.com'
              : 'http://localhost:5000');
          const resp = await fetch(`${backendUrl.replace(/\/$/, '')}/api/rooms`);
          if (!resp.ok) {
            console.warn('Could not fetch rooms from backend', resp.status, resp.statusText);
            return 'server_error';
          }
          interface ServerRoom {
            id: string;
            name?: string;
            privacy?: 'private' | 'public';
            password?: string;
            type?: string;
          }

          const serverRooms: ServerRoom[] = await resp.json();
          const found = serverRooms.find(
            (r) => r.id && r.id.toLowerCase() === normalizedRoomId.toLowerCase()
          );

          if (!found) return 'not_found';

          // If room is private and password not provided, prompt for password
          if (found.privacy === 'private' && !password) return 'needs_password';

          // If private and password provided, validate (server stores password as plain text in demo)
          if (found.privacy === 'private' && password && found.password !== password)
            return 'invalid_password';

          // Build a local ExtendedRoom from server record
          const newRoom: ExtendedRoom = {
            id: found.id,
            name: found.name || found.id,
            type: found.type || 'group',
            users: [currentUser.id],
            messages: [],
            privacy: found.privacy || 'public',
            activeCall: undefined,
          };

          setRooms((prevRooms) => [...prevRooms, newRoom]);
          setActiveRoom(newRoom);

          // Persist membership on server
          try {
            await fetch(
              `${backendUrl.replace(/\/$/, '')}/api/rooms/${encodeURIComponent(found.id)}/join`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id }),
              }
            );
          } catch (err) {
            console.warn('Failed to persist room join on backend', err);
          }

          // Emit socket join
          if (socketRef.current) {
            socketRef.current.emit('join_room', {
              roomId: found.id,
              userId: currentUser.id,
              userName: currentUser.name,
              password,
            });
          }

          return 'joined';
        } catch (err) {
          console.error('Error looking up room on backend:', err);
          return 'server_error';
        }
      }

      // Found locally; continue with previous checks
      if (room.users.includes(currentUser.id)) {
        return 'already_joined';
      }

      if (room.privacy === 'private' && !password) {
        return 'needs_password';
      }

      // Update local state optimistically
      setRooms((prevRooms) =>
        prevRooms.map((r) => (r.id === room.id ? { ...r, users: [...r.users, currentUser.id] } : r))
      );

      // Emit join_room event to server with the exact room ID from the found room
      if (socketRef.current) {
        socketRef.current.emit('join_room', {
          roomId: room.id, // Use the exact room ID from the found room
          userId: currentUser.id,
          userName: currentUser.name,
          password,
        });
      }

      return 'joined';
    },
    [currentUser.id, currentUser.name, rooms, socketRef]
  );

  // Send a poll message (accepts an object)
  const sendPoll = useCallback(
    (pollPayload: { question: string; options: string[]; location?: string }) => {
      const roomId = activeRoom?.id;
      if (
        !socketRef.current ||
        !roomId ||
        !pollPayload.question.trim() ||
        pollPayload.options.length < 2
      )
        return;

      const poll: Poll = {
        id: `poll-${Date.now()}`,
        question: pollPayload.question,
        options: pollPayload.options.map((text, index) => ({
          id: `opt-${index}`,
          text,
          votes: [],
        })),
      };

      const extendedMessage: ExtendedMessage = {
        id: `msg-${Date.now()}`,
        author: currentUser,
        text: pollPayload.question,
        timestamp: Date.now(),
        status: 'sending',
        reactions: [],
        type: 'poll',
        roomId,
        isPinned: false,
        isEdited: false,
        poll,
      };

      const baseMessage: MessageWithRoomId = {
        id: extendedMessage.id,
        author: extendedMessage.author,
        text: extendedMessage.text,
        timestamp: extendedMessage.timestamp,
        type: 'text',
        roomId: extendedMessage.roomId,
        reactions: [],
      };

      setRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.id === roomId ? { ...room, messages: [...room.messages, extendedMessage] } : room
        )
      );

      socketRef.current.emit('send_message', { message: baseMessage });
    },
    [currentUser, activeRoom]
  );

  // Handle message reactions (uses current active room)
  const handleReaction = useCallback(
    (messageId: string, emoji: string) => {
      const roomId = activeRoom?.id;
      if (!socketRef.current || !roomId) return;

      setRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.id === roomId
            ? {
                ...room,
                messages: room.messages.map((msg) =>
                  msg.id === messageId ? updateReactions(msg, emoji, msg.reactions) : msg
                ),
              }
            : room
        )
      );

      // Emit to server
      socketRef.current.emit('react_to_message', {
        roomId,
        messageId,
        emoji,
        userId: currentUser.id,
      });
    },
    [currentUser.id, updateReactions, activeRoom]
  );

  return {
    rooms,
    activeRoom,
    setActiveRoom,
    sendMessage,
    deleteMessage,
    togglePinMessage,
    activeTypingUsers: activeRoom ? getActiveTypingUsers(activeRoom.id) : [],
    unreadCounts,
    searchMessages,
    clearSearch,
    searchResults,
    isSearching,
    deleteRoom,
    isUserOnline,
    // Newly added functions
    sendPoll,
    handleVote,
    handleReaction,
    isSending,
    createRoom,
    joinRoom,
  };
};
