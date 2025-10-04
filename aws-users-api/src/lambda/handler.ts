import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";

const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;

  try {
    if (path === "/users") {
      switch (method) {
        case "GET":
          return getAllUsers(event);
        case "POST":
          return createUser(event);
        default:
          return {
            statusCode: 400,
            body: JSON.stringify({ message: "Unsupported method" }),
          };
      }
    }

    if (path === "/users/bulk" && method === "POST")
      return bulkCreateUsers(event);
    if (path === "/users/search" && method === "GET") return searchUsers(event);
    if (path === "/users/stats" && method === "GET") return getUserStats(event);
    if (path === "/users/export" && method === "GET") return exportUsers(event);

    if (path.startsWith("/users/")) {
      const userId = path.split("/users/")[1];
      if (!userId)
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "User ID required" }),
        };

      switch (method) {
        case "GET":
          return getUser(userId);
        case "PUT":
          return updateUser(event, userId);
        case "DELETE":
          return deleteUser(userId);
        default:
          return {
            statusCode: 400,
            body: JSON.stringify({ message: "Unsupported method" }),
          };
      }
    }

    return { statusCode: 404, body: JSON.stringify({ message: "Not Found" }) };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};

async function getAllUsers(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const result = await dynamoDB.send(
    new ScanCommand({ TableName: TABLE_NAME })
  );
  return { statusCode: 200, body: JSON.stringify(result.Items || []) };
}

async function createUser(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const { name, email } = JSON.parse(event.body!);
  const user = {
    id: uuidv4(),
    name,
    email,
    createdAt: new Date().toISOString(),
  };
  await dynamoDB.send(new PutCommand({ TableName: TABLE_NAME, Item: user }));
  return { statusCode: 201, body: JSON.stringify(user) };
}

async function bulkCreateUsers(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const { count = 10 } = event.body ? JSON.parse(event.body) : {};
  const numberOfUsers = Math.min(Math.max(1, count), 100);
  const users = [];
  for (let i = 0; i < numberOfUsers; i++) {
    users.push({
      id: uuidv4(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      createdAt: new Date().toISOString(),
    });
  }
  const batches = [];
  for (let i = 0; i < users.length; i += 25)
    batches.push(users.slice(i, i + 25));
  for (const batch of batches) {
    await dynamoDB.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: batch.map((user) => ({ PutRequest: { Item: user } })),
        },
      })
    );
  }
  return {
    statusCode: 201,
    body: JSON.stringify({ message: `Created ${users.length} users`, users }),
  };
}

async function searchUsers(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const query = (event.queryStringParameters?.q || "").toLowerCase();
  const result = await dynamoDB.send(
    new ScanCommand({ TableName: TABLE_NAME })
  );
  let users = result.Items || [];
  if (query) {
    users = users.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query))
    );
  }
  return {
    statusCode: 200,
    body: JSON.stringify({ results: users, count: users.length }),
  };
}

async function getUserStats(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const result = await dynamoDB.send(
    new ScanCommand({ TableName: TABLE_NAME })
  );
  const users = result.Items || [];
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).toISOString();

  // Sort by createdAt descending to get recent users
  const sortedUsers = users.sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );

  const stats = {
    totalUsers: users.length,
    usersCreatedToday: users.filter((u) => u.createdAt >= today).length,
    recentUsers: sortedUsers.slice(0, 5), // Get 5 most recent users
    lastUpdated: new Date().toISOString(),
  };
  return { statusCode: 200, body: JSON.stringify(stats) };
}

async function exportUsers(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const result = await dynamoDB.send(
    new ScanCommand({ TableName: TABLE_NAME })
  );
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="users.json"',
    },
    body: JSON.stringify(result.Items || [], null, 2),
  };
}

async function getUser(userId: string): Promise<APIGatewayProxyResultV2> {
  const result = await dynamoDB.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { id: userId } })
  );
  if (!result.Item)
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "User not found" }),
    };
  return { statusCode: 200, body: JSON.stringify(result.Item) };
}

async function updateUser(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const { name, email } = JSON.parse(event.body!);
  const result = await dynamoDB.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id: userId },
      UpdateExpression: "SET #name = :name, #email = :email",
      ExpressionAttributeNames: { "#name": "name", "#email": "email" },
      ExpressionAttributeValues: {
        ":name": name || null,
        ":email": email || null,
      },
      ReturnValues: "ALL_NEW",
    })
  );
  return { statusCode: 200, body: JSON.stringify(result.Attributes) };
}

async function deleteUser(userId: string): Promise<APIGatewayProxyResultV2> {
  await dynamoDB.send(
    new DeleteCommand({ TableName: TABLE_NAME, Key: { id: userId } })
  );
  return {
    statusCode: 200,
    body: JSON.stringify({ message: `user deleted : ${userId}` }),
  };
}
