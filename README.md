# Load testing a node decision service

Use this repo to run [Simone's Nodejs Decision Service](https://github.com/simone-coelho/decision-service) as a set of independently scalable services, collectively known as a "fullstack service".  

# Running the service locally

Start by building each service:

      make build-datafile
      make build-decision

Then run both services, starting with the datafile service:

      make run-datafile
      make run-decision

To verify that things are running correctly, try testing the decision service:

      make test-decision

# Running the service locally in separate docker containers

Start by building each service:

      make docker-build-datafile
      make docker-build-decision

Then run both services, starting with the datafile service:

      make docker-run-datafile
      make docker-run-decision

At this point, both services should be running on their default localhost ports.  To verify that things are running correctly, try testing the decision service:

      make test-decision

# Load testing the service locally in a docker swarm

Start by initializing a Docker swarm:

      make start-swarm

Then build your docker containers:

      make docker-build-containers

Now deploy your stack using the appropriate deploy configuration:

      make DEPLOY_CONFIG="loadtest_fullstack_service_on_local" docker-deploy-stack

Your terminal should display the running output of the load test.

When you're done, remove your stack with this command

      make DEPLOY_CONFIG="loadtest_fullstack_service_on_local" docker-stop-stack

# Load testing the service on AWS in a docker swarm (not working)

Start by opening an ssh connection to the cluster manager:

      make aws-ssh

Once you've successfully opened it, close the ssh connection and open up an SSH tunnel for docker:

      go aws-tunnel

This command will display another command which you'll need to run to open the tunnel.

Now, again on your local machine, enter the following command to build your docker containers remotely:

      make aws-build-containers

Now you can launch your stack on the cluster:

      make DEPLOY_CONFIG="loadtest_fullstack_service_on_local" aws-deploy-stack

You'll need to user cloudwatch to monitor the output of the loadtest service replicas.

When you're done, remove your stack with this command

      make DEPLOY_CONFIG="loadtest_fullstack_service_on_local" aws-stop-stack


# Load testing an externally-hosted decision service from a locally-hosted container

Repeat the steps in "Load testing the service locally in a docker swarm", using 

      make DEPLOY_CONFIG="loadtest_cloudfront_from_local" docker-deploy-stack

# Load testing an externally-hosted decision service from a locally-hosted container
 
This also doesn't work yet.  Repeat the steps in "Load testing the service on AWS in a docker swarm", using 

      make DEPLOY_CONFIG="loadtest_cloudfront_from_aws" docker-deploy-stack