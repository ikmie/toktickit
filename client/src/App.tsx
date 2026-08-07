import { useState } from 'react';

interface Category {
  id: number;
  name: string;
}

export default function App() {
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<'Online' | 'Offline' | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  const checkSystem = async () => {
    setLoading(true);
    setError(null);
    setStatus(null);
    setCategories([]);

    try {
      const API_BASE = 'http://localhost:5000/api';
      const [healthRes, catRes] = await Promise.all([
        fetch(`${API_BASE}/health`),
        fetch(`${API_BASE}/categories`),
      ]);

      if (!healthRes.ok || !catRes.ok) {
        throw new Error('Unable to connect to TokTickIT API');
      }

      const healthData = await healthRes.json();
      const catData = await catRes.json();

      if (healthData.status === 'ok') {
        setStatus('Online');
        setCategories(catData);
      } else {
        setStatus('Offline');
        setError('Unable to connect to TokTickIT API');
      }
    } catch {
      setStatus('Offline');
      setError('Unable to connect to TokTickIT API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="card shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
        <div className="card-body p-4">
          <h1 className="h3 card-title text-success mb-4 fw-bold">
            TokTickIT IT Service Desk
          </h1>

          <button
            onClick={checkSystem}
            disabled={loading}
            className="btn btn-primary mb-4 px-4 py-2"
          >
            {loading ? 'loading...' : 'Check System'}
          </button>

          {loading && (
            <div className="text-muted my-3" data-testid="loading-indicator">
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              loading...
            </div>
          )}

          {status && !loading && (
            <div className="mt-3">
              <p className="fs-5 mb-3">
                <strong>System Status:</strong>{' '}
                <span
                  className={`badge ${
                    status === 'Online' ? 'bg-success' : 'bg-danger'
                  }`}
                  data-testid="system-status"
                >
                  {status}
                </span>
              </p>

              {status === 'Online' && categories.length > 0 && (
                <div>
                  <h2 className="h5 fw-bold text-secondary mb-3">
                    Supported Request Categories:
                  </h2>
                  <ul className="list-group" data-testid="category-list">
                    {categories.map((cat, index) => (
                      <li key={cat.id || index} className="list-group-item">
                        {index + 1}. {cat.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {status === 'Offline' && error && (
                <div className="alert alert-danger mb-0" role="alert" data-testid="error-message">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
