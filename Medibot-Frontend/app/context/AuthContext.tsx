import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import api from "@/services/api";

// Define a type for your custom user data from the backend
interface BackendUserData {
    id: string;
    email: string;
    username: string;
    role: string;
    experience: string;
    location: string;
    license_number: string;
    created_at: string;
}

// Extend FirebaseAuthTypes.User with your backend data
// This ensures that the `user` object in context has all the properties
export type AppUser = FirebaseAuthTypes.User & BackendUserData;

type AuthContextType = {
    user: AppUser | null; // Now expects combined user data
    loading: boolean;
};

// Create a new context
const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// Create a provider that wraps parts of the app that need the context
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true); // True initially as we're fetching

    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in with Firebase. Now fetch additional data from your backend.
                try {
                    const response = await api.get<BackendUserData>("/user", {
                        params: { email: firebaseUser.email },
                    });
                    console.log(response.data)
                    const backendData = response.data;

                    // Combine Firebase user data with backend data
                    const combinedUser: AppUser = {
                        ...firebaseUser,
                        ...backendData,
                    };
                    setUser(combinedUser);
                } catch (error) {
                    console.error("Failed to fetch user data from backend:", error);
                    setUser(firebaseUser as AppUser);
                } finally {
                    setLoading(false);
                }
            } else {
                // User is signed out
                setUser(null);
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// Create a hook to access the context easily from any component
export const useAuth = () => useContext(AuthContext);