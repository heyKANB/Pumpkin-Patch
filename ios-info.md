# iOS App Configuration

## App Store Connect Details
- **App ID**: 6749664824
- **Bundle ID**: com.huntergames.pumpkinpatch
- **App Name**: Pumpkin Patch
- **Apple ID**: Kathryn.new@hotmail.com
- **Integration Key**: Apple Connect App Mgr
- **Provisioning Profile**: PumpkinPatch2
- **Key ID**: 7629KQWD3Z
- **Issuer ID**: 27cc409c-83b9-4d67-a87f-99fc3d7c6f07

## Build Configuration
The CI/CD pipeline will:
1. Build the web app using Vite
2. Initialize Capacitor with the correct Bundle ID
3. Add iOS platform
4. Sync content to iOS project
5. Build iOS app (.ipa) for distribution
6. Submit to TestFlight automatically

## Note
The app ID (6749664824) is used in App Store Connect for app identification, while the Bundle ID (com.huntergames.pumpkinpatch) is used for code signing and app distribution with the "Apple Connect App Mgr" integration key and "PumpkinPatch2" provisioning profile.

## Security
The API key (AuthKey_7629KQWD3Z.p8) should be uploaded securely to CodeMagic's environment variables or integration settings. Never commit private keys to version control.

## Troubleshooting
If you encounter provisioning profile errors:
1. Ensure the "Apple Connect App Mgr" integration is properly configured in CodeMagic
2. Verify the API key is uploaded to the integration settings
3. Check that automatic code signing is enabled in the Xcode project
4. The build process removes all manual provisioning settings to force automatic signing