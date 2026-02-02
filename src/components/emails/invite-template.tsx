import * as React from 'react';

interface InviteEmailProps {
  inviteLink: string;
  companyName: string;
  inviterName: string;
}

export const InviteEmailTemplate: React.FC<Readonly<InviteEmailProps>> = ({
  inviteLink,
  companyName,
  inviterName,
}) => (
  <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', padding: '20px', backgroundColor: '#f0f2f5' }}>
    <div style={{ maxWidth: '600px', margin: 'auto', backgroundColor: 'white', padding: '40px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
      <h1 style={{ color: '#111827', fontSize: '24px', fontWeight: 'bold' }}>
        You have been invited to join a team
      </h1>
      <p style={{ color: '#374151', lineHeight: '1.6', fontSize: '16px', marginTop: '16px' }}>
        <strong>{inviterName}</strong> has invited you to join the <strong>{companyName}</strong> team on DriverCheck.
      </p>
      <p style={{ color: '#374151', lineHeight: '1.6', fontSize: '16px', marginTop: '16px' }}>
        Click the button below to accept your invitation and create your account. This invitation will expire in 7 days.
      </p>
      <a
        href={inviteLink}
        target="_blank"
        style={{
          display: 'inline-block',
          padding: '14px 28px',
          margin: '24px 0',
          backgroundColor: '#3b82f6',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '16px',
        }}
      >
        Join {companyName}
      </a>
      <p style={{ color: '#6b7280', fontSize: '12px' }}>
        If you're having trouble clicking the button, copy and paste this link into your browser:
        <br />
        <a href={inviteLink} target="_blank" style={{ color: '#3b82f6', wordBreak: 'break-all' }}>{inviteLink}</a>
      </p>
      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '32px 0' }} />
      <p style={{ fontSize: '12px', color: '#6b7280' }}>
        If you were not expecting this invitation, you can safely ignore this email.
      </p>
    </div>
  </div>
);
