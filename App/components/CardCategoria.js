import React from 'react';

export default function CardCategoria({ name, image }) {
  return (
    <div className="card-categoria">
      <img src={image} alt={name} />
      <h3>{name}</h3>
    </div>
  );
}
