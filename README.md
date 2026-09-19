# Up Hackathon Rivals

Static landing page and auth flow for a hackathon event website.

## Run locally

Open the project folder and start a local static server:

```bash
python -m http.server 8000
```

Then open:

- http://localhost:8000/
- http://localhost:8000/register.html
- http://localhost:8000/login.html

## Deploy

This project is already deployment-ready as a static website.

## Enable shared registrations

The auth pages work locally with browser storage. To share registrations across devices:

1. Open [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Add a Web app in Project settings and copy its Firebase configuration.
3. In `script.js`, replace the empty `firebaseConfig` values with that configuration.
4. In Firebase Console, create a Firestore Database in production mode.
5. Add a Firestore collection named `registeredUsers`.
6. Publish rules that allow the website to create and query registration records. For a hackathon demo, start with the Firebase-generated development rules, then tighten them before collecting real personal data.

The site keeps local storage as a fallback when Firebase is not configured. The OTP shown on screen is a demo flow; production email OTP requires Firebase Authentication or a server-side email provider.
### Netlify
1. Drag and drop the project folder into Netlify.
2. It will publish automatically using the default static site behavior.

### GitHub Pages
1. Push the project to a GitHub repository.
2. Open repository settings > Pages.
3. Select the main branch and deploy the root folder.

### Vercel
1. Import the repository.
2. Deploy as a static project without build settings.

## Files

- index.html: homepage
- register.html: registration page
- login.html: login page
- style.css: styling
- script.js: interactivity
- netlify.toml: deployment config for Netlify
- .nojekyll: disables Jekyll processing on GitHub Pages
