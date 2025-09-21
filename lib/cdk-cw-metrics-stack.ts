import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

// API_NAME is imported from another stack where the API Gateway is defined
// Or you can set it via environment variable for flexibility
const API_NAME = cdk.Fn.importValue('TasksApiName');

// The webhook URL to send SNS messages to
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'Not Configured';
export class CdkCwMetricsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

     // Tags for cost visibility
    const environment = this.node.tryGetContext('environment') || 'dev';
    cdk.Tags.of(this).add('Project', 'CDK CW-Metrics');       // Group by project
    cdk.Tags.of(this).add('Environment', environment);        // Separate dev/staging/prod costs
    cdk.Tags.of(this).add('Owner', 'Administrator');          // Cost responsibility
    cdk.Tags.of(this).add('Application', 'cdk-cw-metrics');   // Application grouping

    // Define the Lambda function
    const snsForwarderFunction = new NodejsFunction(this, 'SnsForwarderFunction', {
      entry: 'services/sns-forwarder.ts', 
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      environment: {
        WEBHOOK_URL: WEBHOOK_URL,
  }
    });

    // SNS Topic
    const cwAlarmTopic = new cdk.aws_sns.Topic(this, 'CWAlarmTopic', {
      displayName: 'CW Alarm Topic',
      topicName: 'CW-AlarmTopic',
    });

    // Grant the Lambda function permissions to publish to the SNS topic
    cwAlarmTopic.grantPublish(snsForwarderFunction);

    // Subscribe Lambda to receive SNS messages when alarms trigger
    cwAlarmTopic.addSubscription(new cdk.aws_sns_subscriptions.LambdaSubscription(snsForwarderFunction));

    // Alarm for errors in Api Gateway for 4XX responses
    // Count 5 or more 4XX errors in a single evaluation period (1 minute)
    const api4XXErrorAlarm = new cdk.aws_cloudwatch.Alarm(this, 'api4XXErrorAlarm', {
      metric: new cdk.aws_cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',     // Monitors API Gateway
      metricName: '4XXError',          // Tracks 4XX HTTP errors
      statistic: 'Sum',                // Counts total errors
      period: cdk.Duration.minutes(1), // Every 1 minute
        dimensionsMap: {  ApiName: process.env.API_NAME || API_NAME }
      }),
      threshold: 1, // Alarm if there is 1 or more 4XX errors
      evaluationPeriods: 2, // The alarm triggers triggers after 2 consecutive bad minutes
  })

    // Set the SNS topic and the alarm action
    // Sends notification when alarm triggers (error detected) and when alarm clears (errors stopped)
    api4XXErrorAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(cwAlarmTopic));
    api4XXErrorAlarm.addOkAction(new cdk.aws_cloudwatch_actions.SnsAction(cwAlarmTopic));

}
}