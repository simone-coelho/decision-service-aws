# Load testing a node decision service

I've been using this repo to play around with running [Simone's Nodejs Decision Service](https://github.com/simone-coelho/decision-service) in a distributed environment.

# Running a load test in docker

**Note:** I haven't tested this on a clean machine/repo

Start by initializing a Docker swarm:

      make start-swarm

Then build and launch your docker containers:

      make run

Your terminal should display the running output of the load test.

# Load testing an externally-hosted decision service

You can specify the decision service host and port using docker environment variables:

      make build-loadtest
      docker run -e "DECISION_SERVICE_HOST=www.myds.com" -e "DECISION_SERVICE_PORT=80" loadtest_service