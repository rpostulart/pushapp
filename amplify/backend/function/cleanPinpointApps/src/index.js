/* Amplify Params - DO NOT EDIT
You can access the following resource attributes as environment variables from your Lambda function
var environment = process.env.ENV
var region = process.env.REGION
var analyticsAmplifypushappId = process.env.ANALYTICS_AMPLIFYPUSHAPP_ID
var analyticsAmplifypushappRegion = process.env.ANALYTICS_AMPLIFYPUSHAPP_REGION

Amplify Params - DO NOT EDIT */
const AWS = require("aws-sdk");
AWS.config.region = "eu-west-1"; // fill in your right region

const pinpoint = new AWS.Pinpoint();

exports.handler = async event => {
  var params = {
    PageSize: "101",
    Token: "100"
  };
  pinpoint.getApps(params, function(err, data) {
    if (err) console.log(err, err.stack);
    // an error occurred
    else {
      console.log(data); // successful response
    }
  });
};
