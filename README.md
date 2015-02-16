# jobQuery Server

RESTful API backend for [jobQuery](http://jobqueryclient.azurewebsites.net/)

## Usage
See the [client README](https://github.com/jobquery-enhance/jobquery-client#how-to-run-locally) for full instructions.
1. Install dependencies with `npm install`.
2. Start your local instance of MongoDB (`mongod`).
3. Start the server by typing `node server.js` in the root folder.

## Features

1. User authentication with JSON web tokens
2. User invitations
3. Password reset
4. Public and private routes

## Technology Stack

- Node.js with Express.js
- MongoDB with Mongoose

## Developer Tools
[Morgan](https://github.com/expressjs/morgan) is express middleware which aids in debugging by logging HTML requests into the terminal. JobQuery currently uses the [dev format](https://github.com/expressjs/morgan#dev):

    :method :url :status :response-time ms - :res[content-length]
    POST /login 200 269.680 ms - 293
