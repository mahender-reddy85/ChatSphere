import { useState, useEffect, useCallback, useRef } from 'react';
import type { User, Room, Message, Poll, SearchResult, MessageLocation } from '../types';
import { MOCK_USERS } from '../constants';
import { getAIBotResponse } from '../services/geminiService';
import io, { Socket } from 'socket.io-client';

const aiBot = MOCK_USERS['ai-bot'];

export const useChat = (currentUser: User) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [activeTypingUsers, setActiveTypingUsers] = useState<User[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  // Load rooms from localStorage on initial load
  useEffect(() => {
    const savedRooms = localStorage.getItem('chatRooms');
    if (savedRooms) {
      try {
        const parsedRooms = JSON.parse(savedRooms);
        setRooms(prevRooms => {
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

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? 'https://chatsphere-7t8g.onrender.com' : 'http://localhost:5000');
    const socket = io(backendUrl, {
      transports: ['websocket'],
      auth: { userId: currentUser.id }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to backend server');
      // Notify server that user is online
      socket.emit('user_online', { userId: currentUser.id });
    });

    // Handle online users update
    socket.on('online_users', (data: { users: string[] }) => {
      setOnlineUsers(new Set(data.users));
    });

    // Handle user online/offline events
    socket.on('user_online', (data: { userId: string }) => {
      setOnlineUsers(prev => new Set(prev).add(data.userId));
    });

    socket.on('user_offline', (data: { userId: string }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    socket.on('receive_message', (data: { message: Message }) => {
      const { message } = data;
      setRooms(prev => prev.map(r =>
        r.id === message.roomId ? {
          ...r,
          messages: r.messages.some(m => m.id === message.id) ? r.messages : [...r.messages, message]
        } : r
      ));
      // Update unread counts for other rooms
      if (message.roomId !== activeRoom?.id) {
        setUnreadCounts(prev => ({ ...prev, [message.roomId]: (prev[message.roomId] || 0) + 1 }));
      }
    });

    socket.on('receive_system_message', (data: { message: Message }) => {
      const { message } = data;
      setRooms(prev => prev.map(r =>
        r.id === message.roomId ? { ...r, messages: [...r.messages, message] } : r
      ));
    });

    socket.on('message_delivered', (data: { messageId: string }) => {
      const { messageId } = data;
      setRooms(prev => prev.map(r =>
        r.id === activeRoom?.id
          ? { ...r, messages: r.messages.map(m => m.id === messageId ? { ...m, status: 'delivered' as const } : m) }
          : r
      ));
    });

    socket.on('message_edited', (data: { messageId: string; newText: string; roomId: string }) => {
      const { messageId, newText, roomId } = data;
      setRooms(prev => prev.map(r =>
        r.id === roomId
          ? { ...r, messages: r.messages.map(m => m.id === messageId ? { ...m, text: newText, isEdited: true, file: undefined, audio: undefined, location: undefined } : m) }
          : r
      ));
    });

    socket.on('poll_vote', (data: { messageId: string, optionId: string, userId: string }) => {
      const { messageId, optionId, userId } = data;
      setRooms(prev => prev.map(r => {
        if (r.id !== activeRoom?.id) return r;
        const newMessages = r.messages.map(m => {
          if (m.id !== messageId || !m.poll) return m;

          const newOptions = m.poll.options.map(opt => {
              if (opt.id === optionId) {
                // Toggle vote: if user has voted for this option, remove vote; otherwise add vote
                const hasVoted = opt.votes.includes(userId);
                const newVotes = hasVoted
                  ? opt.votes.filter(voterId => voterId !== userId)
                  : [...opt.votes, userId];
                return { ...opt, votes: newVotes };
              }
              // Keep votes on other options (multiple choice poll)
              return opt;
          });

          return { ...m, poll: { ...m.poll, options: newOptions } };
        });
        return { ...r, messages: newMessages };
      }));
    });

    socket.on('message_status_update', (data: { messageIds: string[], status: 'seen' }) => {
      setRooms(prev => prev.map(r =>
        r.id === activeRoom?.id
          ? { ...r, messages: r.messages.map(m => data.messageIds.includes(m.id) ? { ...m, status: 'seen' as const } : m) }
          : r
      ));
    });

    return () => {
      // Notify server that user is going offline
      if (socket.connected) {
        socket.emit('user_offline', { userId: currentUser.id });
      }
      socket.disconnect();
    };
  }, [currentUser.id]);

  useEffect(() => {
    if (socketRef.current && rooms.length > 0) {
      rooms.forEach(room => {
        if (room.users.includes(currentUser.id)) {
          socketRef.current.emit('join_room', room.id);
        }
      });
    }
  }, [rooms, currentUser.id]);

  useEffect(() => {
    const selfChatInitialMessage: Message = {
      id: `msg-self-intro-${currentUser.id}`,
      author: currentUser,
      timestamp: Date.now(),
      text: "This is your personal space. You can send messages, files, and notes to yourself here.",
      reactions: [],
    };
    
    const aiChatInitialMessage: Message = {
      id: `msg-ai-intro-${currentUser.id}`,
      author: aiBot,
      timestamp: Date.now(),
      text: "Hello! I'm your AI Assistant. How can I help you today?",
      reactions: [],
    };

    const allRooms: Room[] = [
      { id: `self-chat-${currentUser.id}`, name: '(You)', type: 'self', users: [currentUser.id], messages: [selfChatInitialMessage], privacy: 'private' },
      { id: `ai-chat-${currentUser.id}`, name: 'AI Assistant', type: 'ai', users: [currentUser.id, 'ai-bot'], messages: [aiChatInitialMessage], privacy: 'private' },
    ];
    setRooms(allRooms);
    if(!activeRoom){
      const firstRoom = allRooms.find(r => r.type === 'self') || allRooms[0];
      setActiveRoom(firstRoom);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id, currentUser]);

  useEffect(() => {
    if (activeRoom) {
        setUnreadCounts(prev => ({...prev, [activeRoom.id]: 0}));
    }
  }, [activeRoom]);

  const createRoom = (name: string): string => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const newRoomId = `${slug}-${Math.random().toString(36).substr(2, 4)}`;
    const newRoom: Room = {
      id: newRoomId,
      name,
      privacy: 'public',
      type: 'group',
      users: [currentUser.id],
      messages: [],
    };
    setRooms(prev => [...prev, newRoom]);

    // Emit create_room event to backend
    if (socketRef.current) {
      socketRef.current.emit('create_room', { roomId: newRoomId, userName: currentUser.name });
      socketRef.current.emit('join_room', newRoomId);
    }

    return newRoomId;
  };
  
  const joinRoom = (roomId: string, password?: string): 'joined' | 'needs_password' | 'invalid_password' | 'not_found' | 'already_joined' => {
    let roomToJoin = rooms.find(r => r.id === roomId);

    if (!roomToJoin) {
        // Create room if not found (invite code is roomId)
        const derivedName = roomId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        roomToJoin = {
            id: roomId,
            name: derivedName,
            type: 'group',
            users: [currentUser.id],
            messages: [],
            privacy: 'public',
        };
        setRooms(prev => [...prev, roomToJoin]);

        // Emit join_room event to backend
        if (socketRef.current) {
          socketRef.current.emit('join_room', { roomId, userName: currentUser.name });
        }

        return 'joined';
    }

    if (roomToJoin.users.includes(currentUser.id)) {
        return 'already_joined';
    }

    if (roomToJoin.privacy === 'public') {
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, users: [...r.users, currentUser.id] } : r));

        // Emit join_room event to backend
        if (socketRef.current) {
          socketRef.current.emit('join_room', { roomId, userName: currentUser.name });
        }

        return 'joined';
    }

    // Room is private
    if (roomToJoin.password) {
        if (!password) {
            return 'needs_password';
        }
        if (password === roomToJoin.password) {
            setRooms(prev => prev.map(r => r.id === roomId ? { ...r, users: [...r.users, currentUser.id] } : r));

            // Emit join_room event to backend
            if (socketRef.current) {
              socketRef.current.emit('join_room', { roomId, userName: currentUser.name });
            }

            return 'joined';
        } else {
            return 'invalid_password';
        }
    }

    // Private room without a password (legacy or other reason) can be joined.
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, users: [...r.users, currentUser.id] } : r));

    // Emit join_room event to backend
    if (socketRef.current) {
      socketRef.current.emit('join_room', { roomId, userName: currentUser.name });
    }

    return 'joined';
  };

  const sendMessage = useCallback(async (payload: { text: string; audio?: { blob: Blob; duration: number }; file?: File, location?: MessageLocation }, editingMessageId?: string, replyTo?: string) => {
    if (!activeRoom) return;

    if (editingMessageId) {
        // Edit existing message (audio/file/location not supported for edits)
        if (!payload.text.trim()) return;
        const newText = payload.text.trim();
        setRooms(prevRooms => prevRooms.map(r => 
            r.id === activeRoom.id
            ? { ...r, messages: r.messages.map(m => m.id === editingMessageId ? { ...m, text: newText, isEdited: true, file: undefined, audio: undefined, location: undefined } : m) }
            : r
        ));

        // Emit edit to backend for synchronization
        if (socketRef.current) {
          socketRef.current.emit('edit_message', { roomId: activeRoom.id, messageId: editingMessageId, newText });
        }
        return;
    }
    
    if (!payload.text.trim() && !payload.audio && !payload.file && !payload.location) return;

    setIsSending(true);
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      author: currentUser,
      timestamp: Date.now(),
      text: payload.text.trim(),
      reactions: [],
      status: 'sent',
      roomId: activeRoom.id,
      ...(replyTo && { replyTo }),
      ...(payload.audio && {
          audio: {
              url: URL.createObjectURL(payload.audio.blob),
              duration: payload.audio.duration,
          }
      }),
      ...(payload.file && {
          file: {
              url: URL.createObjectURL(payload.file),
              name: payload.file.name,
              type: payload.file.type,
          }
      }),
      ...(payload.location && { location: payload.location })
    };

    // Send to backend via socket
    if (socketRef.current) {
      socketRef.current.emit('send_message', { roomId: activeRoom.id, message: newMessage });
    }

    if (activeRoom.type === 'ai') {
        const history = [...activeRoom.messages, newMessage];
        const aiResponseText = await getAIBotResponse(history);
        const aiMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          author: aiBot,
          timestamp: Date.now(),
          text: aiResponseText,
          reactions: [],
          roomId: activeRoom.id,
        };
        setRooms(prev => prev.map(r => r.id === activeRoom.id ? { ...r, messages: [...r.messages, aiMessage] } : r));
    }
    
    setIsSending(false);
  }, [activeRoom, currentUser]);

  const deleteMessage = useCallback((messageId: string, scope: 'for_me' | 'for_everyone' = 'for_me') => {
    if (!activeRoom) return;
    if (scope === 'for_everyone') {
      // Delete for everyone - mark as deleted for everyone
      setRooms(prevRooms => prevRooms.map(r =>
        ({ ...r, messages: r.messages.map(m =>
          m.id === messageId
            ? { ...m, isDeleted: true, deletedBy: currentUser.id, deletedForEveryone: true }
            : m
        ) })
      ));
    } else {
      // Delete for me - only remove from current room
      setRooms(prevRooms => prevRooms.map(r =>
        r.id === activeRoom.id
        ? { ...r, messages: r.messages.filter(m => m.id !== messageId) }
        : r
      ));
    }
  }, [activeRoom, currentUser.id]);

  const togglePinMessage = useCallback((messageId: string) => {
      if (!activeRoom) return;
      setRooms(prevRooms => prevRooms.map(r =>
          r.id === activeRoom.id
          ? { ...r, messages: r.messages.map(m => m.id === messageId ? { ...m, isPinned: !m.isPinned } : m) }
          : r
      ));
  }, [activeRoom]);

  const sendPoll = useCallback((pollData: { question: string, options: string[], location?: string }) => {
    if (!activeRoom) return;
    const newPoll: Poll = {
      id: `poll-${Date.now()}`,
      question: pollData.question,
      options: pollData.options.map((opt, i) => ({ id: `opt-${Date.now()}-${i}`, text: opt, votes: [] })),
      location: pollData.location,
    };
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      author: currentUser,
      timestamp: Date.now(),
      text: `Poll: ${pollData.question}`,
      poll: newPoll,
      reactions: [],
      roomId: activeRoom.id,
    };
    setRooms(prev => prev.map(r => r.id === activeRoom.id ? { ...r, messages: [...r.messages, newMessage] } : r));

    // Emit to backend for synchronization
    if (socketRef.current) {
      socketRef.current.emit('send_message', { roomId: activeRoom.id, message: newMessage });
    }
  }, [activeRoom, currentUser]);

  const handleVote = useCallback((messageId: string, optionId: string) => {
    if (!activeRoom) return;
    setRooms(prev => prev.map(r => {
      if (r.id !== activeRoom.id) return r;
      const newMessages = r.messages.map(m => {
        if (m.id !== messageId || !m.poll) return m;

        const newOptions = m.poll.options.map(opt => {
            if (opt.id === optionId) {
              // Toggle vote: if user has voted for this option, remove vote; otherwise add vote
              const hasVoted = opt.votes.includes(currentUser.id);
              const newVotes = hasVoted
                ? opt.votes.filter(voterId => voterId !== currentUser.id)
                : [...opt.votes, currentUser.id];
              return { ...opt, votes: newVotes };
            }
            // Keep votes on other options (multiple choice poll)
            return opt;
        });

        return { ...m, poll: { ...m.poll, options: newOptions } };
      });
      return { ...r, messages: newMessages };
    }));

    // Emit vote update to backend for synchronization
    if (socketRef.current) {
      socketRef.current.emit('vote_poll', { roomId: activeRoom.id, messageId, optionId, userId: currentUser.id });
    }
  }, [activeRoom, currentUser.id]);

  const handleReaction = useCallback((messageId: string, emoji: string) => {
    if (!activeRoom) return;
    setRooms(prev => prev.map(r => {
        if (r.id !== activeRoom.id) return r;
        const newMessages = r.messages.map(m => {
            if (m.id !== messageId) return m;
            const existingReaction = m.reactions.find(re => re.emoji === emoji);
            let newReactions;
            if (existingReaction) {
                newReactions = m.reactions.map(re => {
                    if (re.emoji === emoji) {
                        return re.users.includes(currentUser.id) 
                            ? { ...re, users: re.users.filter(uId => uId !== currentUser.id) }
                            : { ...re, users: [...re.users, currentUser.id] };
                    }
                    return re;
                }).filter(re => re.users.length > 0);
            } else {
                newReactions = [...m.reactions, { emoji, users: [currentUser.id] }];
            }
            return { ...m, reactions: newReactions };
        });
        return { ...r, messages: newMessages };
    }));
  }, [activeRoom, currentUser.id]);
  
  const searchMessages = useCallback((query: string, scope: 'current' | 'all') => {
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
            if (message.text.toLowerCase().includes(lowerCaseQuery)) {
                results.push({
                    message,
                    roomId: room.id,
                    roomName: room.name,
                });
            }
        }
    }

    setSearchResults(results.sort((a, b) => b.message.timestamp - a.message.timestamp)); // most recent first
    setIsSearching(true);
  }, [rooms, activeRoom]);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  const deleteRoom = useCallback((roomId: string) => {
    // Don't allow deleting self or AI chats
    const roomToDelete = rooms.find(r => r.id === roomId);
    if (!roomToDelete || roomToDelete.type === 'self' || roomToDelete.type === 'ai') return;

    setRooms(prev => prev.filter(r => r.id !== roomId));

    // If the deleted room was active, switch to self chat
    if (activeRoom?.id === roomId) {
      const selfRoom = rooms.find(r => r.type === 'self');
      if (selfRoom) {
        setActiveRoom(selfRoom);
      }
    }
  }, [rooms, activeRoom]);

  // Check if a user is online
  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  return {
    rooms,
    activeRoom,
    setActiveRoom,
    sendMessage,
    sendPoll,
    handleVote,
    handleReaction,
    isSending,
    createRoom,
    joinRoom,
    deleteMessage,
    togglePinMessage,
    activeTypingUsers,
    unreadCounts,
    searchMessages,
    clearSearch,
    searchResults,
    isSearching,
    deleteRoom,
    isUserOnline,
  };
};