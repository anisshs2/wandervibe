# READ.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nomadic Paths is a travel blog website built with vanilla HTML, CSS, and JavaScript. The site is hosted on Firebase Hosting and uses Firebase Firestore for dynamic content management. It features travel destination guides, highlights, and stories with SEO optimization and an AI-powered search feature using the Groq API.

## Technology Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Backend/Database**: Firebase Firestore
- **Hosting**: Firebase Hosting (project: nomadic-paths)
- **AI Integration**: Groq API (llama-3.3-70b-versatile model)
- **External Resources**:
  - Unsplash for images
  - Google Fonts (Poppins, Playfair Display, Montserrat)
  - Font Awesome 6.0.0

## Project Structure

- `public/` - Main web application directory (served by Firebase)
  - `index.html` - Homepage with navigation, hero section, destinations, highlights, stories, and FAQ
  - `destination.html` - Dynamic destination detail page (loads content from Firestore based on URL param)
  - `bali.html` - Static Bali destination page
  - `highlight.html` - Dynamic highlight detail page
  - `script.js` - Main JavaScript file with navigation, search, Firestore integration, and animations
  - `styles.css` - Global CSS with custom properties, responsive design, and animations
  - `sitemap.xml` - SEO sitemap
  - `robots.txt` - Search engine crawler instructions
- `firebase.json` - Firebase hosting configuration with rewrites and clean URLs enabled
- `.firebaserc` - Firebase project configuration

## Firebase Configuration

The project uses Firebase with the following setup:
- **Project ID**: nomadic-paths
- **Firestore Collections**:
  - `highlights` - Featured highlight cards (fields: title, description, imageUrl)
  - `destinations` - Travel destinations (fields: name, description, imageUrl, tags[])
  - `stories` - Travel stories (fields: title, description, imageUrl, category)

Firebase is initialized in `index.html` using Firebase SDK v12.3.0 modules. The database instance is exposed globally as `window.db`.

## Development Commands

### Deploy to Firebase
```bash
firebase deploy
```

### Local Development
Since this is a static site with Firebase dependencies, you should test using:
```bash
firebase serve
```
Or use Firebase hosting for testing to avoid CORS issues with the Groq API.

### Preview Changes
```bash
firebase hosting:channel:deploy preview
```

## Key Features & Implementation Notes

### Dynamic Content Loading
- Content is loaded from Firestore on page load (see `loadFirestoreContent()` in script.js:376)
- Destination and highlight pages use URL parameters (`?id=`) to load specific content
- Fallback to static HTML content if Firestore data is unavailable

### AI-Powered Search
- Implemented using Groq API (currently API key removed for security)
- Rate limiting: 30 req/min, 1000 req/day, 12000 tokens/min, 100000 tokens/day
- Rate limit tracking stored in localStorage
- Search function: `searchWithGroq()` in script.js:113

### SEO Optimization
- Comprehensive meta tags (Open Graph, Twitter Card)
- Dynamic meta tag updates on destination/highlight pages
- FAQ schema markup (JSON-LD) in index.html:306
- Canonical URLs and sitemap.xml

### Animations & UX
- Intersection Observer for scroll animations (script.js:51)
- Parallax effect on hero section (script.js:366)
- Smooth scrolling for anchor links (script.js:32)
- FAQ accordion functionality (script.js:478)
- Mobile-responsive navigation toggle (script.js:2)

### CSS Architecture
- CSS custom properties in `:root` for theming (styles.css:1)
- Mobile-first responsive design with breakpoints at 768px and 480px
- Gradient backgrounds and hover effects throughout
- Fade-in animations using `.fade-in-up` class

## Important Notes

1. **API Security**: The Groq API key has been removed from script.js:78. For production, implement a backend API to securely handle Groq requests instead of client-side calls.

2. **CORS Issues**: The Groq API integration may face CORS issues when testing from `file://` URLs. Always use Firebase hosting or a web server for testing.

3. **Firebase Initialization**: The Firebase config is exposed in index.html:396. While API keys can be public for Firebase, ensure Firestore security rules are properly configured.

4. **Content Management**: To add new destinations, highlights, or stories, add documents to the corresponding Firestore collections. The site will automatically render them on the homepage.

5. **Navigation**: The site uses hash-based navigation (`#home`, `#destinations`, etc.) for single-page scrolling on the homepage. Separate pages (destination.html, bali.html) use traditional navigation.

## Styling Conventions

- Use CSS custom properties (e.g., `var(--primary-color)`) for consistent theming
- All interactive elements should have hover states with `var(--transition)`
- Card components use `var(--border-radius)` and `var(--shadow)` for consistency
- Gradient backgrounds use `var(--gradient-primary)` or `var(--gradient-secondary)`
