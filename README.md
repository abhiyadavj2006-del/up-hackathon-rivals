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
