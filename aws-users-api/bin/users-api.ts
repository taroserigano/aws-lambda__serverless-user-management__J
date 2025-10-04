#!/usr/bin/env node
/**
 * AWS CDK Application Entry Point
 *
 * This file serves as the main entry point for the AWS CDK application.
 * It orchestrates the creation and deployment of multiple CloudFormation stacks
 * that work together to provide a complete Users Management API solution.
 *
 * Architecture Overview:
 * 1. DynamoDB Stack - Contains the database table for storing user data
 * 2. Users API Stack - Contains Lambda functions and API Gateway for REST endpoints
 *
 * The stacks have an explicit dependency relationship to ensure proper deployment order.
 */

import * as cdk from "aws-cdk-lib";
import { UsersApiStack } from "../lib/users-api-stack";
import { DynamoDBStack } from "../lib/dynamodb-stack";

// Initialize the CDK App - this is the root construct for all AWS resources
const app = new cdk.App();

/**
 * Create the DynamoDB Stack first
 * This stack contains the users table that will store all user data.
 * Must be created before the API stack since the Lambda functions need
 * to reference this table.
 */
const dynamodbStack = new DynamoDBStack(app, "DynamoDBStack");

/**
 * Create the Users API Stack
 * This stack contains:
 * - Lambda function for handling CRUD operations
 * - HTTP API Gateway for exposing REST endpoints
 * - IAM permissions for Lambda to access DynamoDB
 *
 * The dynamodbStack is passed as a prop to allow the API stack to
 * reference the DynamoDB table and grant appropriate permissions.
 */
const usersApStack = new UsersApiStack(app, "UsersApiStack", { dynamodbStack });

/**
 * Explicitly define stack dependency
 * This ensures CloudFormation deploys the DynamoDB stack completely
 * before starting the API stack deployment, preventing any resource
 * reference errors.
 */
usersApStack.addDependency(dynamodbStack);
