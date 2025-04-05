import React from 'react';

const Home = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>ברוכים הבאים לגמ"ח שמחת זקנתי</h1>
      <p style={styles.description}>
        אנו עוזרים למשפחות לשאול ציוד לאירועים בשמחה ובאהבה.
      </p>
    </div>
  );
};

const styles = {
  container: {
    textAlign: 'center',
    marginTop: '4rem',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '1rem',
    color: '#333',
  },
  description: {
    fontSize: '1.1rem',
    color: '#666',
  },
};

export default Home;
