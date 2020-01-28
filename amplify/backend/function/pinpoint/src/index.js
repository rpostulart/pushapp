/* Amplify Params - DO NOT EDIT
You can access the following resource attributes as environment variables from your Lambda function
var environment = process.env.ENV
var region = process.env.REGION
var apiPushAPIGraphQLAPIIdOutput = process.env.API_PUSHAPI_GRAPHQLAPIIDOUTPUT
var apiPushAPIGraphQLAPIEndpointOutput = process.env.API_PUSHAPI_GRAPHQLAPIENDPOINTOUTPUT
var analyticsAmplifypushappId = process.env.ANALYTICS_AMPLIFYPUSHAPP_ID
var analyticsAmplifypushappRegion = process.env.ANALYTICS_AMPLIFYPUSHAPP_REGION

Amplify Params - DO NOT EDIT */

const AWS = require("aws-sdk");
AWS.config.region = "eu-west-1"; // fill in your right region ******
const pinpoint = new AWS.Pinpoint();

exports.handler = async (event, context) => {
  try {
    event = event.arguments.input;

    // Create a AWS Pinpoint project
    const appID = await createApp();

    // Enable the SES email address for the project
    enableChannels(appID, event.email);

    // Create the endpoints for the Pinpoint project/app
    await createEndPoints(
      appID,
      event.id,
      event.email,
      event.name,
      event.token
    );

    // Create a segment where you want to filter the endpoint you want to send a message to
    const segmentID = await createSegment(appID);

    // create starter segment and campaign.
    const hookLambda = "pushNotification-dev";
    const result = await createCampaign(
      appID,
      event.message,
      hookLambda,
      segmentID
    );

    return result;
  } catch (error) {
    console.log("Oops! An error happened.");
  }
};

async function createApp() {
  let params = {
    CreateApplicationRequest: {
      /* required */
      Name: "Push App" /* Campaign name, required */
    }
  };

  return new Promise((res, rej) => {
    pinpoint.createApp(params, function(err, data) {
      if (err) {
        rej(err);
        console.log(err, err.stack); // an error occurred
      } else {
        res(data.ApplicationResponse.Id); //console.log(data);// successful response
      }
    });
  });
}

/*
When you create a new pinpoint app you need to activate an emailaddress where the emails can be send from
*/
function enableChannels(appID, email) {
  console.log(appID, email);
  var params = {
    ApplicationId: appID /* required */,
    EmailChannelRequest: {
      /* required */
      FromAddress:
        "ramonpostulart@gmail.com" /* use the emailaddress that you activated in AWS SES, required  */,
      Identity:
        "arn:aws:ses:eu-west-1:083809028538:identity/" + email /* required */,
      Enabled: true
    }
  };
  pinpoint.updateEmailChannel(params, function(err, data) {
    if (err) console.log(err, err.stack);
    else console.log(data); // successful response
  });
}

/*
An endpoint is an object which contains user data which you can use later in a segment to send messages
*/
async function createEndPoints(appID, id, email, name, token) {
  console.log("id", id);
  let params = {
    ApplicationId: appID /* required */,
    EndpointId: id /* required */,
    EndpointRequest: {
      /* required */
      Address: email,
      ChannelType: "EMAIL",
      EndpointStatus: "ACTIVE",
      OptOut: "NONE",
      User: {
        UserAttributes: {
          name: [
            name
            /* more items */
          ],
          expoToken: [
            token
            /* more items */
          ]
        }
      }
    }
  };

  await pinpoint.updateEndpoint(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      // an error occurred
    } else {
      console.log(data); // successful response
    }
  });
}

function createSegment(appID) {
  let params = {
    ApplicationId: appID /* required */,
    WriteSegmentRequest: {
      /* required */
      Dimensions: {
        Demographic: {
          Channel: {
            Values: [
              /* required */
              "EMAIL"
              /* more items */
            ],
            DimensionType: "INCLUSIVE"
          }
        }
      },
      Name: "Segment"
    }
  };

  return new Promise((res, rej) => {
    pinpoint.createSegment(params, function(err, data) {
      if (err) {
        rej(err);
        console.log(err, err.stack); // an error occurred
      } else {
        res(data.SegmentResponse.Id); //console.log(data);// successful response
      }
    });
  });
}
/*
With the endpoint(s) created you can create a segment. A segment is a filter which selects the right endpionts to send messages to
*/
async function createCampaign(appID, message, env, segmentID) {
  const utcDate = new Date(Date.now());

  const params = {
    ApplicationId: appID /* required */,
    WriteCampaignRequest: {
      /* required */
      HoldoutPercent: 0,
      Hook: {
        LambdaFunctionName: env,
        Mode: "FILTER"
      },
      IsPaused: false,
      Limits: {},
      MessageConfiguration: {
        EmailMessage: {
          Title: "Test Email Message",
          HtmlBody:
            `<!DOCTYPE html>\n    <html lang="en">\n    <head>\n    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n</head>\n<body>\n<H2>Hallo {{User.UserAttributes.name}},</H2>\n\n <br />This is a Text Message from PinPoint. \n You have send this text: \n\n` +
            message +
            `\n</body>\n</html>`,
          FromAddress: "info@runyourdinner.nl"
        },
        DefaultMessage: {
          // you push message
          Body: message
        }
      },
      Name: "push campaign",
      Schedule: {
        IsLocalTime: false,
        QuietTime: {},
        StartTime: utcDate.toISOString(),
        Frequency: "ONCE"
      },
      SegmentId: String(segmentID),
      SegmentVersion: 1,
      tags: {}
    }
  };

  return new Promise((res, rej) => {
    pinpoint.createCampaign(params, function(err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred
        const response = {
          statusCode: 500,
          body: JSON.stringify(err)
        };
        rej(response);
      } else {
        console.log(data);
        const response = {
          statusCode: 200,
          body: JSON.stringify(data)
        };

        res(response); // successful response
      }
    });
  });
}
