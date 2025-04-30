import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import SignUp from './components/SignUp';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-brand">LendMe</div>
          <div className="nav-links">
            <Link to="/signup" className="signup-button">Sign Up</Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={
            <div className="home-content">
              <h1>Welcome to LendMe</h1>
              <p>Your platform for managing school equipment lending</p>
            </div>
          } />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
