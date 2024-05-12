# Natours API

Natours API is a user-friendly application built with Express and MongoDB, designed to facilitate tour selection, comparison, and user authentication. It offers a seamless experience for users to discover and engage with various tours while ensuring robust security measures and efficient error handling.

## Features

- **Tour Selection:** Users can easily browse through available tours, select ones they are interested in, and compare them effortlessly.
- **User Authentication:** Secure authentication system with features for login, signup, and user access tokens.
- **Security Measures:** Implemented security modules such as JWT for user access tokens, Crypto for generating random tokens (e.g., for password reset), MongoSanitize to prevent NoSQL injection attacks, XSS prevention, and HTTP Parameter Pollution (HPP) prevention.
- **MVC Architecture:** Follows the Model-View-Controller architecture pattern, ensuring a clear separation of concerns and maintainability of the codebase.
- **Global Error Handling:** Comprehensive error handling using a global error handler middleware, providing a consistent and user-friendly error response across the application.

## Installation

1. Clone the repository:

   ```bash
        git clone <repository_url>
2. Install dependencies:
   1. ```bash
            cd natours-api
            npm install
3. Set up environment variables:
   - NODE_ENV=development
   - PORT=3000
   - DATABASE=mongodb+srv://<YOUR_DB_USERNAME>:<DATABASE_PASSWORD>@cluster0.qmrgxb8.mongodb.net/natours?retryWrites=true&w=majority&appName=Cluster0
   - DATABASE_LOCAL=mongodb://localhost:27017/natours
   - DATABASE_PASSWORD=YOUR_DB_PASSWORD
   - JWT_SECRET=STRONG_SECRET
   - JWT_EXPIRES_IN=90d
   - JWT_COOKIES_EXPIRES_IN=90d
   - EMAIL_USER=YOUR_EMAIL_USER
   - EMAIL_PASSWORD=YOUR_EMAIL_PASSWORD
   - EMAIL_HOST=sandbox.smtp.mailtrap.io
   - EMAIL_PORT=25
4. Start the server:
   1. npm run start
