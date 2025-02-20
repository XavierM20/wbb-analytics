/*
AutherProvider:
    This is a custom hook to provide acces to users that have successfully log in, 
    and handle logout functionality.

*/
import {useState,useContext, useEffect, createContext } from "react";
import { useNavigate } from "react-router-dom";
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user,setUser] = useState(null);
    const [result, setRes] = useState([]);
    const [token,setToken] = useState(sessionStorage.getItem("site") || "");
    const navigate = useNavigate();
    /*
    loginAction:
        This adds the user and token to the state and session storage.
    */
    const loginAction = async (data) => {
        try {
            
            if (data) {
                setUser(data.username);
                setToken(data.token);

                sessionStorage.setItem("site", data.token);
                sessionStorage.setItem("schoolID", data.schoolId);

                // Use token here instead of data.token
            }
            else{
            throw new Error(data.message);
            }
        }
        catch(err)
        {
            console.log(err);
        }
    };
    /*
    logOut:
        This removes the user and token from the state and session storage.
        Returns user to login page.
    */
    const logOut = () => {
        setUser(null);
        setToken("");
        sessionStorage.removeItem("site");
        navigate('/');
    
    };
    return (<AuthContext.Provider value={{token, user, loginAction, logOut}}>
            {children}
        </AuthContext.Provider>
    );

};

export default AuthProvider;
/*
useAuth:
    This is a custom hook to provide acces to the AuthContext.

    This allows this function to be used in other pages.
*/
export const useAuth = () => {
  return useContext(AuthContext);
};