import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { fromNodeProviderChain } from '@aws-sdk/credential-providers'

// Bedrock signs requests with AWS credentials, not an API key. The default chain reads AWS_PROFILE, SSO and
// credential_process (rkeychain), and refreshes expired credentials. The region comes from AWS_REGION.
const bedrock = createAmazonBedrock({ credentialProvider: fromNodeProviderChain() })

const BEDROCK_PREFIX = 'amazon-bedrock/'

// "amazon-bedrock/<Bedrock model id>" runs on Bedrock; any other "provider/model" id goes to Mastra's model router.
// The prefix matches the models.dev provider key, so evals still find the price.
export const resolveModel = (id: string) => (id.startsWith(BEDROCK_PREFIX) ? bedrock(id.slice(BEDROCK_PREFIX.length)) : id)
