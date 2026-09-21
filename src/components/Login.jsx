import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase/config";

export default function Login() {
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);

      console.log("Logged in:", result.user);

      alert(`Welcome ${result.user.displayName}!`);
    } catch (error) {
      console.error("Google Login Error:", error);
      alert("Google login failed. Check the console.");
    }
  };

  return (
    <div>
      <h1>Welcome to Gradivo 👋</h1>

      <button onClick={handleGoogleLogin}>
        Continue with Google
      </button>
    </div>
  );
}