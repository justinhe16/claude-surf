import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        Claude Surf
      </h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
        React + TypeScript + Vite is working!
      </p>
      <button
        onClick={() => setCount((count) => count + 1)}
        style={{
          padding: '0.75rem 2rem',
          fontSize: '1.1rem',
          borderRadius: '8px',
          border: 'none',
          background: 'white',
          color: '#764ba2',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Count: {count}
      </button>
    </div>
  );
}

export default App;
