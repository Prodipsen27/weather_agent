import { useState, useRef, useEffect } from 'react'
import './App.css'
import { runWeatherAgent } from './agent'

const DAILY_LIMIT = 5;

function App() {
  const [query, setQuery] = useState('')
  const [steps, setSteps] = useState([])
  const [loading, setLoading] = useState(false)
  const [useCustomToken, setUseCustomToken] = useState(false)
  const [userToken, setUserToken] = useState('')
  const [showTokenInput, setShowTokenInput] = useState(false)
  // Usage tracking state
  const [usageCount, setUsageCount] = useState(0)
  const contentRef = useRef(null)
  
  useEffect(() => {
    // Load usage from localStorage

    const today = new Date().toISOString().split('T')[0];
    const savedUsage = JSON.parse(localStorage.getItem('weather_agent_usage') || '{}');
    if (savedUsage.date === today) {
      setUsageCount(savedUsage.count || 0);
    } else {
      setUsageCount(0);
      localStorage.setItem('weather_agent_usage', JSON.stringify({ date: today, count: 0 }));
    }
  }, [])

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [steps])

  const incrementUsage = () => {
    const today = new Date().toISOString().split('T')[0];
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    localStorage.setItem('weather_agent_usage', JSON.stringify({ date: today, count: newCount }));
  }

  const handleAsk = async (e) => {
    e.preventDefault();
    const envToken = import.meta.env.VITE_GITHUB_TOKEN;
    const activeToken = useCustomToken ? userToken : envToken;
    
    if (!query.trim()) return;
    
    if (!activeToken) {
      alert("No API token found! Please check your .env file or enter a custom token.");
      setShowTokenInput(true);
      return;
    }

    // Check limit if using default token
    if (!useCustomToken && usageCount >= DAILY_LIMIT) {
      alert("Daily limit reached! Please use your own token.");
      setShowTokenInput(true);
      return;
    }

    setLoading(true)
    setSteps([])
    const currentQuery = query;
    setQuery('') // Clear input immediately
    
    try {
      await runWeatherAgent(currentQuery, activeToken, (step) => {
        setSteps(prev => [...prev, step])
      })
      if (!useCustomToken) incrementUsage();
    } catch (err) {
      setSteps(prev => [...prev, { step: 'error', content: err.message }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      {showTokenInput && (
        <div className="token-modal">
          <div className="modal-content">
            <h2>{useCustomToken ? 'Update Token' : 'Usage Limit Reached'}</h2>
            <p>Enter your GitHub AI Inference token to continue.</p>
            <input 
              type="password" 
              placeholder="github_pat_..." 
              value={userToken}
              onChange={(e) => setUserToken(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                onClick={() => {
                  if (userToken) {
                    setUseCustomToken(true);
                    setShowTokenInput(false);
                  }
                }} 
                style={{ flex: 1, padding: '12px' }}
              >
                Apply
              </button>
              <button 
                onClick={() => setShowTokenInput(false)} 
                className="btn-secondary"
                style={{ flex: 1, border: 'none', background: 'rgba(255,255,255,0.1)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <header>
        <div>
          <h1>AI Weather Agent</h1>
          <div className="usage-info">
            <span className={`limit-text ${useCustomToken ? 'custom' : 'env'}`}>
              {useCustomToken 
                ? 'Using Custom Token' 
                : `${usageCount}/${DAILY_LIMIT} queries today (Env Token)`}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setShowTokenInput(true)}
              >
                {useCustomToken ? 'Update Token' : 'Use Own Token'}
              </button>
              {useCustomToken && (
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setUseCustomToken(false)}
                >
                  Reset to Env
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="status-group">
          <div className={`env-status ${import.meta.env.VITE_GITHUB_TOKEN ? 'loaded' : 'missing'}`}>
            {import.meta.env.VITE_GITHUB_TOKEN ? '● ENV Token Active' : '○ ENV Token Missing'}
          </div>
          <div className="status-badge">
            {loading ? 'Agent Thinking...' : 'Ready'}
          </div>
        </div>
      </header>

      <div className="content" ref={contentRef}>
        {steps.length === 0 && !loading && (
          <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-secondary)' }}>
            <p>Ask anything about the weather!</p>
            <p style={{ fontSize: '0.8rem' }}>Example: "What is the weather in Siliguri in Fahrenheit?"</p>
          </div>
        )}

        {steps.map((step, index) => (
          <div key={index} className={`step-card ${step.step}`}>
            <div className="step-type">{step.step}</div>
            <div className="step-content">
              {step.step === 'action' ? (
                <span>Calling <code>{step.function}</code> for <strong>{step.input}</strong>...</span>
              ) : step.step === 'observe' ? (
                <span><em>Result:</em> {step.output}</span>
              ) : (
                step.content
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAsk}>
        <footer>
          <input 
            type="text" 
            placeholder="Ask about the weather..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading || !query.trim() || (!useCustomToken && usageCount >= DAILY_LIMIT)}
          >
            {loading ? '...' : (usageCount >= DAILY_LIMIT && !useCustomToken ? 'Limit Reached' : 'Ask')}
          </button>
        </footer>
      </form>
    </div>
  )
}

export default App
