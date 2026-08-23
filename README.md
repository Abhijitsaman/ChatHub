# ChatHub

A modern, real-time communication web application built with React, Firebase, and WebRTC.

## Features

### 🔐 Authentication
- Google Sign-In with Firebase Authentication
- Secure session management
- Protected routes

### 👤 User Profiles
- Custom display names
- Unique username system
- Bio/About section
- Profile photos from Google

### 💬 Real-time Chat
- One-to-one messaging
- Message status: Sent (✓), Delivered (✓✓), Seen (👁️)
- Message timestamps
- Message info panel
- Delete for Me
- Delete for Everyone

### 📱 User Discovery
- Search by username or display name
- QR code generation for profile sharing
- QR code scanner for adding contacts
- Unique User ID

### 📞 Voice & Video Calls
- WebRTC integration
- Voice calling with mute/unmute
- Video calling with camera toggle
- Call duration tracking
- Call status management

### 🔒 Privacy & Security
- Block/unblock users
- Online/offline presence
- Last seen timestamps
- Firebase Security Rules
- End-to-end encryption ready

### 🎨 Design
- Mobile-first responsive design
- Dark theme optimized for visual comfort
- Smooth animations with Framer Motion
- Accessibility ready

## Tech Stack

- **React 18** - Frontend framework
- **Firebase** - Authentication & Realtime Database
- **WebRTC** - Real-time voice/video communication
- **React Router v6** - Navigation
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **QRCode.react** - QR code generation
- **React QR Reader** - QR code scanning
- **Vite** - Build tool

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/chathub.git
cd chathub
