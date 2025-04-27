import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-container">
      <header className="hero">
        <h1>D&D Online</h1>
        <p>A browser-based multiplayer Dungeons & Dragons experience</p>
        
        <div className="cta-buttons">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary">
                Login
              </Link>
              <Link to="/register" className="btn btn-secondary">
                Register
              </Link>
            </>
          )}
        </div>
      </header>
      
      <section className="features">
        <h2>Features</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Real-time Gameplay</h3>
            <p>Join campaigns with friends and play together in real-time</p>
          </div>
          <div className="feature-card">
            <h3>Video & Audio Chat</h3>
            <p>Communicate with your party members via integrated video and audio</p>
          </div>
          <div className="feature-card">
            <h3>Interactive Maps</h3>
            <p>Explore detailed maps with fog of war and token placement</p>
          </div>
          <div className="feature-card">
            <h3>Character Sheets</h3>
            <p>Create and manage your characters with digital character sheets</p>
          </div>
          <div className="feature-card">
            <h3>Dice Rolling</h3>
            <p>Roll virtual dice with animations and shared results</p>
          </div>
          <div className="feature-card">
            <h3>Turn Tracking</h3>
            <p>Keep track of initiative and turns during encounters</p>
          </div>
        </div>
      </section>
      
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Create an Account</h3>
            <p>Sign up as a Dungeon Master or Player</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Create or Join a Campaign</h3>
            <p>Start your own adventure or join an existing one</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Create Your Character</h3>
            <p>Build your character with our digital character sheet</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Start Playing</h3>
            <p>Connect with your party and begin your adventure</p>
          </div>
        </div>
      </section>
      
      <footer>
        <p>&copy; {new Date().getFullYear()} D&D Online. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
