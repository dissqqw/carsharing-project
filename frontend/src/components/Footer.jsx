const Footer = () => {
  return (
    <div style={{
      background: '#1C1C19',
      fontFamily: '"Inter Tight", sans-serif',
      padding: '40px 50px',
    }}>
      <div style={{
        fontWeight: 400,
        fontSize: 16,
        lineHeight: '22px',
        color: '#FFFFFF',
        opacity: 0.5,
        marginBottom: 20,
      }}>
        Все права защищены. v1.0
      </div>
      <div style={{
        fontWeight: 400,
        fontSize: 16,
        lineHeight: '19px',
        letterSpacing: '-0.02em',
        color: '#FFFCF8',
        opacity: 0.5,
      }}>
        © 2026 DriveHub
      </div>
    </div>
  );
};

export default Footer;