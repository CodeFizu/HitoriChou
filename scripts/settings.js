// Firebase configuration and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js"; // ✅ import from hidden config

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Monitor authentication state change
onAuthStateChanged(auth, (user) => {
  const logOutSection = document.querySelector('.logOut-settings');
  
  if (user) {
    console.log("User logged in:", user);
    
    const userRef = doc(db, "users", user.uid);
    getDoc(userRef).then((docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        
        // Construct a clean message
        const message = `
          こんにちは！
          メール: ${userData.email}
          ユーザー名: ${userData.username}
        `;
        
        alert(message); // Show a cleaner message without the JSON formatting
      } else {
        alert("No user data found. Maybe this is the first login.");
      }
    }).catch((error) => {
      console.error("Error retrieving user data:", error);
    });

    // Show the Log Out button when the user is logged in
    logOutSection.style.display = 'block';
  } else {
    console.log("No user logged in");
    logOutSection.style.display = 'none';
  }
});


// SIGN UP
const signUpForm = document.getElementById("signUpForm");
signUpForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("email").value;       // Email
  const username = document.getElementById("username").value; // Username
  const password = document.getElementById("password").value; // Password

  if (!email || !username || !password) {
    alert("Email, username, and password are required.");
    return;
  }

  // Attempt to create a new user
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      alert("User registered successfully!");
      signUpForm.reset();

      // Save user data to Firestore
      const userRef = doc(db, "users", user.uid);
      setDoc(userRef, {
        email: user.email,    // Save the email
        username: username,   // Save the username
      })
      .then(() => {
        console.log("User data saved to Firestore");
      })
      .catch((error) => {
        console.error("Error saving user data:", error);
        alert("Error saving user data to Firestore.");
      });
    })
    .catch((error) => {
      const errorMessage = error.message;
      console.error("Registration error:", errorMessage);
      alert(errorMessage);
    });
});


// LOGIN
const loginForm = document.getElementById("loginForm");
loginForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value; 
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    alert("Email and password are required.");
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      alert("Login successful");
      loginForm.reset();
      window.location.href = "home.html"; // Redirect to the dashboard
    })
    .catch((error) => {
      const errorMessage = error.message;
      console.error("Login error:", errorMessage);
      alert("Login failed: " + errorMessage);
    });
});

// LOG OUT
const logOutButton = document.getElementById("logOutButton");
logOutButton.addEventListener("click", function () {
  signOut(auth)
    .then(() => {
      alert("Logged out successfully");
      window.location.href = "settings.html"; // Redirect to settings or login page
    })
    .catch((error) => {
      console.error("Error logging out:", error);
      alert("Error logging out.");
    });
});