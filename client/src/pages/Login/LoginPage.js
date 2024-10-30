/*
LoginPage.js:
    This is the page where the user can login or register to the system.
    The user can only access the homepage if they are authenticated.
    The user can register by entering a username, password, and a key.
*/
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../hooks/AuthProvider';
import bcrypt from 'bcryptjs';
import './LoginPage.css';


const LoginPage = () => {
    let navigate = useNavigate();
    //Calling the Custom Hook useAuth
    const auth = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorUser,setErrorUser] = useState('');
    const [errorPass,setErrorPass] = useState('');
    const [errorKey,setErrorKey] = useState('');
    const [userKey, setUserKey] = useState('');
    const [incorrect,setIncorrect] = useState(false);
    const [isRegistering,setIsRegistering] = useState(false);

    const serverUrl = process.env.REACT_APP_SERVER_URL;
    /*
    useEffect:
    This effect is design to navigate you to the homepage when a authentication token is changed or you go to this page.
    This only Navigates you to home if a token is presented
    */
    useEffect(() => {
        if (auth.token) {
          navigate('/homepage');
        }
      }, [auth.token]);
    /*
    moveToRegister:
    This function is designed to move you to the registration card when you click the Register here link
    */
    const moveToRegister = () => {
        // reset the fields
        setUsername('');
        setPassword('');
        setIsRegistering(true);
    };
    /*
    moveToLogin:
    This function is designed to move you to the Login card when you click the back to Login button
    */
    const moveToLogin = () => {
        // reset the fields
        setUsername('');
        setPassword('');
        setUserKey('');
        setIsRegistering(false);
    };
    const handleRegister = async (event) => {
        //Clear/Initialize Errors
        var error = false;
        setErrorUser('');
        setErrorPass('');
        setErrorKey('');


        const saltRounds = 10;
        event.preventDefault();
        const regex = /[!?@#$%^&*()]/;
        const cap = /[A-Z]/;
        const low = /[a-z]/;
        // Making sure the username Length is greater than 8
        if(username.length < 8)
        {
            console.log("visited");
            setErrorUser('Username is too short!');
            error = true;
        }
        // Making sure the password Length is greater than 8
        if(password.length < 8)
        {
            setErrorPass('Password is too short!');
            error = true;
        }
        else if (!regex.test(password) || !cap.test(password) || !low.test(password)) {
            console.log(!regex.test(password));
            console.log(!cap.test(password));
            setErrorPass('Password does not contain characters like !?/& and/or a capital letter');
            error = true;

        }
        // Making sure the key is not empty
        if(userKey === '')
        {
            setErrorKey('You need to enter a key');
            error = true;

        }
        // If there is an error, return
        if(error === false)
        {
            try {
            
            const userData = {
                username: username,
                password: password,
                key: userKey
            };
                
            /*
            userResponse:
                This is a fetch request to create a user only if 
                the user does not exist and the userkey they entered is correct.
            */
            const userResponse = await fetch(serverUrl + '/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });
            // get Response
            const newUser = await userResponse.json();
            // if the user is created, login
            if(!newUser.message)
            {
            auth.loginAction({
                username: newUser.username,
                password: newUser.password,
                token: newUser.role,
            });
            navigate('/homepage');
            }
            else
            {
                // the user already exist
                if(newUser.user)
                {
                    setErrorUser(newUser.message);
                }
                //the user key is incorrect
                else if(newUser.key)
                {
                    setErrorKey(newUser.message);
                }
                else
                {
                // the user key is incorrect and the user already exist
                    setErrorUser(newUser.message0);
                    setErrorKey(newUser.message);
                }
                return;
            }
          
            
            } catch (error) {
                console.log(error);
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
        
    return(
            <div className="login-page-container">
                <div className="login-form">
                    { !isRegistering ? (
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
                        {/* Register card */}
                        <h2>Register</h2>
                        <label>
                            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}/>
                        </label>
                            <a className='error'>{errorUser}</a>
                        <label>
                            <input type="password" placeholder="Password"value={password} onChange={(e) => setPassword(e.target.value)} />
                        </label>
                            <a className='error'>{errorPass}</a>
                        <label>
                            <input type="text" placeholder="UserKey"value={userKey} onChange={(e) => setUserKey(e.target.value)} />
                        </label>
                            <a className='error'>{errorKey}</a>
                        <button type="submit">Submit</button>
                        <a className='switch' onClick={() => moveToLogin()}>Back to Login</a>
                    </form>
                    )}
                </div>
            </div>
    );
};

export default LoginPage;