import React from 'react';
import '../styles/cheques.css'; 

const Banner = ({ texto }) => {
  return (
    <section className="cheques-banner">
      {texto && <h2>{texto}</h2>}
    </section>
  );
};

export default Banner;