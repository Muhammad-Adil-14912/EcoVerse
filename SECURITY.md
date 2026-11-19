# EcoVerse security deployment

## Administrator access

The `/admin` route now requires Firebase Authentication and a verified custom claim:

```json
{ "admin": true }
```

Do not set this claim from browser code. Assign it only from a trusted environment using the Firebase Admin SDK and Application Default Credentials. Example (run from a secure administrator workstation or Cloud Shell after authenticating to the intended Firebase project):

```js
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp({ credential: applicationDefault() });

const email = 'ADMIN_EMAIL_TO_CONFIGURE';
const user = await getAuth().getUserByEmail(email);
await getAuth().setCustomUserClaims(user.uid, {
  ...(user.customClaims || {}),
  admin: true,
});
console.log(`Granted admin claim to UID: ${user.uid}`);
```

Install and run this only in a trusted environment with Firebase Admin SDK access. Never place service-account credentials or Admin SDK code in the frontend repository. After setting the claim, sign out and sign in again so the client refreshes its ID token.

## Firestore rules

The repository now contains `firestore.rules`, and `firebase.json` points Firebase deployment at it. The rules:
- Allow public reads of published events and programs.
- Allow public volunteer applications and event registrations, with field and size checks.
- Restrict volunteer and registration reads and all moderation/event writes to users with the `admin: true` custom claim.
- Deny all other collection access by default.

Deploy the rules to the correct Firebase project after reviewing the rules against the live project data:

```bash
firebase use <your-project-id>
firebase deploy --only firestore:rules
```

## Important rollout checks

1. Confirm the Firebase project selected by the CLI is the intended EcoVerse project.
2. Create and verify the administrator's Firebase Authentication account, then set the custom claim from a trusted environment.
3. Deploy the rules before exposing the updated Admin route.
4. Test public event reads, volunteer submissions, event registrations, and admin-only reads/updates in the Firebase Emulator Suite or a staging project.
5. Confirm any additional collections used by future features have explicit rules before enabling them. Unlisted collections are denied by default.

The Firebase web API key in `src/firebase.ts` is a client configuration identifier, not an admin credential. Firestore rules and Authentication claims are the actual authorization boundary.
