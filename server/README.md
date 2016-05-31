Node.js Starter Kit
==================

Backend Starter Kit written in node.js with the following features:

* ES6/ES7 ready: async/await, classes, arrow function, template strings etc ...
* REST API
* Authentication
* Authorization
* Scalable by using a micro services based architecture
* Relational database.
* Logging with timestamp and filename.

# Installation

To install all the dependencies:

    # npm install


## Docker containers

To install the docker containers for the various services such as RabbitMq and Postgres on the local machine, the [DevLab](https://github.com/TechnologyAdvice/DevLab) project is being used to containerize the development workflow, see its configuration file: [devlab.yml](server/devlab.yml)


    # cd server
    # npm run devlabinstall

To check that the containers are running:

```
# docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                                         NAMES
ccd9f559fabd        rabbitmq:latest     "/docker-entrypoint.s"   36 minutes ago      Up 36 minutes       4369/tcp, 25672/tcp, 0.0.0.0:5672->5672/tcp   devlab_rabbitmq_frederic_1446641005596
```

## Start

Before running the backend, check and modify the configuration located at [server/config/default.json](server/config/default.json).
Don't forget to correctly set the *rabbitmq* server location.

To start the backend:

    # cd server
    # npm start

## Test & Code Coverage
To test the backend:

    # npm test

It will not only test the code, but also checks the source code with eslint and generates a code coverage report located at `coverage/lcov-report/index.html`

# Development

[sequelize-cli](https://github.com/sequelize/cli) helps to manage the database migration and rollback.

## Creating a new data model

By using the *model:create* command, a new sequelize model is created alongside its migration script for database update and rollback

    $ ./node_modules/.bin/sequelize model:create --name User --attributes "name:text, password:text"

    $ ./node_modules/.bin/sequelize model:create --name UserPending --attributes "username:string(64), email:string(64), password:string, code:string(16)"

    $ ./node_modules/.bin/sequelize model:create --name PasswordReset --attributes "user_id:integer, token:string(32)"

2 files will be generated:
  * the javascript sequelize model in the *models* directory
  * the sql migration script in the *migrations* directory

Eventually change the sql table name to *underscore_case*

## Database migration

> Database migration are **not** necessary for development environment but only for system already in production.

Run the following command to migrate the database:

    $ ./node_modules/.bin/sequelize db:migrate

### Database rollback
When the new database update breaks in production, it's very handy to rollback as quick as possible:

    $ ./node_modules/.bin/sequelize db:migrate:undo
