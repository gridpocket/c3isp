/*
 * File: converter.js
 * File Created: Friday, 11th May 2018 10:30:56 am
 * Author: Rihab Ben Hamouda (rihab.benh@gripdocket.com)
 * -----
 * Last Modified: Thursday, 31st May 2018 11:43:29 am
 * Modified By: Rihab Ben Hamouda (rihab.benh@gripdocket.com)
 * -----
 * Copyright 2018 GridPocket, GridPocket
 */

// const fs = require('fs');
const express = require('express');
const config = require('./config');
// const https = require('https');
// const basicAuth = require('express-basic-auth');

const app = express();
/* app.use(basicAuth({
  users: { user: 'password' },
})); */


app.use((require('./Converter/EmailToJSON')));
app.use((require('./Converter/csvToCef')));
app.use((require('./Converter/removeStix')));
app.use((require('./Converter/ReportToJSON')));
app.use((require('./Converter/firewallToCEF')));
app.use((require('./Converter/antiMalwareToCEF')));
app.use((require('./Converter/dataModel')));
app.use((require('./Converter/detect')));


/*
const privateKey = fs.readFileSync('/etc/letsencrypt/live/isic3isp.iit.cnr.it/privkey.pem', 'utf8');
constcertificate=fs.readFileSync('/etc/letsencrypt/live/isic3isp.iit.cnr.it/fullchain.pem', 'utf8');

const credentials = { key: privateKey, cert: certificate };

const httpsServer = https.createServer(credentials, app);

// console.log(`Documentation on :  ${config.scheme}//${config.hostname}:${config.port}/api-docs/`);
httpsServer. */
app.listen(config.port);
