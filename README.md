# CampusFlow

[![Netlify Status](https://api.netlify.com/api/v1/badges/59ddb3af-4028-40ce-b1d4-8176b76cf2ad/deploy-status)](https://app.netlify.com/projects/5-e/deploys)

CampusFlow is a lightweight Progressive Web App for tracking a college timetable, academic calendar, and course information in one place. It is designed to feel like a native app on desktop and mobile, with offline support and quick access to the current day’s schedule.

## Features

- Live timetable for the current day and week
- Academic calendar with holidays, examination dates, and important activities
- Course overview with faculty and room information
- Search across courses, events, faculty, and rooms
- Installable PWA experience
- Offline-friendly behavior via service worker
- Static data-driven structure for easy updates

## Project Structure

- `index.html` — app shell and UI structure
- `style.css` — visual design and responsive layout
- `bundle.json` — timetable, calendar, and metadata configuration
- `sw.js` — service worker for offline support and caching
- `icon.png` — app icon
- `LICENSE` — MIT license

## Run Locally

Because this project is static, you do not need a build step.

1. Open the project folder in your browser or serve it locally.
2. From the project root, run:

```bash
python3 -m http.server 8000
```

3. Visit:

```text
http://localhost:8000
```

You can also open `index.html` directly in a browser, though a local web server is recommended for the most reliable behavior.

## Customizing Data

Most app content is driven by `bundle.json`. You can update:

- semester details
- timetable entries
- course information
- academic calendar events
- holidays and working Saturdays

This makes it easy to adapt the app for a different semester or academic year.

## Notes

- The app is best viewed on a local server or deployed to a static hosting platform.
- The service worker enables offline caching for a smoother PWA experience.
- This project is licensed under the MIT License.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
