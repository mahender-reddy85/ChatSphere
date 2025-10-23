# TODO: Remove Video Call and Its Preferences

## Steps to Complete

- [ ] Remove video call components: Delete VideoCallButton.tsx, VideoCallModal.tsx, IncomingCallModal.tsx, ActiveCallBanner.tsx
- [ ] Update useChat.ts: Remove video call functions (startVideoCall, joinVideoCall, leaveVideoCall), state (incomingCall, peerConnection, localStream, remoteStream), and socket listeners for calls
- [ ] Update ChatRoom.tsx: Remove imports and usages of video call components, props, and rendering
- [ ] Update ChatWindow.tsx: Remove video call button, ActiveCallBanner, and related props
- [ ] Update types.ts: Remove activeCall property from Room interface
- [ ] Test the application to ensure no errors and video call features are removed
