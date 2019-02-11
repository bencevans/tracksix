# Tracksix

> Track your [⛵|🚂|🚙|🚜|🛵|🛷|🚶] with a Raspberry Pi and a GPS.

## Features

* [OwnTracks](https://owntracks.org/) Compatable Config & Reporting Format
* MQTT(S) Reporting
* MQTT over WebSocket Reporting
* Programmatic usage or executable use
* Compatable with huge array of GPS devices through [`GPSd`](http://catb.org/gpsd/)
* Replays reports when an internet connection arrises

## Install

To communicate with your GPS device, `tracksix` utilises [`GPSd`](http://catb.org/gpsd/) (Global Positioning System daemon) which standardises the format from different GPS devices.

On OSX:

    $ brew install gpsd

On Debian/Ubuntu:

    $ sudo apt install gpsd

Then install tracksix:

    $ npm install --global tracksix

## Usage

    $ tracksix [path to config file]

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

## Development

To start a mock `GPSd` server use [`gpsd-fake`](https://github.com/loewexy/gpsd-fake#readme): `npm install -g gpsd-fake && gpsd-fake`.

## Licence

MIT &copy; [Ben Evans](https://bencevans.io)
