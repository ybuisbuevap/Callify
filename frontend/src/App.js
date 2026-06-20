import './App.css';
import { lazy, Suspense } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

const LandingPage = lazy(() => import('./pages/landing'));
const Authentication = lazy(() => import('./pages/authentication'));
const VideoMeetComponent = lazy(() => import('./pages/VideoMeet'));
const HomeComponent = lazy(() => import('./pages/home'));
const History = lazy(() => import('./pages/history'));
const Verify = lazy(() => import('./pages/Verify'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<div className="page-loading">Loading...</div>}>
              <Routes>
                <Route path='/' element={<LandingPage />} />
                <Route path='/auth' element={<Authentication />} />
                <Route path='/home' element={<HomeComponent />} />
                <Route path='/history' element={<History />} />
                <Route path='/verify/:token' element={<Verify />} />
                <Route path='/reset-password/:token' element={<ResetPassword />} />
                <Route path='/profile' element={<Profile />} />
                <Route path='/:url' element={<VideoMeetComponent />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;