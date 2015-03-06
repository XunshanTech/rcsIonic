# RCSIonic

### An Ionic application (http://ionicframework.com/)

## Build
1. npm install -g cordova ionic
3. Clone the repo into a new directory
4. ionic platform add android
5. Open \platforms\android\AndroidManifest.xml, and change the sdkVer line to:
     'uses-sdk android:minSdkVersion="19" android:targetSdkVersion="19"'
   That is to require Android version >= 4.4
6. ionic build android
7. The .apk file can be found at: \platforms\android\ant-build\rcsIonic-debug.apk

## Debug
The app can be run in browser for easy debug experience:
1. ionic serve
2. Browse to `http://localhost:8100` to view the app