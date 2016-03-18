'use strict';

const express = require('express');
const tumblr = require('tumblr.js');
const cacheTimer = require('memory-cache');
const helpers = require('./helpers');
const settings = require('./settings.json');

const tumblrClient = tumblr.createClient(settings.tumblr);
const router = new express.Router();
const cacheTimeout = 15 * 60 * 1000;

const api = {
  posts: cb => tumblrClient.posts(settings.tumblr.blog, {reblog_info: true, filter: 'raw'}, cb) // eslint-disable-line camelcase
};

const cache = {
  posts: [{type: 'text', body: '<p>Please reload the page, brother</p>'}]
};

function updateCache(key) {
  if (cacheTimer.get(key)) {
    return;
  }

  cacheTimer.put(key, true, 15 * 1000);
  console.log('Loading fresh data for "%s" from API', key);

  // Execute API method
  api[key]((err, response) => {
    if (err) {
      console.error('API call error on fetching data for key "%s"', key, err);
      return;
    }
    const data = response[key];
    cacheTimer.put(key, true, cacheTimeout);
    cache[key] = data;
    console.log('Fresh data loaded successfully (%d items)', data.length);
  });
}

router.use('/:key.json', (req, res, next) => {
  const key = req.params.key;
  if (api.hasOwnProperty(key)) {
    if (!cacheTimer.get(key)) {
      updateCache(key);
    }
    return res.json(helpers.jsonResponse(null, cache[key]));
  }
  next();
});

module.exports = router;
