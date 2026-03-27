import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="landing-page" style={{ padding: '80px 24px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)' }}>
      <Link to="/" style={{ color: 'var(--gold-primary)', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>&larr; Back to Home</Link>
      
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: '32px' }}>Terms of Service & Alpha Liability Waiver</h1>
      
      <div className="glass-card" style={{ padding: '32px', textAlign: 'left' }}>
        <p><strong>Last Updated:</strong> March 2026</p>
        
        <h3 style={{ marginTop: '24px', color: 'var(--gold-primary)' }}>1. Acknowledgment of Alpha Software</h3>
        <p>La Ruta ("The Platform") is currently in a pre-release "Alpha" testing phase. By utilizing the Platform, you explicitly acknowledge that the software may contain bugs, errors, or inaccuracies. You participate entirely at your own risk.</p>

        <h3 style={{ marginTop: '24px', color: 'var(--gold-primary)' }}>2. Independent Contractor Status</h3>
        <p>La Ruta is strictly a Software-as-a-Service (SaaS) communication platform that facilitates connections between independent drivers and riders. La Ruta is <strong>not a transportation carrier</strong>, does not employ drivers, and does not own any vehicles. All transportation services are provided independently by third-party contractors.</p>

        <h3 style={{ marginTop: '24px', color: 'var(--gold-primary)' }}>3. Hold Harmless & Indemnification</h3>
        <p>By using La Ruta, you explicitly agree to indemnify, defend, and hold harmless La Ruta, its founders, and affiliates from any and all claims, liabilities, damages, personal injuries, death, or property damage resulting directly or indirectly from your use of the Platform or any transportation services arranged via the Platform.</p>

        <h3 style={{ marginTop: '24px', color: 'var(--gold-primary)' }}>4. Driver Liability & Insurance</h3>
        <p>Drivers using the platform certify that they maintain valid personal or commercial automobile insurance required by state law. Drivers acknowledge that La Ruta does not provide commercial liability insurance during this Alpha testing phase. Drivers are personally legally liable for any accidents or incidents that occur while operating a vehicle.</p>

        <h3 style={{ marginTop: '24px', color: 'var(--gold-primary)' }}>5. Background & Vetting Waiver</h3>
        <p>During the Alpha phase, La Ruta does not currently execute comprehensive criminal background checks or motor vehicle record checks. Riders enter vehicles strictly at their own risk. Drivers pick up passengers strictly at their own risk.</p>
        
        <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '32px 0' }}/>
        
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>By registering an account with La Ruta, you electronically sign and bind yourself to these Terms of Service without reservation.</p>
      </div>
    </div>
  );
}
