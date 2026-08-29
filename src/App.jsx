import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';

const AuthScreen = lazy(() => import('./pages/AuthScreen'));
const OnboardingScreen = lazy(() => import('./pages/OnboardingScreen'));
const MainLayout = lazy(() => import('./layouts/MainLayout'));
const ChatList = lazy(() => import('./pages/ChatList'));
const ChatWindow = lazy(() => import('./pages/ChatWindow'));
const SearchScreen = lazy(() => import('./pages/SearchScreen'));
const ProfileScreen = lazy(() => import('./pages/ProfileScreen'));
const SettingsScreen = lazy(() => import('./pages/SettingsScreen'));
const QRIdentityScreen = lazy(() => import('./pages/QRIdentityScreen'));
const QRScannerScreen = lazy(() => import('./pages/QRScannerScreen'));
const CallScreen = lazy(() => import('./pages/CallScreen'));

// পেজ লোড হওয়ার সাথে সাথেই (flash এড়াতে) localStorage থেকে cached থিম বসিয়ে দেওয়া হচ্ছে
const cachedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', cachedTheme);

// ইউজারের Firebase প্রোফাইলের darkMode ফিল্ড অনুযায়ী থিম সিঙ্ক করে
function ThemeManager({ children }) {
  const { user } = useAuth();

  useEffect(() => {
    const theme = user?.darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [user?.darkMode]);

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeManager>
          <ChatProvider>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/login" element={<AuthScreen />} />
                <Route path="/onboarding" element={<OnboardingScreen />} />
                <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="/chats" replace />} />
                  <Route path="chats" element={<ChatList />} />
                  <Route path="chat/:conversationId" element={<ChatWindow />} />
                  <Route path="search" element={<SearchScreen />} />
                  <Route path="profile" element={<ProfileScreen />} />
                  <Route path="profile/:username" element={<ProfileScreen />} />
                  <Route path="settings" element={<SettingsScreen />} />
                  <Route path="qr" element={<QRIdentityScreen />} />
                  <Route path="scan" element={<QRScannerScreen />} />
                  <Route path="call/:callId" element={<CallScreen />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ChatProvider>
        </ThemeManager>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
