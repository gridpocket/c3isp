/*
 * File: converter.js
 * File Created: Friday, 11th May 2018 10:30:56 am
 * Author: Rihab Ben Hamouda (rihab.benh@gripdocket.com)
 * -----
 * Last Modified: Friday, 11th May 2018 11:18:30 am
 * Modified By: Rihab Ben Hamouda (rihab.benh@gripdocket.com)
 * -----
 * Copyright 2018 GridPocket, GridPocket
 */

const express = require('express');

const app = express();


app.use((require('./Converter/EmailToJSON')));
app.use((require('./Converter/csvToCef')));

app.listen(8080);
