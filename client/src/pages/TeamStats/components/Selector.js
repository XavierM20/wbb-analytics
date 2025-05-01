import React from 'react';
import './Selector.css';

function Selector({ options, onChange, label, value }) {
  return (
    <div className="selector-field-container">
      <label className="selector-label">{label}:</label>
      <select className="selector-select" onChange={onChange} value={value}>
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default Selector;
