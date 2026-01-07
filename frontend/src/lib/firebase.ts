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

// 限制只能使用暨大網域登入
// 注意：hd 參數只能設定一個 domain，Google 會在 popup 階段限制
// 後端會再次驗證所有允許的 domain (mail1.ncnu.edu.tw, ncnu.edu.tw)
// 這裡使用主要學生信箱網域
const allowedDomain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || 'mail1.ncnu.edu.tw';
googleProvider.setCustomParameters({
    hd: allowedDomain.split(',')[0].trim(), // 取第一個 domain
});

export { app, auth, googleProvider, firebase };
