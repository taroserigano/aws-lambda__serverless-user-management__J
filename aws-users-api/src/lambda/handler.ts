// Import AWS Lambda types for HTTP API Gateway events and responses
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

// Import low-level DynamoDB client
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// Import DynamoDB Document Client for simplified data operations (handles marshalling/unmarshalling)
import {
  DynamoDBDocumentClient, // Wrapper around DynamoDB client with automatic data type conversion
  PutCommand,             // Command to insert/update items in DynamoDB
  GetCommand,             // Command to retrieve a single item by primary key
  UpdateCommand,          // Command to update specific attributes of an item
  DeleteCommand,          // Command to remove an item from the table
  ScanCommand,            // Command to read all items in a table (expensive operation)
  BatchWriteCommand,      // Command to write/delete multiple items in a single request (max 25)
} from "@aws-sdk/lib-dynamodb";

// Import UUID v4 generator for creating unique user IDs
import { v4 as uuidv4 } from "uuid";

// Import Faker.js library for generating realistic fake user data
import { faker } from "@faker-js/faker";

// Initialize the base DynamoDB client with default configuration (uses AWS SDK environment variables)
const client = new DynamoDBClient({});

// Wrap the client with Document Client for automatic data marshalling
// This converts JavaScript objects to DynamoDB format and vice versa
const dynamoDB = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables (set by CDK during deployment)
const TABLE_NAME = process.env.TABLE_NAME || "";

/**
 * Main Lambda handler function - Entry point for all API Gateway requests
 * This function acts as a router, directing requests to appropriate handler functions
 * based on HTTP method and path.
 * 
 * @param event - API Gateway HTTP API v2 event containing request details
 * @returns Promise<APIGatewayProxyResultV2> - HTTP response with status code and body
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  // Extract HTTP method (GET, POST, PUT, DELETE) from the request context
  const method = event.requestContext.http.method;
  
  // Extract the request path (e.g., "/users", "/users/123")
  const path = event.requestContext.http.path;

  try {
    // Route: /users - Handle list all users (GET) and create user (POST)
    if (path === "/users") {
      switch (method) {
        case "GET":
          // Return all users from the database
          return getAllUsers(event);
        case "POST":
          // Create a new user with provided data
          return createUser(event);
        default:
          // Return 400 Bad Request for unsupported HTTP methods (e.g., PATCH)
          return {
            statusCode: 400,
            body: JSON.stringify({ message: "Unsupported method" }),
          };
      }
    }

    // Route: /users/bulk - Bulk create multiple random users (POST only)
    if (path === "/users/bulk" && method === "POST")
      return bulkCreateUsers(event);
    
    // Route: /users/search - Search users by name or email (GET only)
    if (path === "/users/search" && method === "GET") 
      return searchUsers(event);
    
    // Route: /users/stats - Get user statistics (GET only)
    if (path === "/users/stats" && method === "GET") 
      return getUserStats(event);
    
    // Route: /users/export - Export all users as JSON (GET only)
    if (path === "/users/export" && method === "GET") 
      return exportUsers(event);

    // Route: /users/{id} - Handle single user operations by ID
    if (path.startsWith("/users/")) {
      // Extract user ID from the path (e.g., "/users/123" -> "123")
      const userId = path.split("/users/")[1];
      
      // Validate that user ID exists
      if (!userId)
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "User ID required" }),
        };

      // Route based on HTTP method for specific user operations
      switch (method) {
        case "GET":
          // Retrieve a specific user by ID
          return getUser(userId);
        case "PUT":
          // Update an existing user's information
          return updateUser(event, userId);
        case "DELETE":
          // Remove a user from the database
          return deleteUser(userId);
        default:
          // Return 400 for unsupported methods on user-specific routes
          return {
            statusCode: 400,
            body: JSON.stringify({ message: "Unsupported method" }),
          };
      }
    }

    // If no route matches, return 404 Not Found
    return { statusCode: 404, body: JSON.stringify({ message: "Not Found" }) };
  } catch (error) {
    // Log any errors for debugging in CloudWatch Logs
    console.error("Error:", error);
    
    // Return 500 Internal Server Error for any uncaught exceptions
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};

/**
 * Get all users from the database
 * Performs a full table scan to retrieve all user records.
 * Note: Scan operations are expensive and should be avoided for large tables.
 * Consider using Query with indexes or pagination for production use.
 * 
 * @param event - API Gateway event (unused but required for consistency)
 * @returns Promise with status 200 and array of all users
 */
async function getAllUsers(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  // Scan the entire DynamoDB table (reads all items)
  const result = await dynamoDB.send(
    new ScanCommand({ TableName: TABLE_NAME })
  );
  
  // Return all items (or empty array if no items exist)
  return { statusCode: 200, body: JSON.stringify(result.Items || []) };
}

/**
 * Create a new user with provided name and email
 * Generates a unique UUID for the user ID and adds creation timestamp.
 * 
 * @param event - API Gateway event containing user data in request body
 * @returns Promise with status 201 and the created user object
 */
async function createUser(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  // Parse the JSON body to extract name and email fields
  const { name, email } = JSON.parse(event.body!);
  
  // Create a new user object with auto-generated fields
  const user = {
    id: uuidv4(),                      // Generate unique identifier (UUID v4)
    name,                              // User's full name
    email,                             // User's email address
    createdAt: new Date().toISOString(), // ISO 8601 timestamp of creation
  };
  
  // Insert the user into DynamoDB table
  await dynamoDB.send(new PutCommand({ TableName: TABLE_NAME, Item: user }));
  
  // Return 201 Created with the new user object
  return { statusCode: 201, body: JSON.stringify(user) };
}

/**
 * Bulk create multiple random users using Faker.js
 * Generates fake user data and writes to DynamoDB in batches.
 * DynamoDB batch write has a limit of 25 items per batch, so we split large requests.
 * 
 * @param event - API Gateway event with body containing { count: number }
 * @returns Promise with status 201 and array of created users
 */
async function bulkCreateUsers(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  // Parse request body and extract count (default to 10 if not provided)
  const { count = 10 } = event.body ? JSON.parse(event.body) : {};
  
  // Enforce minimum of 1 and maximum of 100 users per request
  const numberOfUsers = Math.min(Math.max(1, count), 100);
  
  // Array to store all generated user objects
  const users = [];
  
  // Generate fake users with realistic data using Faker.js
  for (let i = 0; i < numberOfUsers; i++) {
    users.push({
      id: uuidv4(),                        // Unique identifier
      name: faker.person.fullName(),       // Random full name (e.g., "John Doe")
      email: faker.internet.email(),       // Random email (e.g., "john.doe@example.com")
      createdAt: new Date().toISOString(), // Current timestamp in ISO format
    });
  }
  
  // Split users into batches of 25 (DynamoDB BatchWriteCommand limit)
  const batches = [];
  for (let i = 0; i < users.length; i += 25)
    batches.push(users.slice(i, i + 25));
  
  // Process each batch sequentially
  // Note: For better performance, consider Promise.all() for parallel execution
  for (const batch of batches) {
    await dynamoDB.send(
      new BatchWriteCommand({
        RequestItems: {
          // Map each user to a PutRequest format required by BatchWrite
          [TABLE_NAME]: batch.map((user) => ({ PutRequest: { Item: user } })),
        },
      })
    );
  }
  
  // Return success response with count and all created users
  return {
    statusCode: 201,
    body: JSON.stringify({ message: `Created ${users.length} users`, users }),
  };
}

/**
 * Search users by name or email using case-insensitive partial matching
 * Performs a full table scan and filters results in memory.
 * Note: For production, consider using DynamoDB Search with indexes for better performance.
 * 
 * @param event - API Gateway event with query parameter 'q' for search term
 * @returns Promise with status 200 and matching users array
 */
async function searchUsers(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  // Extract search query from URL parameters (e.g., /users/search?q=john)
  // Convert to lowercase for case-insensitive matching
  const query = (event.queryStringParameters?.q || "").toLowerCase();
  
  // Scan the entire table to get all users
  const result = await dynamoDB.send(
    new ScanCommand({ TableName: TABLE_NAME })
  );
  
  // Get all items from scan result
  let users = result.Items || [];
  
  // If a search query exists, filter users by name or email
  if (query) {
    users = users.filter(
      (u) =>
        // Check if name contains the query string (case-insensitive)
        (u.name && u.name.toLowerCase().includes(query)) ||
        // OR if email contains the query string (case-insensitive)
        (u.email && u.email.toLowerCase().includes(query))
    );
  }
  
  // Return filtered results with count
  return {
    statusCode: 200,
    body: JSON.stringify({ results: users, count: users.length }),
  };
}

/**
 * Get user statistics including total count, today's count, and recent users
 * Calculates metrics from the entire user database.
 * 
 * @param event - API Gateway event (unused but required for consistency)
 * @returns Promise with status 200 and statistics object
 */
async function getUserStats(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  // Retrieve all users from the database
  const result = await dynamoDB.send(
    new ScanCommand({ TableName: TABLE_NAME })
  );
  
  // Extract items array (empty array if no users exist)
  const users = result.Items || [];
  
  // Get current date/time for today's count calculation
  const now = new Date();
  
  // Calculate start of today (midnight) in ISO format for filtering
  // This creates a date like "2025-10-04T00:00:00.000Z"
  const today = new Date(
    now.getFullYear(),    // Current year
    now.getMonth(),       // Current month (0-11)
    now.getDate()         // Current day of month
  ).toISOString();

  // Sort users by creation date in descending order (newest first)
  // Uses string comparison on ISO timestamps which works correctly for dates
  const sortedUsers = users.sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );

  // Compile statistics object
  const stats = {
    totalUsers: users.length,  // Total number of users in database
    
    // Count users created today (compare ISO timestamps)
    usersCreatedToday: users.filter((u) => u.createdAt >= today).length,
    
    // Get 5 most recently created users for display
    recentUsers: sortedUsers.slice(0, 5),
    
    // Timestamp when these stats were generated
    lastUpdated: new Date().toISOString(),
  };
  
  // Return statistics as JSON
  return { statusCode: 200, body: JSON.stringify(stats) };
}

/**
 * Export all users as a formatted JSON file
 * Returns users with proper HTTP headers to trigger browser download.
 * JSON is pretty-printed with 2-space indentation for readability.
 * 
 * @param event - API Gateway event (unused but required for consistency)
 * @returns Promise with status 200, download headers, and formatted JSON
 */
async function exportUsers(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  // Retrieve all users from database
  const result = await dynamoDB.send(
    new ScanCommand({ TableName: TABLE_NAME })
  );
  
  return {
    statusCode: 200,
    headers: {
      // Set MIME type for JSON
      "Content-Type": "application/json",
      
      // Trigger browser download with suggested filename
      "Content-Disposition": 'attachment; filename="users.json"',
    },
    // Format JSON with 2-space indentation for readability
    // Parameters: (data, replacer, space)
    body: JSON.stringify(result.Items || [], null, 2),
  };
}

/**
 * Get a single user by ID
 * Uses DynamoDB GetItem operation for efficient single-item retrieval.
 * 
 * @param userId - The unique identifier of the user to retrieve
 * @returns Promise with status 200 and user object, or 404 if not found
 */
async function getUser(userId: string): Promise<APIGatewayProxyResultV2> {
  // Retrieve user by primary key (id)
  const result = await dynamoDB.send(
    new GetCommand({ 
      TableName: TABLE_NAME, 
      Key: { id: userId }  // Primary key specification
    })
  );
  
  // Check if user exists in database
  if (!result.Item)
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "User not found" }),
    };
  
  // Return the user object
  return { statusCode: 200, body: JSON.stringify(result.Item) };
}

/**
 * Update an existing user's name and/or email
 * Uses DynamoDB UpdateCommand to modify specific attributes without replacing the entire item.
 * Expression Attribute Names are used to handle reserved words in DynamoDB.
 * 
 * @param event - API Gateway event containing updated user data in body
 * @param userId - The ID of the user to update
 * @returns Promise with status 200 and the updated user object
 */
async function updateUser(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  // Parse request body to get updated fields
  const { name, email } = JSON.parse(event.body!);
  
  // Execute update command with expression syntax
  const result = await dynamoDB.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      
      // Specify which item to update using primary key
      Key: { id: userId },
      
      // Define what to update using SET expression
      // #name and #email are placeholders for attribute names
      UpdateExpression: "SET #name = :name, #email = :email",
      
      // Map placeholders to actual attribute names
      // This is necessary because 'name' is a reserved word in DynamoDB
      ExpressionAttributeNames: { 
        "#name": "name",    // Map #name -> name
        "#email": "email"   // Map #email -> email
      },
      
      // Provide the actual values to set
      ExpressionAttributeValues: {
        ":name": name || null,    // Set name or null if not provided
        ":email": email || null,  // Set email or null if not provided
      },
      
      // Return all attributes of the item after the update
      ReturnValues: "ALL_NEW",
    })
  );
  
  // Return the updated user object
  return { statusCode: 200, body: JSON.stringify(result.Attributes) };
}

/**
 * Delete a user from the database
 * Permanently removes the user record from DynamoDB.
 * 
 * @param userId - The ID of the user to delete
 * @returns Promise with status 200 and success message
 */
async function deleteUser(userId: string): Promise<APIGatewayProxyResultV2> {
  // Execute delete command using primary key
  await dynamoDB.send(
    new DeleteCommand({ 
      TableName: TABLE_NAME, 
      Key: { id: userId }  // Specify item to delete by primary key
    })
  );
  
  // Return success message with deleted user ID
  return {
    statusCode: 200,
    body: JSON.stringify({ message: `user deleted : ${userId}` }),
  };
}
