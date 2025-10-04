/**
 * Users API Stack - REST API Infrastructure
 *
 * This stack creates the complete REST API infrastructure for user management operations.
 * It includes Lambda functions, API Gateway, and all necessary IAM permissions.
 *
 * Architecture Components:
 * 1. Lambda Function - Handles all CRUD operations (Create, Read, Update, Delete)
 * 2. HTTP API Gateway - Provides public REST endpoints with CORS support
 * 3. IAM Permissions - Grants Lambda access to DynamoDB table
 *
 * API Endpoints:
 * - GET    /users       - Get all users
 * - POST   /users       - Create a new user
 * - GET    /users/{id}  - Get a specific user by ID
 * - PUT    /users/{id}  - Update an existing user
 * - DELETE /users/{id}  - Delete a user
 *
 * The stack depends on DynamoDBStack for the database table reference.
 */

import * as cdk from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import path from "path";
import * as apigateway from "aws-cdk-lib/aws-apigatewayv2";
import * as apigateway_integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { DynamoDBStack } from "./dynamodb-stack";

/**
 * Custom props interface for UsersApiStack
 * Extends standard StackProps and adds reference to DynamoDB stack
 */
interface UsersApiStackProps extends cdk.StackProps {
  dynamodbStack: DynamoDBStack; // Reference to the database stack for table access
}

export class UsersApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: UsersApiStackProps) {
    super(scope, id, props);

    /**
     * Lambda Function - User Handler
     *
     * This Lambda function processes all user-related API requests.
     * It uses the AWS Lambda Node.js runtime and is automatically bundled
     * with esbuild for optimized cold start performance.
     *
     * Configuration:
     * - Runtime: Node.js 22.x (latest LTS)
     * - Handler: Main 'handler' function in handler.ts
     * - Entry: TypeScript source file (automatically transpiled)
     * - Environment Variables: TABLE_NAME passed from DynamoDB stack
     *
     * The function handles routing internally based on HTTP method and path.
     */
    const userHandler = new NodejsFunction(this, "UsersHandler", {
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "handler",
      functionName: `${this.stackName}-user-handler`,
      environment: {
        TABLE_NAME: props.dynamodbStack.usersTable.tableName, // Pass table name to Lambda
      },
    });

    /**
     * Grant Lambda permissions to access DynamoDB
     * This creates IAM policies allowing the Lambda function to:
     * - PutItem (create new users)
     * - GetItem (read single user)
     * - UpdateItem (modify user data)
     * - DeleteItem (remove users)
     * - Scan (list all users)
     */
    props.dynamodbStack.usersTable.grantReadWriteData(userHandler);

    /**
     * HTTP API Gateway - REST API Endpoint
     *
     * Creates a fully managed HTTP API that routes requests to the Lambda function.
     * HTTP APIs are optimized for low latency and cost-effective at scale.
     *
     * Features:
     * - Automatic HTTPS endpoint
     * - CORS enabled for frontend integration
     * - Built-in request validation
     * - Automatic API throttling and quotas
     * - CloudWatch logging integration
     */
    const httpApi = new apigateway.HttpApi(this, "UsersApi", {
      apiName: "Users API",
      description: "Users Management API",
      corsPreflight: {
        allowOrigins: ["*"], // Allow all origins (restrict in production!)
        allowMethods: [apigateway.CorsHttpMethod.ANY], // Allow all HTTP methods
        allowHeaders: ["*"], // Allow all headers
      },
    });

    /**
     * Define API Routes
     *
     * This configuration maps HTTP methods and paths to the Lambda function.
     * All routes point to the same Lambda function, which handles routing internally.
     *
     * Route Definitions:
     * - /users (GET)          - List all users
     * - /users (POST)         - Create new user
     * - /users/bulk (POST)    - Bulk create random users
     * - /users/search (GET)   - Search users by name/email
     * - /users/stats (GET)    - Get user statistics
     * - /users/{id} (GET)     - Get user by ID
     * - /users/{id} (PUT)     - Update user by ID
     * - /users/{id} (DELETE)  - Delete user by ID
     */
    const routes = [
      {
        path: "/users",
        method: apigateway.HttpMethod.GET,
        name: "GetAllUsers",
      },
      {
        path: "/users",
        method: apigateway.HttpMethod.POST,
        name: "CreateUser",
      },
      {
        path: "/users/bulk",
        method: apigateway.HttpMethod.POST,
        name: "BulkCreateUsers",
      },
      {
        path: "/users/search",
        method: apigateway.HttpMethod.GET,
        name: "SearchUsers",
      },
      {
        path: "/users/stats",
        method: apigateway.HttpMethod.GET,
        name: "GetUserStats",
      },
      {
        path: "/users/export",
        method: apigateway.HttpMethod.GET,
        name: "ExportUsers",
      },
      {
        path: "/users/{id}",
        method: apigateway.HttpMethod.GET,
        name: "GetUser",
      },
      {
        path: "/users/{id}",
        method: apigateway.HttpMethod.PUT,
        name: "UpdateUser",
      },
      {
        path: "/users/{id}",
        method: apigateway.HttpMethod.DELETE,
        name: "DeleteUser",
      },
    ];

    /**
     * Register all routes with API Gateway
     * Each route creates a Lambda integration that invokes the userHandler function
     * when the corresponding HTTP method and path are matched.
     */
    routes.forEach(({ path, method, name }) => {
      httpApi.addRoutes({
        path,
        methods: [method],
        integration: new apigateway_integrations.HttpLambdaIntegration(
          `${name}Integration`,
          userHandler
        ),
      });
    });

    /**
     * CloudFormation Output - API URL
     *
     * Exports the HTTP API URL so it can be:
     * - Displayed in CDK deployment output
     * - Used by frontend applications
     * - Referenced in other stacks
     * - Accessed programmatically via CloudFormation exports
     */
    new cdk.CfnOutput(this, "HttpApiUrl", {
      value: httpApi.url!,
      description: "HTTP API URL",
    });
  }
}
