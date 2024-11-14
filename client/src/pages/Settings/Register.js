/* 
Register.js:
    This is the page where you can create a userkey linked to a specific role.
*/
import './Settings';
import React, { useState } from 'react';

const Register = ({ isOpen, onClose }) => {
    const [giveRole, setGiveRole] = useState(false);
    const [role, setRole] = useState('');
    const [key, setKey] = useState('');
    const serverUrl = process.env.REACT_APP_SERVER_URL;
    const GiveKey = async () => {
      const data = {
        role: role,
      };
      console.log(data);
      fetch(serverUrl + '/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      .then(response => response.json())
      .then(data => {
        if(!data.message){
          setKey(data.key);
          setGiveRole(true);
        }
      } )
      
      
    }    
    
    if(!isOpen) return null;
 
    return (
        <div className="register-overlay">
          <div className="register-content">
            <button className="closeReg-button" onClick={onClose}>X</button>
            {!giveRole ? (
            <div>
            <h2>Register</h2>
              <div>
                <br/>
                <h4>What Role will the user have?</h4>
                
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="Select">Select</option>
                    <option value="Admin">Full Access</option>
                    <option value="User">User Access</option>
                </select>
                <br/>
                <button className="submitReg-button" onClick={() => GiveKey()}>Submit</button>
              </div>
            </div>
            ) : (
              <div>
                {/*show the key the user will recieve*/}
                <label>User Key Created!</label>
                <p className="KeyContainer">User Key:  
                <input className="InvisibleInput" type="text" value={key} readOnly/>
                </p>
              </div>  
            )}
          </div>
        </div>
      );
    }

export default Register;