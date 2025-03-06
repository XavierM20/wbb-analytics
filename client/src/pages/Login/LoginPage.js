/*
LoginPage.js:
    This is the page where the user can login or register to the system.
    The user can only access the homepage if they are authenticated.
    The user can register by entering a username, password, and a key.
*/
import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../hooks/AuthProvider';
import './LoginPage.css';

const LoginPage = () => {
    let navigate = useNavigate();
    const auth = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [school, setSchool] = useState('');
    const [schools, setSchools] = useState([]);
    const [isAddingSchool, setIsAddingSchool] = useState(false);
    const [newSchool, setNewSchool] = useState('');
    const [errorUser, setErrorUser] = useState('');
    const [errorPass, setErrorPass] = useState('');
    const [errorConfirmPass, setErrorConfirmPass] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [incorrect, setIncorrect] = useState(false);

    const serverUrl = process.env.REACT_APP_SERVER_URL;

    useEffect(() => {
        if (auth.token) {
            navigate('/homepage');
        }
    }, [auth.token, navigate]);

    useEffect(() => {
        const fetchSchools = async () => {
            try {
                const response = await fetch(`${serverUrl}/api/schools`);
                const data = await response.json();
                setSchools(data);
            } catch (error) {
                console.error("Error fetching schools:", error);
            }
        };
        fetchSchools();
    }, [serverUrl]);

    const moveToRegister = () => {
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setIsRegistering(true);
    };

    const moveToLogin = () => {
        setUsername('');
        setPassword('');
        setIsRegistering(false);
    };

    const checkSeasonAndRedirect = async (schoolId) => {
        try {
            const response = await fetch(`${serverUrl}/api/seasons/${schoolId}`);
            const data = await response.json();
            if (data.exists) {
                navigate('/homepage');
            } else {
                navigate('/create-season');
            }
        } catch (error) {
            console.error("Error checking season:", error);
            navigate('/homepage');
        }
    };

    const handleRegister = async (event) => {
        event.preventDefault();
        let error = false;
        setErrorUser('');
        setErrorPass('');
        setErrorConfirmPass('');

        if (username.length < 8) {
            setErrorUser('Username is too short!');
            error = true;
        }

        const regex = /[!?@#$%^&*()]/;
        const cap = /[A-Z]/;
        const low = /[a-z]/;
        if (password.length < 8 || !regex.test(password) || !cap.test(password) || !low.test(password)) {
            setErrorPass('Password must be at least 8 characters and include a special character, uppercase, and lowercase letters.');
            error = true;
        }

        if (password !== confirmPassword) {
            setErrorConfirmPass('Passwords do not match!');
            error = true;
        }

        if (!school) {
            alert('Please select or add a school.');
            error = true;
        }

        if (!error) {
            try {
                const userData = { username, password, school };
                const userResponse = await fetch(`${serverUrl}/api/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData),
                });

                const newUser = await userResponse.json();
                if (!newUser.message) {
                    auth.loginAction({ username: newUser.username, token: newUser.role });
                    checkSeasonAndRedirect(newUser.schoolId);
                } else {
                    setErrorUser(newUser.message);
                }
            } catch (error) {
                console.error("Error registering user:", error);
            }
        }
    };

    const handleLogin = async (event) => {
        event.preventDefault();

        try {
            const loginResponse = await fetch(`${serverUrl}/api/users/userCheck`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const loginData = await loginResponse.json();
            if (loginData.message) {
                setIncorrect(true);
            } else {
                auth.loginAction({ username: loginData.username, token: loginData.role });
                navigate('/homepage');
            }
        } catch (error) {
            console.error("Error logging in:", error);
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newSchool, city, state }),
            });

            const result = await response.json();
            if (response.ok) {
                setSchools([...schools, result]);
                setSchool(result.name);
                setNewSchool('');
                setCity('');
                setState('');
                setIsAddingSchool(false);
            } else {
                alert(result.message || "Error adding school");
            }
        } catch (error) {
            console.error("Error adding school:", error);
            alert("An unexpected error occurred. Please try again.");
        }
    };

    const handleSchoolChange = (value) => {
        if (value === "add-new") {
            setIsAddingSchool(true);
        } else {
            setSchool(value);
            setIsAddingSchool(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-form">
                {!isRegistering ? (
                    <form onSubmit={handleLogin}>
                        <h2>Login</h2>
                        <label>
                            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                        </label>
                        <label>
                            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </label>
                        {incorrect && <p className='error'>Incorrect Username or Password</p>}
                        <button type="submit">Submit</button>
                        <p className='switch' onClick={moveToRegister}>Don't have an account? <b>Register</b></p>
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
                        <span>Role</span>
                        <select value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="">Select Role</option>
                            <option value="admin">Admin</option>
                            <option value="teacher">Teacher</option>
                            <option value="student">Student</option>
                        </select>
                    </label>

                    <label>
                        <span>School</span>
                        <select value={school} onChange={(e) => handleSchoolChange(e.target.value)}>
                            <option value="">Select School</option>
                            {schools.map((s) => (
                                <option key={s._id} value={s.name}>{s.name}</option>
                            ))}
                            <option value="add-new">Add New School</option>
                        </select>
                    </label>
                    {isAddingSchool && (
                        <div>
                            <input type="text" placeholder="School Name" value={newSchool} onChange={(e) => setNewSchool(e.target.value)} />
                            <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                            <input type="text" placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
                            <button type="button" onClick={handleAddSchool}>Add School</button>
                        </div>
                    )}
                        <button type="submit">Submit</button>
                        <p className="switch" onClick={moveToLogin}>Already have an account? <b>Login</b></p>
                    </form>
                )}
            </div>
        </div>
    );
};

export default LoginPage;