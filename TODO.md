# TODO: Remove Video Call and Its Preferences

## Steps to Complete

- [x] Remove video call components: Delete VideoCallButton.tsx, VideoCallModal.tsx, IncomingCallModal.tsx, ActiveCallBanner.tsx
- [x] Update useChat.ts: Remove video call functions (startVideoCall, joinVideoCall, leaveVideoCall), state (incomingCall, peerConnection, localStream, remoteStream), and socket listeners for calls
- [x] Update ChatRoom.tsx: Remove imports and usages of video call components, props, and rendering
- [x] Update ChatWindow.tsx: Remove video call button, ActiveCallBanner, and related props
- [x] Update types.ts: Remove activeCall property from Room interface
- [x] Test the application to ensure no errors and video call features are removed
