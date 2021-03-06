import React from 'react';
import express from 'express';
import { renderToString } from 'react-dom/server';
import { api } from './api'
import cors from "cors";
import socket from "socket.io";
import WebSocketServer from "./utils/WebSocketServer";

import Router from './Router';
import { StaticRouter } from 'react-router-dom';

import { client_routes } from './Router/config'

const assets = require(process.env.RAZZLE_ASSETS_MANIFEST);

const server = express();

let http = require('http').createServer(server);

const io = socket(http, {
  cors: {
    origin: '*',
  }
});

io.on("connection", socket => {
    new WebSocketServer(io, socket)
});


export const renderApp = (req, res) => {
  const context = {};
  const markup = renderToString(
    <StaticRouter location={req.url} context={context}>
      <Router />
    </StaticRouter>
  );

  const html =
    // prettier-ignore
    `<!doctype html>
  <html lang="">
  <head>
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta charSet='utf-8' />
      <title>Welcome to Razzle</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      ${
      assets.client.css
        ? `<link rel="stylesheet" href="${assets.client.css}">`
        : ''
      }
  </head>
  <body>
      <div id="root">${markup}</div>
      <!-- razzle_static_js -->
      <script src="${assets.client.js}" defer crossorigin></script>
  </body>
</html>`;

  return { html, context };
};

server
  .disable('x-powered-by')
  .use(express.static(process.env.RAZZLE_PUBLIC_DIR))
  .use(cors())
  .use('/v1', api)
  .get(client_routes, (req, res) => {
    const { html, context } = renderApp(req, res);

    if (context.url) {
      // Somewhere a `<Redirect>` was rendered
      return res.redirect(301, context.url);
    }

    res.send(html);
  });

export default http;
