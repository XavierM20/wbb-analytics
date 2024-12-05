import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../hooks/AuthProvider';
import './LoginPage.css';

const LoginPage = () => {
    const handleLogin = async (event) => {
        const saltRounds = 10;
        event.preventDefault();

        /*
        loginResponse:
            This is a fetch request to check if the user exist and if the password is correct
        */
        const loginResponse = await fetch(serverUrl + '/api/users/userCheck',
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({username: username, password: password}),

    })

        const loginData = await loginResponse.json();
        // If the user does not exist or the password is incorrect, return an error
        if(loginData.message){
            setIncorrect(true);
        } else {
            auth.loginAction({username: loginData.username, password: loginData.password, token: loginData.role});
            navigate('/homepage');
        }
        };


    const handleAddSchool = async () => {
        if (!newSchool || !city || !state) {
            alert("All fields (name, city, state) are required");
            return;
        }
    
        try {
            const userData = {
                username,
                password,
                school
            };
            const userResponse = await fetch(`${serverUrl}/api/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });
            const newUser = await userResponse.json();
            if (!newUser.message) {
                auth.loginAction({
                    username: newUser.username,
                    token: newUser.role,
                });
                navigate('/homepage');
            } else {
                setErrorUser(newUser.message);
            }
        } catch (error) {
            console.error(error);
        }
    }
};

const handleAddSchool = async () => {
    if (!newSchool || !city || !state) {
        alert("All fields (name, city, state) are required");
        return;
    }

    try {
        const response = await fetch(`${serverUrl}/api/schools`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: newSchool, city: city, state: state }),
        });

        const result = await response.json();

        console.log('API Response:', result); // Log the result for debugging

        if (response.ok) {
            setSchools([...schools, result]); // Update school list
            setSchool(result.name); // Set selected school to newly added school
            setNewSchool(''); // Clear input
            setCity(''); // Clear city input
            setState(''); // Clear state input
            setIsAddingSchool(false); // Hide input field
        } else {
            alert(result.message || "Error adding school");
        }
    } catch (error) {
        console.error("Error adding school:", error);
        alert("An unexpected error occurred. Please try again.");
    }
};

    return (
        <div className="login-page-container">
            <div className="login-form">
                {!isRegistering ? (
                    <form onSubmit={handleLogin}>
                    {/* Login card */}
                    <h2>Login</h2>
                    <label>
                        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}/>
                    </label>
                    <label>
                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </label>
                    {incorrect === true && (
                        <a className='error'>Incorrect Username or Password</a>
                    )}
                    <button type="submit">Submit</button>
                    <a className='switch' onClick={() => moveToRegister()}>
                        <span className="regular-text">Don't have an account? </span>
                        <span className="bold-text">Register </span>
                    </a>
                </form>
                ) : (
                    <form onSubmit={handleRegister}>
                        <h2>Register</h2>
                        <label>
                            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                            {errorUser && <p className="error">{errorUser}</p>}
                        </label>
                        <label>
                            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            {errorPass && <p className="error">{errorPass}</p>}
                        </label>
                        <label>
                            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            {errorConfirmPass && <p className="error">{errorConfirmPass}</p>}
                        </label>
                        <label>
                            <select value={school} onChange={(e) => handleSchoolChange(e.target.value)}>
                                <option value="">Select a school</option>
                                {schools.map((s) => (
                                    <option key={s.id} value={s.name}>
                                        {s.name}
                                    </option>
                                ))}
                                <option value="add-new">Add School</option>
                            </select>
                        </label>
                        {isAddingSchool && (
                            <div>
                                <label>
                                    <input
                                        type="text"
                                        placeholder="Enter new school name"
                                        value={newSchool}
                                        onChange={(e) => setNewSchool(e.target.value)}
                                    />
                                </label>
                                <label>
                                    <input
                                        type="text"
                                        placeholder="Enter City"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                    />
                                </label>
                                <label>
                                    <input
                                        type="text"
                                        placeholder="Enter State"
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                    />
                                </label>
                                <button type="button" onClick={handleAddSchool}>
                                    Add
                                </button>
                            </div>
                        )}

                        <button type="submit">Submit</button>
                        <p className="switch" onClick={moveToLogin}>
                            Already have an account? <b>Login</b>
                        </p>
                    </form>
                )}
            </div>
        </div>
    </div>
);
};

export default LoginPage;
