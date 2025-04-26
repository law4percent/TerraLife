Steps for react-native mobile app development.

1. npm install -g expo-cli                                     # if not yet installed run this
2. npx create-expo-app@latest app-name                         # create new project
3. cd app-name		                                             # navigate to the project
4. Install dependencies:
   - npx expo install   firebase
                        @react-native-async-storage/async-storage    # optional but recommended
                        expo-router
                        react-native-screens
                        react-native-safe-area-context
                        expo-constants
                        expo-status-bar
                        react-native-chart-kit
                        expo-notifications
                        expo-device
                  
7. npx expo prebuild (optional)
8. npx expo start 		                                         # run to test


app-name/
│── app/
│     ├── (tabs)/                # Tab navigation components
│     │     ├── _layout.tsx
│     │     ├── explore.tsx
│     │     ├── index.tsx         # Home Screen 
│     ├── auth/                   # Authentication screens
│     │     ├── login.tsx
│     │     ├── signup.tsx
│     ├── context/                 # Contexts for state management
│     │     ├── auth.tsx
│     ├── _layout.tsx              # Main app layout and routing setup
│     ├── +not-found.tsx           # 404 page (optional)
│── assets/                       
│     ├── fonts/                  
│     │     ├── SpaceMono-Regular.ttf  # Custom fonts
│     ├── images/                 
│     │     ├── app-icon.png      # App icon
│── components/                   # Reusable UI components
│── config/                       
│     ├── firebase.ts             # Firebase config and setup
│── hooks/                        
│     ├── useAuth.ts              # Custom hook for authentication logic
│     ├── useUserData.ts          # Custom hook for fetching user data
│── scripts/                      
│     ├── reset-project.js        # Utility script for resetting the project (optional)
│── app.json                      # Expo configuration file
│── package-lock.json             # Dependency lock file
│── package.json                  # Project metadata and dependencies
│── tsconfig.json                 # TypeScript configuration (if using TypeScript)





Export into APK
1. npm install -g eas-cli
2. eas build:configure
3. eas build --profile preview --platform android
   eas build --profile production --platform android