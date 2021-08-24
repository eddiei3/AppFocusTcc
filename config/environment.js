import Constants from 'expo-constants';

var environments = {
    staging: {
      FIREBASE_API_KEY: 'AIzaSyCeSZAYRsj2WGKAMM-6VZX-u0E7Jj82-zg',
      FIREBASE_AUTH_DOMAIN: 'focus-tcc.firebaseapp.com',
      FIREBASE_DATABASE_URL: 'https://focus-tcc-default-rtdb.firebaseio.com/',
      FIREBASE_PROJECT_ID: 'focus-tcc',
      FIREBASE_STORAGE_BUCKET: 'focus-tcc.appspot.com',
      FIREBASE_MESSAGING_SENDER_ID: '954522729514',
      GOOGLE_CLOUD_VISION_API_KEY: 'AIzaSyCzhcb1yWEj426JAmHlpvWzGSbuM-vdXWU'
    },
    production: {
      // Warning: This file still gets included in your native binary and is not a secure way to store secrets if you build for the app stores. Details: https://github.com/expo/expo/issues/83
    }
  };
  
  function getReleaseChannel() {
    let releaseChannel = Constants.manifest.releaseChannel;;
    if (releaseChannel === undefined) {
      return 'staging'
    } else if (releaseChannel === 'staging') {
      return 'staging';
    } else {
      return 'staging';
    }
  }
  function getEnvironment(env) {
    console.log('Release Channel: ', getReleaseChannel());
    return environments[env];
  }
  var Environment = getEnvironment(getReleaseChannel());
  export default Environment;