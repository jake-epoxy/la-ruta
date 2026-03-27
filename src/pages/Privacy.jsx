import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="landing-page" style={{ padding: '80px 24px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)' }}>
      <Link to="/" style={{ color: 'var(--gold-primary)', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>&larr; Back to Home</Link>
      
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: '32px' }}>Privacy Policy</h1>
      
      <div className="glass-card" style={{ padding: '32px', textAlign: 'left' }}>
        <p><strong>Last Updated:</strong> March 2026</p>
        
        <h3 style={{ marginTop: '24px', color: 'var(--gold-primary)' }}>1. Data Collection</h3>
        <p>La Ruta collects personal information including but not limited to your name, email address, and mobile phone number. This information is collected solely for the purpose of facilitating ride-share connections, verifying identity, and account management.</p>

        <h3 style={{ marginTop: '24px', color: 'var(--gold-primary)' }}>2. Data Sharing and Third Parties</h3>
        <p><strong>No mobile information will be shared with third parties or affiliates for marketing or promotional purposes.</strong> All text messaging originator opt-in data and consent will remain strictly confidential and will not be shared with any third parties under any circumstances.</p>

        <h3 style={{ marginTop: '24px', color: 'var(--gold-primary)' }}>3. SMS Communications</h3>
        <p>By using the Platform and opting in via our registration form, you agree to receive automated SMS notifications from La Ruta regarding your ride requests and account status. You may opt out of these communications at any time by replying STOP to any received message.</p>

        <h3 style={{ marginTop: '24px', color: 'var(--gold-primary)' }}>4. Security</h3>
        <p>We implement industry-standard database security measures to protect your personal information from unauthorized access, alteration, or disclosure.</p>

        <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '32px 0' }}/>
        
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>By using La Ruta, you acknowledge and consent to this Privacy Policy.</p>
      </div>
    </div>
  );
}
