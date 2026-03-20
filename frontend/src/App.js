import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || '';

function StatusBadge({ status }) {
  const isOk = status === 'ok' || status === 'running';
  return (
    <span className={`badge ${isOk ? 'badge-ok' : 'badge-error'}`}>
      {isOk ? '● Online' : '● Offline'}
    </span>
  );
}

function ServiceCard({ name, type, description, status }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>{name}</h3>
        <StatusBadge status={status} />
      </div>
      <p className="card-type">{type}</p>
      <p className="card-desc">{description}</p>
    </div>
  );
}

export default function App() {
  const [health, setHealth] = useState(null);
  const [services, setServices] = useState([]);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthRes, servicesRes, infoRes] = await Promise.all([
        fetch(`${API_URL}/health`),
        fetch(`${API_URL}/api/services`),
        fetch(`${API_URL}/api/info`),
      ]);

      if (!healthRes.ok) throw new Error(`Gateway returned ${healthRes.status}`);

      const [healthData, servicesData, infoData] = await Promise.all([
        healthRes.json(),
        servicesRes.json(),
        infoRes.json(),
      ]);

      setHealth(healthData);
      setServices(servicesData.services || []);
      setInfo(infoData);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">☁</div>
          <div>
            <h1>Azure Microservices Lab</h1>
            <p>SE4010 – Current Trends in Software Engineering | SLIIT 2026</p>
          </div>
        </div>
      </header>

      <main className="main">
        {/* Gateway Status */}
        <section className="section">
          <h2>Gateway Health</h2>
          {loading && <p className="loading">Connecting to gateway...</p>}
          {error && (
            <div className="alert alert-error">
              <strong>Gateway unreachable:</strong> {error}
              {!API_URL && (
                <p className="hint">
                  Set <code>REACT_APP_API_URL</code> to your gateway FQDN to connect.
                </p>
              )}
            </div>
          )}
          {health && (
            <div className="health-grid">
              <div className="health-item">
                <span className="label">Status</span>
                <StatusBadge status={health.status} />
              </div>
              <div className="health-item">
                <span className="label">Uptime</span>
                <span className="value">{Math.floor(health.uptime)}s</span>
              </div>
              <div className="health-item">
                <span className="label">Environment</span>
                <span className="value">{health.environment}</span>
              </div>
              <div className="health-item">
                <span className="label">Timestamp</span>
                <span className="value">{new Date(health.timestamp).toLocaleString()}</span>
              </div>
            </div>
          )}
          {lastChecked && (
            <p className="last-checked">
              Last checked: {lastChecked}{' '}
              <button className="btn-refresh" onClick={fetchAll}>
                Refresh
              </button>
            </p>
          )}
        </section>

        {/* Services */}
        <section className="section">
          <h2>Deployed Services</h2>
          {services.length > 0 ? (
            <div className="cards-grid">
              {services.map((svc) => (
                <ServiceCard key={svc.name} {...svc} />
              ))}
            </div>
          ) : (
            !loading && <p className="empty">No services data available.</p>
          )}
        </section>

        {/* Architecture */}
        <section className="section">
          <h2>Lab Architecture</h2>
          <div className="arch-diagram">
            <div className="arch-box frontend-box">
              <div className="arch-icon">🌐</div>
              <strong>Static Web App</strong>
              <small>Azure Static Web Apps</small>
              <small>React Frontend</small>
            </div>
            <div className="arch-arrow">→ HTTPS →</div>
            <div className="arch-box gateway-box">
              <div className="arch-icon">⚡</div>
              <strong>Gateway Service</strong>
              <small>Azure Container Apps</small>
              <small>Node.js · Port 3000</small>
            </div>
            <div className="arch-arrow">↑ pull image</div>
            <div className="arch-box acr-box">
              <div className="arch-icon">📦</div>
              <strong>Container Registry</strong>
              <small>Azure ACR (Basic)</small>
              <small>sliitmicroregistry</small>
            </div>
          </div>
        </section>

        {/* Gateway Info */}
        {info && (
          <section className="section">
            <h2>Gateway Info</h2>
            <table className="info-table">
              <tbody>
                {Object.entries(info).map(([key, val]) => (
                  <tr key={key}>
                    <td className="info-key">{key}</td>
                    <td className="info-val">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>SLIIT – Faculty of Computing | SE4010 Azure Microservices Deployment Lab | 2026</p>
      </footer>
    </div>
  );
}
