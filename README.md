# Archived

Since Reddit has made the decision to severely limit its
public API, this app is no longer functional, so I'm (sadly)
archiving it.

## Tidder
Tidder (reddit backwards) is an open-source Reddit client built entirely with
web technologies, the project is currently under beta development phase and
it's available for download for Windows, macOS and Linux.

If you're interesed, you can also check out the entire design process for this
project on [this GitLab repo](https://gitlab.com/Isidore/tidder-mockup), there
you can find the Sketch project file, icons, fonts and everything that was
used during the design process of this project.

Much of this project is based on an earlier project that I ended up abandoning
in favor of the Tidder app, if you're curious about the evolution of the Tidder
project, you can also take a look at the
[design project](https://gitlab.com/Isidore/reddit-redesign-mockup) and the
actual (kind of) working [code](https://gitlab.com/Isidore/reddit-redesign) of
this earlier concept of the project on my GitLab account.

## Building

### Requirements

- Node.js 24 (LTS) and npm

If you use [Nix](https://nixos.org/) with flakes, the repository includes a
`flake.nix` that provides Node.js. Run `nix develop`, or run `direnv allow`
once if you use [direnv](https://direnv.net/) with nix-direnv.

Install the dependencies with:

```bash
npm install
```

Electron downloads its own binary the first time it runs.

### Reddit app registration

Tidder logs in through your default browser, and Reddit then redirects back
to a small local server the app runs during login. The Reddit app whose client
ID is in `app/config/authConfig.json` must be an "installed app" with this
redirect URI, set at [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps):

```
http://127.0.0.1:65010/callback
```

### Building for development

To run the development version of the application locally, run:

```bash
npm run dev
```

This starts the Angular development server on port `4200` and opens the app
in Electron once the server is ready. Changes to the app's code are rebuilt
and reloaded in the running window automatically.

To run a production build without packaging it:

```bash
npm start
```

### Building for production

You can generate the application binaries for your current platform by
running:

```bash
npm run build:pack
```

Once finished, you can find the application binaries under the `release`
directory. There are also platform-specific scripts: `build:pack:mac`
(Intel and Apple Silicon), `build:pack:win` and `build:pack:linux`.

macOS builds are ad-hoc signed. They run on the machine that built them, but
distributing them to other people requires signing them with an Apple
Developer ID.

### Multi-platform build

Depending on your system, there are a few packages that you need to install
first before you can build the application's binaries for other platforms.
See electron-builder's
[multi-platform build guide](https://www.electron.build/multi-platform-build)
for the details. With those installed, run:

```bash
npm run build:pack:multi
```

Once the process is finished, you can find the application's binaries under
the `release` directory.

## Screenshot

![Application Screenshot](/resources/screenshot.png?raw=true)

## License

Tidder is distributed under the GNU GPL license 2.0
http://www.gnu.org/licenses/gpl-2.0.html
