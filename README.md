# AWS Serverless User Management System

A full-stack serverless application built with AWS CDK, featuring a REST API powered by Lambda and DynamoDB, with a modern Next.js frontend.

![AWS Architecture](https://img.shields.io/badge/AWS-CDK-orange) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue) ![Next.js](https://img.shields.io/badge/Next.js-15.3-black) ![License](https://img.shields.io/badge/license-MIT-green)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Next.js Frontend                      │
│              (React, TypeScript, Tailwind CSS)              │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Gateway HTTP API v2                    │
│                                                             │
│  Routes:                                                    │
│  • GET    /users              - List all users             │
│  • POST   /users              - Create user                │
│  • POST   /users/bulk         - Bulk create users          │
│  • GET    /users/search       - Search users               │
│  • GET    /users/stats        - Get statistics             │
│  • GET    /users/export       - Export users JSON          │
│  • GET    /users/{id}         - Get user by ID             │
│  • PUT    /users/{id}         - Update user                │
│  • DELETE /users/{id}         - Delete user                │
└────────────────────────┬────────────────────────────────────┘
                         │ Lambda Integration
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Lambda Function (Node.js 22.x)            │
│                                                             │
│  Functions:                                                 │
│  • getAllUsers()        • searchUsers()                    │
│  • createUser()         • getUserStats()                   │
│  • bulkCreateUsers()    • exportUsers()                    │
│  • getUser()            • updateUser()                     │
│  • deleteUser()                                            │
└────────────────────────┬────────────────────────────────────┘
                         │ DynamoDB SDK v3
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      DynamoDB Table                         │
│                                                             │
│  • Partition Key: id (string)                              │
│  • Attributes: name, email, createdAt                      │
│  • Billing: PAY_PER_REQUEST                                │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Features

### Backend Features
- ✅ **Full CRUD Operations** - Create, Read, Update, Delete users
- ✅ **Bulk User Creation** - Generate 1-100 random users with Faker.js
- ✅ **Smart Search** - Search by name or email with case-insensitive matching
- ✅ **Real-time Statistics** - Total users and daily creation counts
- ✅ **JSON Export** - Export all users with proper formatting
- ✅ **Batch Processing** - Efficient DynamoDB batch writes (25 items/batch)
- ✅ **Error Handling** - Comprehensive error handling and logging

### Frontend Features
- ✅ **Modern UI** - Built with shadcn/ui and Tailwind CSS
- ✅ **Statistics Dashboard** - Real-time user metrics with auto-refresh
- ✅ **Live Search** - Instant search with debouncing
- ✅ **Bulk Actions** - One-click bulk user creation and export
- ✅ **Edit/Delete Users** - Modal-based user management
- ✅ **Responsive Design** - Mobile-friendly layout
- ✅ **Loading States** - Skeleton loaders and spinners

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- AWS CLI configured with valid credentials
- AWS CDK CLI (`npm install -g aws-cdk`)

### Backend Deployment

1. **Navigate to the backend directory**
   ```bash
   cd aws-users-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Deploy to AWS**
   ```bash
   npm run cdk -- deploy --all
   ```

   This will deploy:
   - DynamoDB table
   - Lambda function
   - API Gateway HTTP API

5. **Note the API URL** from the deployment output:
   ```
   Outputs:
   UsersApiStack.HttpApiUrl = https://xxxxxx.execute-api.region.amazonaws.com/
   ```

### Frontend Setup

1. **Navigate to the frontend directory**
   ```bash
   cd nextjs-frontend-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Update the API URL**
   
   Edit `lib/api.ts` and update the `API_URL` constant with your deployed API Gateway URL:
   ```typescript
   const API_URL = "https://your-api-id.execute-api.us-east-2.amazonaws.com";
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
.
├── aws-users-api/                  # Backend CDK application
│   ├── bin/
│   │   └── users-api.ts           # CDK app entry point
│   ├── lib/
│   │   ├── dynamodb-stack.ts      # DynamoDB infrastructure
│   │   └── users-api-stack.ts     # API Gateway + Lambda
│   ├── src/
│   │   └── lambda/
│   │       └── handler.ts         # Lambda function code
│   ├── cdk.json                   # CDK configuration
│   ├── package.json
│   └── tsconfig.json
│
├── nextjs-frontend-app/            # Frontend Next.js application
│   ├── app/
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Home page
│   │   └── globals.css            # Global styles
│   ├── components/
│   │   ├── BulkActions.tsx        # Bulk operations UI
│   │   ├── EditUserModal.tsx      # Edit user dialog
│   │   ├── UserCRUD.tsx           # Main component
│   │   ├── UserForm.tsx           # Create user form
│   │   ├── UserList.tsx           # User list display
│   │   ├── UserSearch.tsx         # Search interface
│   │   └── UserStats.tsx          # Statistics dashboard
│   ├── hooks/
│   │   └── useUsers.ts            # Custom React hooks
│   ├── lib/
│   │   ├── api.ts                 # API client
│   │   ├── types.ts               # TypeScript types
│   │   └── utils.ts               # Utility functions
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── DEPLOYMENT_SUMMARY.md           # Detailed deployment info
└── README.md                       # This file
```

## 🔧 Technology Stack

### Backend
- **AWS CDK** - Infrastructure as Code
- **AWS Lambda** - Serverless compute (Node.js 22.x)
- **API Gateway HTTP API** - RESTful API endpoint
- **DynamoDB** - NoSQL database
- **TypeScript** - Type-safe development
- **Faker.js** - Test data generation
- **UUID** - Unique ID generation
- **esbuild** - Fast Lambda bundling

### Frontend
- **Next.js 15.3** - React framework with Turbopack
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - UI component library
- **Axios** - HTTP client
- **Lucide React** - Icon library

## 📡 API Reference

### Base URL
```
https://your-api-id.execute-api.region.amazonaws.com
```

### Endpoints

#### Get All Users
```http
GET /users
```
**Response:**
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-10-04T10:00:00.000Z"
  }
]
```

#### Create User
```http
POST /users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

#### Bulk Create Users
```http
POST /users/bulk
Content-Type: application/json

{
  "count": 10
}
```
- Min: 1, Max: 100 users
- Generates random users with Faker.js

#### Search Users
```http
GET /users/search?q=john
```
**Query Parameters:**
- `q` - Search query (matches name or email)

#### Get Statistics
```http
GET /users/stats
```
**Response:**
```json
{
  "totalUsers": 42,
  "usersCreatedToday": 15,
  "recentUsers": [...],
  "lastUpdated": "2025-10-04T10:00:00.000Z"
}
```

#### Export Users
```http
GET /users/export
```
Returns formatted JSON file with all users

#### Get User by ID
```http
GET /users/{id}
```

#### Update User
```http
PUT /users/{id}
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

#### Delete User
```http
DELETE /users/{id}
```

## 🧪 Testing

### Test Backend Endpoints

```bash
# Get all users
curl https://your-api-url/users

# Create a user
curl -X POST https://your-api-url/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'

# Bulk create 10 users
curl -X POST https://your-api-url/users/bulk \
  -H "Content-Type: application/json" \
  -d '{"count":10}'

# Search users
curl "https://your-api-url/users/search?q=test"

# Get statistics
curl https://your-api-url/users/stats

# Export users
curl https://your-api-url/users/export > users.json
```

### Run Frontend in Development
```bash
cd nextjs-frontend-app
npm run dev
```

### Build Frontend for Production
```bash
npm run build
npm start
```

## 🌍 Environment Variables

### Backend (Lambda)
Set automatically by CDK:
- `TABLE_NAME` - DynamoDB table name

### Frontend
Edit `lib/api.ts`:
```typescript
const API_URL = "https://your-api-gateway-url.amazonaws.com";
```

## 📦 Deployment

### Deploy Both Stacks
```bash
cd aws-users-api
npm run cdk -- deploy --all
```

### Deploy Individual Stacks
```bash
# Database only
npm run cdk -- deploy DynamoDBStack

# API only
npm run cdk -- deploy UsersApiStack
```

### Destroy Infrastructure
```bash
npm run cdk -- destroy --all
```

⚠️ **Warning:** This will delete the DynamoDB table and all data!

## 🔐 Security Considerations

- **CORS**: Configured to allow all origins (customize for production)
- **API Gateway**: No authentication (add AWS Cognito or API keys for production)
- **DynamoDB**: Table has `DESTROY` removal policy (change to `RETAIN` for production)
- **IAM Roles**: Lambda has minimum required permissions

## 🎨 UI Screenshots

### User Management Dashboard
- Statistics cards with real-time counts
- Bulk actions (create/export)
- Search bar with live results
- User list with edit/delete actions
- Create user form

## 📝 Development

### Add a New API Endpoint

1. **Add function to Lambda handler** (`src/lambda/handler.ts`)
2. **Add route to API Gateway** (`lib/users-api-stack.ts`)
3. **Update frontend API client** (`lib/api.ts`)
4. **Deploy changes**
   ```bash
   npm run build
   npm run cdk -- deploy UsersApiStack
   ```

### Customize DynamoDB Schema

Edit `lib/dynamodb-stack.ts` and add Global Secondary Indexes or change table properties.

## 🐛 Troubleshooting

### Frontend can't connect to API
- Verify `API_URL` in `lib/api.ts` matches your deployed endpoint
- Check CORS configuration in `lib/users-api-stack.ts`
- Verify API Gateway is deployed successfully

### Lambda timeout errors
- Increase timeout in `lib/users-api-stack.ts` (default: 30s)
- Check CloudWatch Logs for detailed error messages

### DynamoDB throttling
- Consider switching from PAY_PER_REQUEST to PROVISIONED mode
- Add auto-scaling configuration

## 📚 Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [API Gateway HTTP API](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

Built with ❤️ using AWS CDK and Next.js

## 🎯 Future Enhancements

- [ ] Add user authentication (AWS Cognito)
- [ ] Implement pagination for large datasets
- [ ] Add sorting and filtering options
- [ ] Add data validation and sanitization
- [ ] Implement rate limiting
- [ ] Add unit and integration tests
- [ ] Add CI/CD pipeline (GitHub Actions)
- [ ] Add email verification
- [ ] Add user roles and permissions
- [ ] Add audit logging
- [ ] Add data export to CSV
- [ ] Add analytics dashboard

---

**Deployed API URL:** https://vszofutd55.execute-api.us-east-2.amazonaws.com/  
**Region:** us-east-2  
**Last Updated:** October 4, 2025
