import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
    user: FirebaseAuthTypes.User | null;
    loading: boolean;
}

//create a new context
const AuthContext = createContext<AuthContextType>({user: null,loading: true});

//create a provider that wrap part of the app that needs to the context
export const AuthProvider = ({children}: any) => {
    const [user,setUser] = useState<FirebaseAuthTypes.User | null>(null) //the data that needs to be accessed globally within the auth context
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
        const unsubscribe = auth().onAuthStateChanged(currentUser => {
            setUser(currentUser);
            setLoading(false);
        })

        return unsubscribe;
    },[])

    return(
        //wrap children with the provider and pass the current object as its value
        <AuthContext.Provider value={{user,loading}}>
            {children}
        </AuthContext.Provider>
    )
}

//create a hook to access the context easily from any comp
export const useAuth = () => useContext(AuthContext)