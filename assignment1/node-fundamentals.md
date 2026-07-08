# Node.js Fundamentals

## What is Node.js?
Node is a JavaScript runtime (an environment) built on chrome's v8 engine that runs JavaScript on your computer instead of in the browser.

## How does Node.js differ from running JavaScript in the browser?
In Node.js, JavaScript runs on a server and within the computer environment vs. inside of the browser.

## What is the V8 engine, and how does Node use it?
The V8 engine is the tool that translates JavaScript into instructions the computer can read and run. Node uses V8 to run JS outside of the browser, while Nodes adds extra abilities (like file & network access).

## What are some key use cases for Node.js?
- Web API's and servers that respond to requests from browsers or other apps.
- Command-line tools (CLIs) you run in the terminal to automate tasks.
- Real-time apps such as chat or live dashboards that push updates instantly.
- Build tools and scripts that bundle code or process files.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

CommonJS and ES Modules are two ways to import and export code between files.
Browser-side JavaScript and React use ES Module, which utilizes standard JS 'import' and 'export' syntax.
CommonJS utilizes require() to load files and packages. import code, which loads another file/package, then destructuring (optional) to pull out the specific values desired.

**CommonJS (default in Node.js):**
```js
const { register, logoff } = require("../controllers/userController");
```

**ES Modules (supported in modern Node.js):**
```js
import { useState, useEffect } from "react";
``` 