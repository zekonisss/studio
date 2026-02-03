import * as React from 'react';

interface WelcomeEmailProps {
  loginUrl: string;
}

export const WelcomeEmailTemplate: React.FC<Readonly<WelcomeEmailProps>> = ({ loginUrl }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: 1.5, color: '#333', padding: '20px' }}>
    <div style={{ maxWidth: '600px', margin: '0 auto', border: '1px solid #ddd', borderRadius: '8px' }}>
      <div style={{ backgroundColor: '#f7f7f7', padding: '20px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
        <h1 style={{ margin: 0, color: '#0056b3', fontSize: '24px' }}>Sveiki!</h1>
      </div>
      <div style={{ padding: '20px' }}>
        <p>Jūsų DriverCheck paskyra buvo sėkmingai patvirtinta. Jums suteiktas bandomasis laikotarpis.</p>
        <p>Galite prisijungti ir pradėti naudotis sistema paspaudę žemiau esantį mygtuką:</p>
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a
            href={loginUrl}
            target="_blank"
            style={{
              backgroundColor: '#0056b3',
              color: 'white',
              padding: '12px 25px',
              textDecoration: 'none',
              borderRadius: '5px',
              fontWeight: 'bold',
            }}
          >
            Prisijungti
          </a>
        </div>
        <p style={{ fontSize: '12px', color: '#777' }}>
          Jei mygtukas neveikia, galite nukopijuoti ir įklijuoti šią nuorodą į savo naršyklę:
          <br />
          <a href={loginUrl} target="_blank" style={{ color: '#0056b3' }}>{loginUrl}</a>
        </p>
      </div>
      <div style={{ backgroundColor: '#f7f7f7', padding: '15px', textAlign: 'center', borderTop: '1px solid #ddd', fontSize: '12px', color: '#777' }}>
        &copy; {new Date().getFullYear()} DriverCheck
      </div>
    </div>
  </div>
);
