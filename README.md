# rokka-render.js [![NPM version][npm-version-image]][npm-url] [![Build Status][build-status-image]][build-status-url] 

Small JavaScript client library for just the rendering functions of [rokka.js](https://github.com/rokka-io/rokka.js) for [rokka](https://rokka.io/).

rokka-render.js runs on node as well as [within the supported browsers](http://browserl.ist/?q=%3E0.1%25%2C+not+op_mini+all).
But it's mainly meant to be used in a browser, where size is important and where you just need the following methods and 
not the whole feature set of rokka.js.

- rokka.render.getUrl
- rokka.render.getUrlFromUrl
- rokka.render.addStackVariables

## Install

```bash
$ npm install rokka-render --save
```

## Usage

```js
import { getUrlFromUrl, getUrl, addStackVariables } from 'rokka-render'

const url = getUrlFromUrl('https://myorg.rokka.io/dynamic/c421f4e8cefe0fd3aab22832f51e85bacda0a47a.png', 'mystack')
```

See [rokka.js#render](https://github.com/rokka-io/rokka.js#render) for details about the methods.

[npm-url]: https://npmjs.com/package/rokka-render
[npm-version-image]: https://img.shields.io/npm/v/rokka-render.svg?style=flat-square

[build-status-url]: https://github.com/rokka-io/rokka-render.js/actions/workflows/main.yml
[build-status-image]: https://github.com/rokka-io/rokka-render.js/actions/workflows/main.yml/badge.svg

