// app.config.js replaces app.json to allow reading EAS secrets via process.env.
// - Locally: uses ./google-services.json (gitignored, must exist on your machine)
// - EAS build: uses the path provided by the GOOGLE_SERVICES_JSON file secret
const { expo } = require('./app.json');

module.exports = {
  expo: {
    ...expo,
    android: {
      ...expo.android,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    },
  },
};
