# CloudWatch Metrics & Slack Notifications

AWS CDK project that monitors API Gateway 4XX errors and sends real-time notifications to Slack when issues occur.

## Architecture

```
API Gateway → CloudWatch Alarm → SNS Topic → Lambda → Slack Webhook
```

**Flow:**
1. CloudWatch monitors API Gateway for 4XX errors
2. Alarm triggers after 2 consecutive minutes with ≥1 error
3. SNS sends notification to Lambda function
4. Lambda formats and forwards alert to Slack

## Components

- **CloudWatch Alarm**: Monitors API Gateway 4XX errors
- **SNS Topic**: Notification channel for alarm events
- **Lambda Function**: Processes and forwards notifications to Slack
- **Slack Integration**: Receives formatted alarm notifications

## Prerequisites

- AWS CLI configured
- Node.js 18+
- Slack webhook URL
- API Gateway name (from existing stack)

## Environment Variables

```bash
export WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
export API_NAME="YourApiGatewayName"  # Optional if using stack import
```

## Deployment

```bash
# Install dependencies
npm install

# Set webhook URL
export WEBHOOK_URL="your-slack-webhook-url"

# Deploy stack
npx cdk deploy
```

## Configuration

### Alarm Settings
- **Metric**: API Gateway 4XX errors
- **Period**: 1 minute
- **Threshold**: ≥1 error
- **Evaluation Periods**: 2 consecutive periods
- **Actions**: Sends notifications on ALARM and OK states

### Slack Notifications
Receives formatted messages with:
- 🚨 Alarm name and status
- Current state (ALARM/OK)
- Reason for state change
- Timestamp

## Project Structure

```
├── lib/
│   └── cdk-cw-metrics-stack.ts    # Main CDK stack
├── services/
│   └── sns-forwarder.ts           # Lambda function
├── bin/
│   └── cdk-cw-metrics.ts          # CDK app entry
└── test/
    └── cdk-cw-metrics.test.ts     # Unit tests
```

## Commands

* `npm run build`   - Compile TypeScript to JavaScript
* `npm run watch`   - Watch for changes and compile
* `npm run test`    - Run Jest unit tests
* `npx cdk deploy`  - Deploy stack to AWS
* `npx cdk diff`    - Compare deployed vs current state
* `npx cdk synth`   - Generate CloudFormation template
* `npx cdk destroy` - Remove all resources

## Cost Optimization

Resources are tagged for cost tracking:
- **Project**: CDK CW-Metrics
- **Environment**: dev/staging/prod
- **Owner**: Administrator
- **Application**: cdk-cw-metrics

## Monitoring

View Lambda logs in CloudWatch:
```bash
aws logs tail /aws/lambda/CdkCwMetricsStack-SnsForwarderFunction --follow
```