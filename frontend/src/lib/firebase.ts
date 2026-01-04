// 使用 compat 版本避免 undici 問題
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// 確保只初始化一次
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const app = firebase.app();
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// 限制只能使用特定網域登入
googleProvider.setCustomParameters({
    hd: 'mail1.ncnu.edu.tw',
});

export { app, auth, googleProvider, firebase };
