###############################################################################
# Fullstack Service Makefile
###############################################################################
#
# Cotents
# - Globals
# - Datafile Service
# - Decision Service
# - Loadtest Service
# - Running a docker stack locally
# - Running a docker stack on AWS
#
###############################################################################
# Globals
###############################################################################

DOCKER = docker 	 			  # Use this command for local execution

# DEPLOY_CONFIG determines which docker-compose config file is used to deploy your
# test.  Override it with e.g.:  
# 	make DEPLOY_CONFIG="loadtest_cloudfront_from_local" docker-deploy-stack
DEPLOY_CONFIG = loadtest_fullstack_service_on_local

###############################################################################
# Datafile Service
###############################################################################

### Variables

DATAFILE_SERVICE_NAME = datafile
DATAFILE_CONTAINER = datafile_service
DATAFILE_DIR = datafile_service
DATAFILE_HOST = localhost
DATAFILE_PORT = 2222

### Build, run, and test locally

# Install the Node Decision Service
build-datafile:
	cd $(DATAFILE_DIR); npm install

# Start the Node Decision Service
# https://github.com/optimizely/decision-service
run-datafile:
	cd $(DATAFILE_DIR); npm start

# Test the Node Decision Service
test-datafile:
	@echo "Requesting datafile DjJKKrG8NnRhSLRVvX8VS8:"
	@curl http://$(DATAFILE_HOST):$(DATAFILE_PORT)/datafile/json/DjJKKrG8NnRhSLRVvX8VS8
	@echo ""

### Build, run, and test in a docker container

# Build docker container
docker-build-datafile:
	$(DOCKER) build -t $(DATAFILE_CONTAINER) $(DATAFILE_DIR) 

# Run docker container
docker-run-datafile:
	$(DOCKER) run $(DATAFILE_CONTAINER)

###############################################################################
# Decision Service
###############################################################################

### Variables

DECISION_SERVICE_NAME = decision
DECISION_CONTAINER = decision_service
DECISION_DIR = decision_service
DECISION_HOST = localhost
DECISION_PORT = 9090

### Build, run, and test locally

# Install the Node Decision Service
build-decision:
	cd $(DECISION_DIR); npm install

# Start the Node Decision Service
# https://github.com/optimizely/decision-service
run-decision:
	cd $(DECISION_DIR); npm start

# Test the Node Decision Service
test-decision:
	@echo "activate with user 'a':"
	@curl -d "@loadtest_service/json/activate.json" -X POST http://$(DECISION_HOST):$(DECISION_PORT)/rpc
	@echo ""
	@echo "get_variation with user 'a':"
	@curl -d "@loadtest_service/json/get_variation.json" -X POST http://$(DECISION_HOST):$(DECISION_PORT)/rpc
	@echo ""

### Build, run, and test in a docker container

# Build docker container
docker-build-decision:
	$(DOCKER) build -t $(DECISION_CONTAINER) $(DECISION_DIR) 

# Run docker container
docker-run-decision:
	$(DOCKER) run $(DECISION_CONTAINER)

###############################################################################
# Load Test
###############################################################################

### Variables

LOADTEST_SERVICE_NAME = loadtest
LOADTEST_CONTAINER = loadtest_service
LOADTEST_DIR = loadtest_service

### Build, run, and test locally

# Run a simple Apache Bench load test
run-ab:
	ab -T application/json -p loadtest_service/json/get_variation.json -c 10 -n 5000 http://$(DECISION_HOST):$(DECISION_PORT)/rpc

### Build, run, and test the Vegeta loadtest script in a docker container

# Build docker container
docker-build-loadtest:
	$(DOCKER) build -t $(LOADTEST_CONTAINER) $(LOADTEST_DIR)

# Run docker container
docker-run-loadtest:
	$(DOCKER) run $(LOADTEST_CONTAINER)

###############################################################################
# Running a docker stack locally
###############################################################################

### Running the docker swarm and stack locally

# First, run this command once to initialize a docker swarm
docker-start-swarm:
	$(DOCKER) swarm init

# Then build service docker containers
docker-build-containers: docker-build-loadtest docker-build-datafile docker-build-decision
	@echo "Built service containers"

# Now deploy the stack specified in the $DEPLOY_CONFIG docker compose file
# Example: make DEPLOY_CONFIG="loadtest_cloudfront_from_local" docker-deploy-stack
docker-deploy-stack:
	$(DOCKER) stack deploy -c deploy/$(DEPLOY_CONFIG).yml $(DEPLOY_CONFIG)
	$(DOCKER) service logs --follow $(DEPLOY_CONFIG)_$(LOADTEST_SERVICE_NAME)

# Use this to stop the stack specified in the $DEPLOY_CONFIG docker compose file
# Example: make DEPLOY_CONFIG="loadtest_cloudfront_from_local" docker-stop-stack
docker-stop-stack:
	$(DOCKER) stack rm $(DEPLOY_CONFIG)

# When you're ready, leave the docker swarm (and stop it)
docker-stop-swarm:
	$(DOCKER) swarm leave --force

# If you're running containers individually (rather than in a stack)
# use this command to stop all running containers
docker-stop-containers:
	docker stop $$(docker ps -q)

### Display Service logs

# Follow the datafile service logs (only works for docker containers running locally)
docker-logs-datafile:
	$(DOCKER) service logs --follow --tail 20 $(DEPLOY_CONFIG)_$(DATAFILE_SERVICE_NAME)

# Get the loadtest results
docker-logs-loadtest:
	$(DOCKER) service logs --follow $(DEPLOY_CONFIG)_$(LOADTEST_SERVICE_NAME)

# Follow the decision service logs (only works for docker containers running locally)
docker-logs-decision:
	$(DOCKER) service logs --follow --tail 20 $(DEPLOY_CONFIG)_$(DECISION_SERVICE_NAME)

###############################################################################
# Running a docker stack on AWS
###############################################################################

SSH_KEY_PATH = aws/fullstack-service-keypair.pem
SSH_TUNNEL_PORT = localhost:2374
CLUSTER_MANAGER_PUBLIC_DNS = ec2-100-27-5-15.compute-1.amazonaws.com
AWS_DOCKER = docker -H $(SSH_TUNNEL_PORT) # Use this command for remote execution

# First, initiate Docker SSH Tunnel to the cluster manager
# Note: For some reason I'm unable to run this command directly from the makefile
aws-tunnel:
	@echo "To initiate your SSH tunnel, run the following command:"
	@echo "ssh -i $(SSH_KEY_PATH) -NL $(SSH_TUNNEL_PORT):/var/run/docker.sock docker@$(CLUSTER_MANAGER_PUBLIC_DNS) &"

# Build your containers in the aws cluster
aws-build-containers:
	$(AWS_DOCKER) build -t $(DATAFILE_CONTAINER) $(DATAFILE_DIR)
	$(AWS_DOCKER) build -t $(DECISION_CONTAINER) $(DECISION_DIR)
	$(AWS_DOCKER) build -t $(LOADTEST_CONTAINER) $(LOADTEST_DIR)

# Now deploy the stack specified in the $DEPLOY_CONFIG docker compose file
# Example: make DEPLOY_CONFIG="loadtest_cloudfront_from_local" docker-deploy-stack
aws-deploy-stack:
	$(AWS_DOCKER) stack deploy -c deploy/$(DEPLOY_CONFIG).yml $(DEPLOY_CONFIG)
	@echo "Stack deploy. Visit cloudwatch logs for loadtest results."

# Use this to stop stack specified in the $DEPLOY_CONFIG docker compose file
# Example: make DEPLOY_CONFIG="loadtest_cloudfront_from_local" docker-stop-stack
aws-stop-stack:
	$(AWS_DOCKER) stack rm $(DEPLOY_CONFIG)

# It may be helpful to open an SSH shell on the cluster manager
aws-ssh:
	ssh -i $(SSH_KEY_PATH) docker@$(CLUSTER_MANAGER_PUBLIC_DNS)


