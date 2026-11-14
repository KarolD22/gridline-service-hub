# GRIDLINE // Service Hub

A lightweight, self-hosted start page for accessing services on a home
or private network. GRIDLINE presents your local web applications in one
searchable directory, with category filtering and direct links to each
service.

It is a static frontend served by Python's built-in HTTP server and can
run as a `systemd` service on Linux.

> **Scope:** GRIDLINE is a service directory, not a service monitor. It
> does not check whether listed applications are online, manage them, or
> provide authentication.

## Features

-   Central directory for local network services
-   Search by service name, description, URL, or category
-   Filter services by category
-   Alphabetical sorting
-   Responsive card layout for desktop and mobile screens
-   Live local-time clock
-   Hostname and port displayed on each service card
-   Service definitions stored separately in `services.json`
-   Optional `systemd` integration to start the web server automatically
    at boot

## Preview

GRIDLINE uses a dark, minimal interface with a responsive grid of
service cards. Each card opens the configured service URL in a new
browser tab.

## Project structure

``` text
gridline-service-hub/
├── index.html       # Page structure and application entry point
├── styles.css       # Layout, theme, and responsive styling
├── app.js           # Loading, searching, filtering, and rendering logic
├── services.json    # Your service directory data
├── install.sh       # Automated Linux/systemd installer
└── README.md        # Project documentation
```

The frontend files are deliberately separated: - `index.html` contains
the page markup and references the stylesheet and JavaScript. -
`styles.css` contains the visual design. - `app.js` loads the service
data and builds the interface. - `services.json` is the configuration
file you edit to add, remove, or change services. - `install.sh`
installs the files and creates/enables a systemd unit.

## Requirements

For manual/local use: - A modern web browser - A web server capable of
serving static files

For the automated Linux installation: - Linux with `systemd` - Python 3
available at `/usr/bin/python3` - `sudo` or root access for
installation - An existing Linux user account to run the service - The
complete project directory, including all four frontend/data files and
`install.sh`

The installer does not create the Linux user. It asks for an existing
username and configures systemd to run GRIDLINE as that user.

## Quick installation (Linux with systemd)

1.  Download or clone the repository.
2.  Open a terminal in the project directory.
3.  Run the installer:

``` bash
chmod +x install.sh
sudo ./install.sh
```

4.  Enter the existing Linux username that should run GRIDLINE when
    prompted.
5.  After installation, open:

``` text
http://<server-ip>:8000
```

Replace `<server-ip>` with the IP address of the Linux machine running
GRIDLINE.

The installer: 1. Checks that it is running as root (normally through
`sudo`). 2. Checks that `index.html`, `styles.css`, `app.js`, and
`services.json` are present. 3. Prompts for a Linux username and
verifies that the account exists. 4. Copies the application files to
`/opt/gridline`. 5. Creates `/etc/systemd/system/gridline.service` using
the selected username and its primary group. 6. Reloads systemd, enables
the service at boot, and starts it immediately.

Default settings:

  Setting                  Default
  ------------------------ -----------------------------------
  Installation directory   `/opt/gridline`
  systemd unit             `gridline.service`
  HTTP port                `8000`
  Bind address             `0.0.0.0`
  Runtime                  `/usr/bin/python3 -m http.server`

### Change the port or bind address

The installer accepts `PORT` and `BIND_ADDRESS` environment variables:

``` bash
sudo PORT=8080 BIND_ADDRESS=0.0.0.0 ./install.sh
```

For access from the same machine only:

``` bash
sudo PORT=8000 BIND_ADDRESS=127.0.0.1 ./install.sh
```

`0.0.0.0` listens on all network interfaces. `127.0.0.1` listens only on
loopback and is not directly reachable from other devices.

If you change these values and rerun the installer, it rewrites the
systemd unit and reinstalls the frontend files from the directory
containing the script.

## Manual run (without systemd)

From the project directory, run:

``` bash
python3 -m http.server 8000
```

Then visit:

``` text
http://localhost:8000
```

To make it reachable from other devices on the LAN:

``` bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Do not open `index.html` directly using a `file://` URL. The application
loads `services.json` with `fetch()`, which requires the page to be
served over HTTP or HTTPS.

## Configure your services

Edit `services.json`. It contains a top-level `services` array. Each
entry represents one card.

Example:

``` json
{
  "services": [
    {
      "name": "Home Assistant",
      "description": "Smart home control",
      "url": "http://homeassistant.local:8123",
      "category": "Home",
      "icon": "⌂"
    },
    {
      "name": "Jellyfin",
      "description": "Movies and media",
      "url": "http://jellyfin.local:8096",
      "category": "Media",
      "icon": "▶"
    },
    {
      "name": "Immich",
      "description": "Personal photo library",
      "url": "http://immich.local:2283",
      "category": "Media",
      "icon": "▧"
    }
  ]
}
```

### Service fields

  Field             Required Description
  --------------- ---------- ----------------------------------------------
  `name`                 Yes Display name shown on the card
  `description`           No Short explanation shown below the name
  `url`                  Yes Destination opened when the card is selected
  `category`              No Category used by the category filter
  `icon`                  No Character or symbol displayed on the card

Use a complete URL, including the protocol (`http://` or `https://`).
Include a port when the service uses a non-default port.

### Adding a service

Add another object to the `services` array. Separate objects with
commas:

``` json
{
  "name": "Proxmox",
  "description": "Virtualization management",
  "url": "https://proxmox.local:8006",
  "category": "Infrastructure",
  "icon": "▦"
}
```

### Categories

Categories are generated from the values in the data file. You do not
need to edit `index.html` or `app.js` to add a category. Use consistent
spelling and capitalization; `Media` and `media` are treated as
different category labels.

### URL and local DNS considerations

GRIDLINE does not configure DNS or make local hostnames resolve. Names
such as `homeassistant.local` must already resolve on the devices that
will use the page. You can use fixed IP addresses instead:

``` json
{
  "name": "Router",
  "description": "Network administration",
  "url": "http://192.168.1.1",
  "category": "Infrastructure",
  "icon": "⌁"
}
```

## systemd service management

After installation, manage GRIDLINE with `systemctl`.

Check status:

``` bash
sudo systemctl status gridline
```

Start:

``` bash
sudo systemctl start gridline
```

Stop:

``` bash
sudo systemctl stop gridline
```

Restart:

``` bash
sudo systemctl restart gridline
```

Disable automatic startup:

``` bash
sudo systemctl disable gridline
```

Follow logs:

``` bash
sudo journalctl -u gridline -f
```

View recent logs:

``` bash
sudo journalctl -u gridline -n 100 --no-pager
```

The service is configured to restart if the HTTP server process exits
with a failure.

## Security notes

-   The default bind address is `0.0.0.0`, which makes the page
    reachable on every network interface where firewall rules permit it.
-   The Python built-in HTTP server does not provide user authentication
    or HTTPS.
-   Anyone who can reach the page can see the service names,
    descriptions, and URLs listed in `services.json`.
-   The directory does not proxy traffic to the listed applications.
    Selecting a card sends the browser directly to that service.
-   Do not expose this server directly to the public internet.
-   For access beyond a trusted LAN, use a properly configured reverse
    proxy with HTTPS and appropriate access controls. Restrict network
    access with firewall rules.

## Uninstallation

Run the following commands on the Linux host:

``` bash
sudo systemctl disable --now gridline
sudo rm -f /etc/systemd/system/gridline.service
sudo systemctl daemon-reload
sudo systemctl reset-failed
sudo rm -rf /opt/gridline
```

This removes the systemd service and installed application files. It
does not remove the Linux user entered during installation, Python, or
any of the services linked from GRIDLINE.

## Technology

-   HTML
-   CSS
-   Vanilla JavaScript
-   JSON
-   Python 3 standard-library HTTP server
-   systemd (for automatic startup on Linux)


## Contributing

Contributions can include bug fixes, accessibility improvements,
responsive layout refinements, documentation updates, or enhancements to
service configuration.

For changes to the service directory, keep service entries in
`services.json` rather than hardcoding them into the HTML or JavaScript.
