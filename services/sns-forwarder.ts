import { SNSEvent } from "aws-lambda";

const webhookURL = process.env.WEBHOOK_URL as string;

if (!webhookURL) {
  throw new Error("WEBHOOK_URL environment variable is not set");
}

async function handler(event: SNSEvent) {
  for (const record of event.Records) {
    const snsMessage = record.Sns.Message;

    // Parse CloudWatch alarm JSON message
    const parsedMessage = JSON.parse(snsMessage);

    // Format CloudWatch alarm for Slack
    const slackMessage = {
      text: `🚨 *${parsedMessage.AlarmName}*\n` +
            `State: ${parsedMessage.NewStateValue}\n` +
            `Reason: ${parsedMessage.NewStateReason}\n` +
            `Time: ${parsedMessage.StateChangeTime}`
    };

    try {
      const payload = JSON.stringify(slackMessage);
      const response = await fetch(webhookURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to send message to webhook: HTTP ${response.status} - ${response.statusText}`);
        console.error("Response body:", errorText);
      } else {
        console.log("Successfully sent message to webhook");
      }
    } catch (error) {
      console.error("Error sending message to webhook:", error);
    }
  }
}

export { handler };