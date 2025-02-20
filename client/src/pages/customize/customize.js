import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './customize.css';

function PickColors() {
  const [colors, setColors] = useState(['', '', '', '', '']);
  const [activeColor, setActiveColor] = useState('');
  const [editIndex, setEditIndex] = useState(-1);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleColorChange = (event) => {
    setActiveColor(event.target.value);
    setError('');
  };

  const addOrUpdateColor = () => {
    if (!activeColor.trim()) {
      setError('Color cannot be empty.');
      return;
    }

    if (!/^#[0-9A-F]{6}$/i.test(activeColor)) {
      setError('Please enter a valid hex color code (e.g., #FF5733).');
      return;
    }

    if (colors.includes(activeColor) && editIndex === -1) {
      setError('This color is already selected.');
      return;
    }

    const updatedColors = [...colors];
    if (editIndex >= 0) {
      updatedColors[editIndex] = activeColor;
      setEditIndex(-1);
    } else {
      const emptyIndex = updatedColors.findIndex((color) => color === '');
      if (emptyIndex !== -1) {
        updatedColors[emptyIndex] = activeColor;
      } else {
        setError('You can only select up to 5 colors.');
        return;
      }
    }

    setColors(updatedColors);
    setActiveColor('');
  };

  const editColor = (index) => {
    setActiveColor(colors[index]);
    setEditIndex(index);
  };

  const deleteColor = (index) => {
    const updatedColors = [...colors];
    updatedColors[index] = '';
    setColors(updatedColors);
    setActiveColor('');
    setEditIndex(-1);
  };

  return (
    <div className="pick-colors">
    <button className='btn-home top-right-button' onClick={() => navigate('/homepage')}>Home</button>
      <div className="form-container">
        <label htmlFor="colorInput">Pick a Color (Hex Code):</label>
        <input type="text" id="colorInput" value={activeColor} onChange={handleColorChange} placeholder="#FFFFFF" aria-label="input for hexcode"/>
        {error && <div className="error-message">{error}</div>}
        <button type="button" onClick={addOrUpdateColor}>
          {editIndex >= 0 ? 'Update Color' : 'Add Color'}
        </button>
      </div>
      <div className="color-list-container">
        {colors.map((color, index) => (
          color && (
            <div key={index} className="color-item">
              <div className="color-preview" style={{ backgroundColor: color }}>
              </div>
              <span>{color}</span>
              <button onClick={() => editColor(index)}>Edit</button>
              <button onClick={() => deleteColor(index)}>Delete</button>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

export default PickColors;
