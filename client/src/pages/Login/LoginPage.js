/*
LoginPage.js:
    This is the page where the user can login or register to the system.
    The user can only access the homepage if they are authenticated.
    The user can register by entering a username, password, and a key.
*/
import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet } from 'react-native';
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
    const [incorrect, setIncorrect] = useState(false);
    const [role, setRole] = useState('');
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
                navigate('/season');
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
        if (!schoolId) {
            alert('Please select or add a school.');
            error = true;
        }
    
        if (!role) {
            alert('Please select a role.');
            error = true;
        }
    
        if (!error) {
            try {
                const userData = { username, password, role, schoolId };

                const userResponse = await fetch(`${serverUrl}/api/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData),
                });
    
                const newUser = await userResponse.json();
                if (!newUser.message) {
                    auth.loginAction({
                        username: newUser.username,
                        token: newUser.role,
                        schoolId: schoolId,
                    });
    
                    // Redirect based on role
                    if (newUser.role === "Player") {
                        navigate('/homepage');
                    } else if (newUser.role === "Coach") {
                        navigate('/season');
                    }
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
                auth.loginAction({username: loginData.username, password: loginData.password, token: loginData.role, schoolId: loginData.schoolId});
    
                // Redirect based on role
                if (loginData.role === "Player") {
                    navigate('/homepage');
                } else if (loginData.role === "Coach") {
                    navigate('/season');
                }
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
                setSchoolId(result._id);
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
            setSchoolId(value);
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
                            <select value={role} onChange={(e) => setRole(e.target.value)}>
                                <option value="">Select Role</option>
                                <option value="Coach">Coach</option>
                                <option value="Player">Player</option>
                            </select>
                        </label>
                        <label>
                            <select value={schoolId} onChange={(e) => handleSchoolChange(e.target.value)}>
                                <option value="">Select School</option>
                                {schools.map((s) => (
                                    <option key={s.id} value={s._id}> {/* Use s.id as the value */}
                                        {s.name}
                                    </option>
                                ))}
                                <option value="add-new">Add New School</option>
                            </select>
                        </label>
                        <Modal
                            visible={isAddingSchool}
                            animationType="fade"
                            transparent={true}
                            onRequestClose={() => setIsAddingSchool(false)}
                        >
                            <View style={styles.modalOverlay}>
                                    <form>
                                        <input className='inputAddSchool' type="text" placeholder="School Name" value={newSchool} onChange={(e) => setNewSchool(e.target.value)} />
                                        <input type="inputAddSchool" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                                        <input type="inputAddSchool" placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
                                        <button type="button" onClick={handleAddSchool}>Add School</button>
                                    </form>
                            </View>
                        </Modal>
                        <button type="submit">Submit</button>
                        <p className="switch" onClick={moveToLogin}>Already have an account? <b>Login</b></p>
                    </form>
                )}
            </div>
        </div>
    );
};

const styles = StyleSheet.create({
    container: {
      marginTop: 100,
      alignItems: 'center',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)', // Dim background
    },
    modalContent: {
      backgroundColor: 'white',
      marginHorizontal: 20,
      width: '50%',
      padding: 20,
      borderRadius: 10,
      elevation: 5,
      backgroundColor: 'rgba(200, 157, 70, .8)',
    },
});

export default LoginPage;