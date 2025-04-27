import { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';
import { ToastContainer } from '../ui';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Main layout component
 * @param props Component props
 * @returns Layout component
 */
const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  // Check if current route is a public route
  const isPublicRoute = ['/login', '/register', '/'].includes(location.pathname);

  // Check if current route is a campaign route
  const isCampaignRoute = location.pathname.startsWith('/campaign/');

  // Don't show header/footer in campaign view
  if (isCampaignRoute) {
    return (
      <>
        {children}
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="header-container">
          <div className="header-logo">
            <Link to="/">D&D Online</Link>
          </div>

          <nav className="header-nav">
            {user ? (
              <>
                <Link to="/dashboard" className="nav-link">
                  Dashboard
                </Link>
                <button type="button" onClick={signOut} className="nav-link">
                  Logout
                </button>
              </>
            ) : (
              !isPublicRoute && (
                <>
                  <Link to="/login" className="nav-link">
                    Login
                  </Link>
                  <Link to="/register" className="nav-link">
                    Register
                  </Link>
                </>
              )
            )}
          </nav>
        </div>
      </header>

      <main className="main">{children}</main>

      {!isPublicRoute && (
        <footer className="footer">
          <div className="footer-container">
            <p>&copy; {new Date().getFullYear()} D&D Online. All rights reserved.</p>
          </div>
        </footer>
      )}

      <ToastContainer />
    </div>
  );
};

export default Layout;
