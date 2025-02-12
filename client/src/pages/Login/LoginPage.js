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
    const [schoolId, setSchoolId] = useState('');
    const [schools, setSchools] = useState([]);
    const [isAddingSchool, setIsAddingSchool] = useState(false);
    const [newSchool, setNewSchool] = useState('');
    const [errorUser, setErrorUser] = useState('');
    const [errorPass, setErrorPass] = useState('');
    const [errorConfirmPass, setErrorConfirmPass] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [incorrect,setIncorrect] = useState(false);
    

    const serverUrl = process.env.REACT_APP_SERVER_URL;

    useEffect(() => {
        if (auth.token) {
            navigate('/homepage');
        }
    }, [auth.token, navigate]);
    
    useEffect(() => {
        // Fetch existing schools from the server
        const fetchSchools = async () => {
            try {
                const response = await fetch(`${serverUrl}/api/schools`);
                const data = await response.json();
                console.log(data);
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
    
        if (!schoolId) {
            alert('Please select or add a school.');
            error = true;
        }
    
        if (!error) {
            try {
                const userData = {
                    username,
                    password,
                    schoolId  // Send school with the request
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
                setSchoolId(result._id); // Set selected school to newly added school
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
    
    

    const handleSchoolChange = (value) => {
        if (value === "add-new") {
            setIsAddingSchool(true);
        } else {
            console.log(value);
            setSchoolId(value);
            setIsAddingSchool(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-form">
                {!isRegistering ? (
                    <form onSubmit={handleLogin}>
                    {/* Login card */}
                    <h2>Login</h2>
                    <label><input type="text" placeholder="Username" aria-label="input for username" value={username} onChange={(e) => setUsername(e.target.value)}/></label>
                    <label><input type="password" placeholder="Password" aria-label="input for password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
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
                        <label><input type="text" placeholder="Username" aria-label="input for username" value={username} onChange={(e) => setUsername(e.target.value)} />{errorUser && <p className="error">{errorUser}</p>}</label>
                        <label><input type="password" placeholder="Password" aria-label="input for password" value={password} onChange={(e) => setPassword(e.target.value)} />{errorPass && <p className="error">{errorPass}</p>}</label>
                        <label><input type="password" placeholder="Confirm Password" aria-label="input for confirming password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />{errorConfirmPass && <p className="error">{errorConfirmPass}</p>}</label>
                        <label>
                            <select value={schoolId} onChange={(e) => handleSchoolChange(e.target.value)}>
                                <option value="">Select a school</option>
                                {schools.map((s) => (
                                    <option key={s.id} value={s._id}> {/* Use s.id as the value */}
                                        {s.name}
                                    </option>
                                ))}
                                <option value="add-new">Add School</option>
                            </select>
                        </label>
                        {isAddingSchool && (
                            <div>
                                <label><input type="text" placeholder="Enter new school name" aria-label="input for new school name" value={newSchool} onChange={(e) => setNewSchool(e.target.value)}/></label>
                                <label><input type="text" placeholder="Enter City" aria-label="input for city" value={city} onChange={(e) => setCity(e.target.value)}/></label>
                                <label><input type="text" placeholder="Enter State" aria-label="input for state" value={state} onChange={(e) => setState(e.target.value)}/></label>
                                <button type="button" onClick={handleAddSchool}>Add</button>
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

