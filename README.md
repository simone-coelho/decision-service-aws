# Load testing a node decision service

I've been using this repo to play around with running [Simone's Nodejs Decision Service](https://github.com/simone-coelho/decision-service) in a distributed environment.

# Running a load test in docker

**Note:** I haven't tested this on a clean machine/repo

Start by initializing a Docker swarm:

      make start-swarm

Then build and launch your docker containers:

      make run

Your terminal should display the running output of the load test.

# Running a load test locally

Build and start the decision service:

      make build-decision
      make run-decision

Now you can run the load test:

      make run-loadtest