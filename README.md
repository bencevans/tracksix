# Tracksix

> Track your [⛵|🚂|🚙|🚜|🛵|🛷|🚶] with a Raspberry Pi and a GPS.

## Features

* [OwnTracks](https://owntracks.org/) Compatable Config & Reporting Format
* MQTT(S) Reporting
* MQTT over WebSocket Reporting
* Programmatic usage or executable use
* Compatable with a huge array of GPS [devices](http://catb.org/gpsd/hardware.html) through [`GPSd`](http://catb.org/gpsd/)
* Replays reports when an internet connection arrises

## Install

To communicate with your GPS device, `tracksix` utilises [`GPSd`](http://catb.org/gpsd/) (Global Positioning System daemon) which standardises the format from different GPS devices.

On OSX:

    $ brew install gpsd

On Debian/Ubuntu:

    $ sudo apt install gpsd

Ensure you have [Node.js](https://nodejs.org) installed on your device, then install `tracksix`:

    $ npm install --global tracksix

## Usage

    $ tracksix [path to config file]

Tracksix uses the same configuration format as OwnTracks, this can be exported from your OwnTracks mobile app or copy the config.example.json and edit the contents appropriately.

## Programmatic Usage

First follow the above steps for installing GPSd. Then install the tracksix library into your nodejs project:

     $ npm install tracksix

Import the library:

```js
const tracksix = require('tracksix')
```

Load your configuration file:

```js
const path = require('path')
const config = tracksix.readConfigSync(
    path.resolve(__dirname, './config.json')
)
```

Start tracking:

```js
const tracker = tracksix(config)
```

To listen for errors, `tracksix()` returns an EventEmitter which emits `'error'` events.

```js
tracker.on('error', (err) => {
    console.error(err)
})
```

To listen for updates sent to the MQTT server, subscribe to `'location'` events. A location event contains the same elements as specified in the OwnTracks [location object](https://owntracks.org/booklet/tech/json/#_typelocation).

```js
tracker.on('location', (report) => {
    console.log(report)
})
```

## Run as a service

Write the following to `/etc/systemd/system/tracksix.service` and update the path to node `which node` and tracksix `which tracksix`.

```
[Unit]
Description=Tracksix Service
After=network.target

[Service]
Type=simple
# Another Type: forking
User=pi
WorkingDirectory=/home/pi
ExecStart=/home/pi/.nvm/versions/node/v10.13.0/bin/node /home/pi/.nvm/versions/node/v10.13.0/bin/tracksix
Restart=on-failure
# Other restart options: always, on-abort, etc

# The install section is needed to use
# `systemctl enable` to start on boot
# For a user service that you want to enable
# and start automatically, use `default.target`
# For system level services, use `multi-user.target`
[Install]
WantedBy=multi-user.targe
```

Afterwards you need to enable the service:

```
$ sudo systemctl enable tracksix.service
```

Then start the service with:

```
$ sudo systemctl start tracksix
```

You can check the status / logs with:

```
$ systemctl status tracksix.service
```

## Development

To start a mock `GPSd` server use [`gpsd-fake`](https://github.com/loewexy/gpsd-fake#readme): `npm install -g gpsd-fake && gpsd-fake`.

## Licence

MIT &copy; [Ben Evans](https://bencevans.io)
