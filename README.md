# mop.js

> Client library for connecting to Mop decentralised storage

**Warning: This project is in beta state. There might (and most probably will) be changes in the future to its API and working. Also, no guarantees can be made about its stability, efficiency, and security at this stage.**

This project is intended to be used with **mop version <!-- SUPPORTED_MOP_START -->0.9.0<!-- SUPPORTED_MOP_END -->**. Using it with older or newer mop versions is not recommended and may not work.

## Install

### npm

```sh
> npm install @redesblock/mop.js --save
```

### yarn

```sh
> yarn add @redesblock/mop.js
```

Be aware, if you are running Yarn v1 and are attempting to install this repo using GitHub URL, this won't unfortunately
work as it does not correctly handle execution of `prepare` script.

### Use in Node.js

**We require Node.js's version of at least 12.x**

```js
var MopJs = require("@redesblock/mop.js");
```

### Use in a browser with browserify, webpack or any other bundler

```js
var MopJs = require("@redesblock/mop.js");
```

## Usage

```js
import { Mop } from "@redesblock/mop.js"

mop = new Mop("http://localhost:1633")

// Be aware, this creates on-chain transactions that spend BNB and MOP!
const batchId = await mop.createVoucherBatch('100', 17)
const fileHash = await mop.uploadData(batchId, "Mop is awesome!")
const data = await mop.downloadData(fileHash)

console.log(data.text()) // prints 'Mop is awesome!'
```

### Setup

Install project dependencies with

```sh
npm i
```

### Compile code

In order to compile NodeJS code run

`npm run compile:node`

or for Browsers

`npm run compile:browser`

## License

[BSD-3-Clause](./LICENSE)