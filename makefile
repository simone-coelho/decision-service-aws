###############################################################################
# Deploy load test with docker
###############################################################################

# TEST_NAME determines which docker-compose config file is used to deploy your
# test.  Override it with e.g.:  
#
# make TEST_NAME="loadtest_cloudfront_from_local" run
# 
TEST_NAME = loadtest_fullstack_service_on_local # Override this via e.g. 

DECISION_SERVICE_NAME = decision
DECISION_CONTAINER = decision_service
DECISION_DIR = decision_service

LOADTEST_SERVICE_NAME = loadtest_service
LOADTEST_CONTAINER = loadtest_service
LOADTEST_DIR = loadtest_service

DATAFILE_SERVICE_NAME = datafile_service
DATAFILE_CONTAINER = datafile_service
DATAFILE_DIR = datafile_service


### Docker Config


SSH_KEY_PATH = aws/fullstack-service-keypair.pem
TUNNEL_PORT = localhost:2374
MANAGER_PUBLIC_DNS = ec2-18-209-245-199.compute-1.amazonaws.com

# modify this variable to run docker commands remotely via ssh
# Remote execution requires running "tunnel" first
DOCKER_AWS = docker -H $(TUNNEL_PORT) # Use this command for remote execution
DOCKER = docker 	 			  # Use this command for local execution

### Starting and stopping the dockerized load test


# Run this command once to initialize a docker swarm
start-swarm:
	$(DOCKER) swarm init

# Build all containers
build-containers:
	$(DOCKER) build -t $(DATAFILE_CONTAINER) $(DATAFILE_DIR)
	$(DOCKER) build -t $(DECISION_CONTAINER) $(DECISION_DIR) 
	$(DOCKER) build -t $(LOADTEST_CONTAINER) $(LOADTEST_DIR) 

# Deploy the services described in docker-compose
# Example: make TEST_NAME="loadtest_cloudfront_from_local" run
run:
	$(DOCKER) stack deploy -c deploy/$(TEST_NAME).yml $(TEST_NAME)
	$(DOCKER) service logs --follow $(TEST_NAME)_$(LOADTEST_SERVICE_NAME)

# Stop the services described in docker-compose
# Example: make TEST_NAME="loadtest_cloudfront_from_local" stop
stop:
	$(DOCKER) stack rm $(TEST_NAME)

# Leave the docker swarm (and stop it)
stop-swarm:
	$(DOCKER) swarm leave --force


### Logs


# Get the loadtest results
datafile-logs:
	$(DOCKER) service logs --follow $(DATAFILE_SERVICE)

# Get the loadtest results
loadtest-logs:
	$(DOCKER) service logs --follow $(LOADTEST_SERVICE)

# Follow the decision service logs
decision-logs:
	$(DOCKER) service logs --follow --tail 20 $(DECISION_SERVICE)


### Cluster management

# Initiate Docker SSH Tunnel to cluster
tunnel:
	@echo "To initiate your SSH tunnel, run the following command:"
	@echo "ssh -i $(SSH_KEY_PATH) -NL $(TUNNEL_PORT):/var/run/docker.sock docker@$(MANAGER_PUBLIC_DNS) &"

ssh:
	ssh -i $(SSH_KEY_PATH) docker@$(MANAGER_PUBLIC_DNS)


###############################################################################
# Decision Service (local)
###############################################################################

DECISION_PORT = 9090
DECISION_HOST = localhost

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

###############################################################################
# Datafile Service
###############################################################################

DATAFILE_PORT = 2222
DATAFILE_HOST = localhost

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

###############################################################################
# Load Test
###############################################################################

LOADTEST_CONTAINER = loadtest_service
LOADTEST_DIR = loadtest_service
LOADTEST_NETWORK = fullstack_alacart

run-ab:
	ab -T application/json -p loadtest_service/json/get_variation.json -c 10 -n 5000 http://localhost:9090/rpc

build-loadtest:
	$(DOCKER) build -t $(LOADTEST_CONTAINER) $(LOADTEST_DIR)
