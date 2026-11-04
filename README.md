# Bright Up website

The promotional website for [Bright Up](https://brightup-learn.netlify.app), a place to learn, teach
and run a training institute. It is one static page with no framework and no build step, so any static
host can serve it as it is.

## See it locally

```bash
python -m http.server 8137
```

Then open <http://127.0.0.1:8137>. Opening `index.html` directly also works.

## What's here

| Path | What it is |
|---|---|
| `index.html` | All the page's words and structure |
| `css/site.css` | The design: colours and fonts are named at the top |
| `js/site.js` | All the motion: hero orbit, scroll story, reveals, sparks, tabs, phone menu and video. The page still works without it |
| `assets/img/` | Logos and screenshots (WebP, in two sizes each) |
| `assets/img/logo/` | The real logo cut into layers for the closing animation. At rest they form the exact logo, so replace them if the logo changes |
| `assets/video/bright-up-tour.mp4` | The 48-second tour, with sound |
| `assets/fonts/` | Inter and Plus Jakarta Sans, served from this site |

## Things to change

- **Invitation address:** search `index.html` for `brightup.learn@gmail.com`. It appears three times.
- **App address:** search for `brightup-learn.netlify.app`.
- **Site address:** if the site moves from `https://sivateja36.github.io/Bright-Up-App-Website`, update `og:image`, `og:url` and the
  canonical link in `index.html`.

## Keeping it true

Every claim on the page comes from the real product, and the screens are the real app running on
fictional sample data. Check the page when the app changes. For example, the Playground's languages and
the Python track's numbers (280 programs, 195 quiz questions, 13 topics) are stated in the copy. The page
has no invented statistics, customers or testimonials, and shouldn't gain any.

## Motion

Animations respect the device's reduced-motion setting, loops pause off screen, and visitors can pause them with the Pause animations button.

## Hosting

The site is on GitHub Pages at <https://sivateja36.github.io/Bright-Up-App-Website/>, published from the `gh-pages` branch. To update it, push to
both `main` and `gh-pages`.

GitHub Pages isn't meant as free hosting for an online business, so if the site grows beyond a simple
promotional page, move it to another static host: upload this whole folder and update the site address.
The video is about 10 MB and only downloads when someone presses play.

## Credits

- [Inter](https://rsms.me/inter/) and [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans): SIL Open Font License
- [Lucide](https://lucide.dev) icons: ISC License
