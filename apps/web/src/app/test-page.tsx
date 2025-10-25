export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#8B0015' }}>Financial Literacy Assessment Platform</h1>
      <p style={{ color: '#333' }}>Loyola University Chicago - Quinlan School of Business</p>
      <br />
      <a
        href="/start"
        style={{
          backgroundColor: '#8B0015',
          color: 'white',
          padding: '10px 20px',
          textDecoration: 'none',
          borderRadius: '5px',
          display: 'inline-block'
        }}
      >
        Start Assessment
      </a>
    </div>
  );
}