#!/usr/bin/env bash
set -Eeuo pipefail

SERVICE_NAME="gridline"
INSTALL_DIR="/opt/gridline"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
PORT="${PORT:-8000}"
BIND_ADDRESS="${BIND_ADDRESS:-0.0.0.0}"

log() { printf '\n[GRIDLINE] %s\n' "$*"; }
die() { printf '[GRIDLINE] ERROR: %s\n' "$*" >&2; exit 1; }

[[ "$EUID" -eq 0 ]] || die "Run with sudo: sudo ./install.sh"

SOURCE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

# Verify all required project files, including the favicon.
for file in index.html styles.css app.js services.json gridline.png; do
    [[ -f "$SOURCE_DIR/$file" ]] || die "Missing $file. Extract the complete project and run this script from its folder."
done

printf 'Enter the Linux username that should run GRIDLINE: '
read -r SERVICE_USER
[[ -n "$SERVICE_USER" ]] || die "Username cannot be empty."
id "$SERVICE_USER" >/dev/null 2>&1 || die "User '$SERVICE_USER' does not exist."
SERVICE_GROUP="$(id -gn "$SERVICE_USER")"

[[ "$PORT" =~ ^[0-9]+$ ]] && (( PORT >= 1 && PORT <= 65535 )) || die "PORT must be between 1 and 65535."

log "Installing files to $INSTALL_DIR"
install -d -o "$SERVICE_USER" -g "$SERVICE_GROUP" -m 0755 "$INSTALL_DIR"

install -o "$SERVICE_USER" -g "$SERVICE_GROUP" -m 0644 \
    "$SOURCE_DIR/index.html" \
    "$SOURCE_DIR/styles.css" \
    "$SOURCE_DIR/app.js" \
    "$SOURCE_DIR/services.json" \
    "$SOURCE_DIR/gridline.png" \
    "$INSTALL_DIR/"

log "Creating systemd service"
cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=GRIDLINE Local Service Directory
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_GROUP
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/python3 -m http.server $PORT --bind $BIND_ADDRESS
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

chmod 0644 "$SERVICE_FILE"

log "Enabling service at boot and starting it now"
systemctl daemon-reload
systemctl enable --now "$SERVICE_NAME.service"

log "Installation complete"
printf 'Service: %s.service\nUser: %s\nDirectory: %s\nAddress: %s:%s\n' \
    "$SERVICE_NAME" "$SERVICE_USER" "$INSTALL_DIR" "$BIND_ADDRESS" "$PORT"

printf '\nStatus: sudo systemctl status %s\nLogs:   sudo journalctl -u %s -f\n' \
    "$SERVICE_NAME.service" "$SERVICE_NAME.service"

printf 'Browse to: http://<server-ip>:%s\n' "$PORT"

if [[ "$BIND_ADDRESS" == "0.0.0.0" ]]; then
    printf '\nNOTICE: No authentication or TLS is configured. This binds to all interfaces; use only on a trusted LAN.\n'
fi