import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './styles.css';
import { Layout } from './components/Layout';
import { RequireAccount } from './components/RequireAccount';
import { Privacy } from './pages/public/Privacy';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider } from './context/AppContext';
import { Home } from './pages/public/Home';
import { Discover } from './pages/public/Discover';
import { EventDetail } from './pages/public/EventDetail';
import { About } from './pages/public/About';
import { ForBusiness } from './pages/public/ForBusiness';
import { AuthPage } from './pages/member/AuthPage';
import { MemberPortal } from './pages/member/MemberPortal';
import { BusinessPortal } from './pages/business/BusinessPortal';
import { BusinessApply } from './pages/business/BusinessApply';
import { AdminPortal } from './pages/admin/AdminPortal';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="discover" element={<Discover />} />
              <Route path="events/:id" element={<EventDetail />} />
              <Route path="about" element={<About />} />
              <Route path="for-business" element={<ForBusiness />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="login" element={<AuthPage />} />
              <Route path="signup" element={<AuthPage signup />} />
              <Route element={<RequireAccount />}>
                <Route path="my" element={<MemberPortal />} />
                <Route path="business/apply" element={<BusinessApply />} />
              </Route>
              <Route element={<RequireAccount role="business" />}>
                <Route path="business" element={<BusinessPortal />} />
              </Route>
              <Route element={<RequireAccount role="admin" />}>
                <Route path="admin" element={<AdminPortal />} />
              </Route>
              <Route
                path="*"
                element={
                  <div className="page narrow">
                    <p className="eyebrow">404 • A little off the beaten path</p>
                    <h1>Your next good thing is somewhere else.</h1>
                    <Link className="button" to="/discover">
                      Explore gatherings <ArrowRight size={16} />
                    </Link>
                  </div>
                }
              />
            </Route>
          </Routes>
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD)
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js');
  });
