# LinkedIn Clone Project

## Project Structure

```
/
│
├── app.js
├── server.js
│
├── config/
│   ├── db.js
│   ├── jwt.js
│
├── models/
│   ├── User.model.js
│   ├── Company.model.js
│   ├── Post.model.js
│   ├── Comment.model.js
│   ├── Reaction.model.js
│   ├── JobOffer.model.js
│   ├── Connection.model.js
│   ├── Message.model.js
│   ├── Notification.model.js
│
├── routes/
├── services/
├── middlewares/
├── utils/
└── uploads/
    ├── videos/
    └── files/
```

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd <repository-folder>
```

2. Install dependencies:

```bash
npm install express morgan mongoose bcryptjs jsonwebtoken express-validator
npm install swagger-ui-express swagger-jsdoc
gnpm install groq-sdk ejs pdfkit google-auth-library
```

## Environment Variables

This project uses a `.env` file to store sensitive configuration such as database connection strings and API keys.

1. **Create a `.env` file in the project root** by copying the example:

```bash
cp .env.example .env
```

2. **Edit `.env`** with your own values. The file should look like this:

```
MONGO_URI=mongodb+srv://<your_db_user>:<your_password>@cluster0.o7a4yp9.mongodb.net/linkedin?appName=Cluster0
PORT=8081
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=YOUR_GROQ_API_KEY
```

3. **Get your GROQ API key** for LLM calls here: [https://console.groq.com/keys](https://console.groq.com/keys)

   * Click **"Create Key"** and copy it into your `.env` file.

4. **Important:** Never commit your `.env` file. Use `.env.example` in the repo for reference.

### Example `.env.example`

```
# .env.example
MONGO_URI=your_mongo_uri_here
PORT=8081
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key_here
```

## Models Overview

### User

Stores application users with fields like `firstName`, `lastName`, `email`, `password` (hashed), `avatar`, `bio`, `location`, `experiences`, `education`, `connections`, `followers`, `createdAt`, `lastActive`.

### Company

Stores company profiles that can create posts and job offers. Fields include `name`, `email`, `website`, `description`, `logo`, `location`, `createdAt`, `followers`.

### Post

Posts created by users or companies. Fields include `author`, `content`, `media`, `createdAt`, `updatedAt`, `likesCount`, `commentsCount`.

### Comment

Stores comments on posts. Supports polymorphic authors (`User` or `Company`) and threaded replies.

### Reaction

Stores reactions on posts, comments, or messages. Fields include `author`, `type`, `postId`, `commentId`, `messageId`, `createdAt`.

### JobOffer

Job offers posted by companies. Fields include `companyId`, `title`, `description`, `location`, `employmentType`, `salaryRange`, `createdAt`, `expiresAt`, `applicants`.

### Connection

Represents a connection between two users with `requester`, `recipient`, `status`, `createdAt`, `updatedAt`.

### Message

Direct messages between users or user/company. Fields: `from`, `to`, `content`, `attachments`, `read`, `createdAt`.

### Notification

Stores notifications for users with fields `userId`, `type`, `read`, `createdAt`.

## Running the Project

```bash
# Start the server
node server.js

# Or with nodemon for live reload
npx nodemon server.js
```

Your app should now be running on the port defined in your `.env` file (default 8081).
