/* Amplify Params - DO NOT EDIT
You can access the following resource attributes as environment variables from your Lambda function
var environment = process.env.ENV
var region = process.env.REGION
var apiPushAPIGraphQLAPIIdOutput = process.env.API_PUSHAPI_GRAPHQLAPIIDOUTPUT
var apiPushAPIGraphQLAPIEndpointOutput = process.env.API_PUSHAPI_GRAPHQLAPIENDPOINTOUTPUT

Amplify Params - DO NOT EDIT */ const {
  Expo
} = require("expo-server-sdk");

// Create a new Expo SDK client
let expo = new Expo();

exports.handler = function(event, context, callback) {
  try {
    let messages = [];

    // prettier-ignore
    for (var key in event.Endpoints) {
    if (event.Endpoints.hasOwnProperty(key)) {
      var endpoint = event.Endpoints[key];

        messages.push({
          to: String(endpoint.User.UserAttributes.expoToken),
          sound: "default",
          body: event.Message.apnsmessage.body,
           data: { "status": "ok" }
        });

    }
  }

    // The Expo push notification service accepts batches of notifications so
    // that you don't need to send 1000 requests to send 1000 notifications. We
    // recommend you batch your notifications to reduce the number of requests
    // and to compress them (notifications with similar content will get
    // compressed).
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];
    (async () => {
      // Send the chunks to the Expo push notification service. There are
      // different strategies you could use. A simple one is to send one chunk at a
      // time, which nicely spreads the load out over time:
      for (let chunk of chunks) {
        try {
          let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          console.log(ticketChunk);
          tickets.push(...ticketChunk);
          // NOTE: If a ticket contains an error code in ticket.details.error, you
          // must handle it appropriately. The error codes are listed in the Expo
          // documentation:
          // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
        } catch (error) {
          console.error(error);
        }
      }
    })();

    // Later, after the Expo push notification service has delivered the
    // notifications to Apple or Google (usually quickly, but allow the the service
    // up to 30 minutes when under load), a "receipt" for each notification is
    // created. The receipts will be available for at least a day; stale receipts
    // are deleted.
    //
    // The ID of each receipt is sent back in the response "ticket" for each
    // notification. In summary, sending a notification produces a ticket, which
    // contains a receipt ID you later use to get the receipt.
    //
    // The receipts may contain error codes to which you must respond. In
    // particular, Apple or Google may block apps that continue to send
    // notifications to devices that have blocked notifications or have uninstalled
    // your app. Expo does not control this policy and sends back the feedback from
    // Apple and Google so you can handle it appropriately.
    let receiptIds = [];
    for (let ticket of tickets) {
      // NOTE: Not all tickets have IDs; for example, tickets for notifications
      // that could not be enqueued will have error information and no receipt ID.
      if (ticket.id) {
        receiptIds.push(ticket.id);
      }
    }

    let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    async () => {
      // Like sending notifications, there are different strategies you could use
      // to retrieve batches of receipts from the Expo service.
      for (let chunk of receiptIdChunks) {
        try {
          let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
          console.log(receipts);

          // The receipts specify whether Apple or Google successfully received the
          // notification and information about an error, if one occurred.
          for (let receipt of receipts) {
            if (receipt.status === "ok") {
              continue;
            } else if (receipt.status === "error") {
              console.error(
                `There was an error sending a notification: ${receipt.message}`
              );
              if (receipt.details && receipt.details.error) {
                // The error codes are listed in the Expo documentation:
                // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
                // You must handle the errors appropriately.
                console.error(`The error code is ${receipt.details.error}`);
              }
            }
          }
        } catch (error) {
          console.error(error);
        }
      }
    };

    callback(null, event.Endpoints);
  } catch (error) {
    callback(error);
  }
};
