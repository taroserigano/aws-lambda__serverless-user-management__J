/**
 * DynamoDB Stack - Database Infrastructure
 *
 * This stack creates and manages the DynamoDB table infrastructure for the Users API.
 * DynamoDB is a fully managed NoSQL database service that provides fast and predictable
 * performance with seamless scalability.
 *
 * Key Features:
 * - Serverless database with automatic scaling
 * - Pay-per-request billing (no capacity planning needed)
 * - High availability and durability
 * - Single-table design with partition key
 *
 * The table is exposed as a public property so other stacks can reference it
 * and grant appropriate IAM permissions.
 */

import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export class DynamoDBStack extends cdk.Stack {
  /**
   * Public reference to the Users table
   * This allows other stacks (like UsersApiStack) to:
   * - Get the table name for Lambda environment variables
   * - Grant read/write permissions to Lambda functions
   * - Create cross-stack references
   */
  public readonly usersTable: dynamodb.Table;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * Create the Users DynamoDB Table
     *
     * Configuration Details:
     * - partitionKey: 'id' (STRING) - Primary key for user records, uses UUID
     * - billingMode: PAY_PER_REQUEST - Charges per API call, no capacity planning
     * - removalPolicy: DESTROY - Table will be deleted when stack is destroyed (dev only!)
     * - tableName: Dynamic name based on stack name for easy identification
     *
     * Schema Design:
     * - id: Unique identifier (UUID v4)
     * - name: User's full name
     * - email: User's email address
     * - createdAt: ISO timestamp of creation
     *
     * Note: DynamoDB is schemaless, so additional attributes can be added
     * without table modifications.
     */
    this.usersTable = new dynamodb.Table(this, "UsersTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // WARNING: Use RETAIN in production!
      tableName: `${this.stackName}-users-table`,
    });
  }
}
