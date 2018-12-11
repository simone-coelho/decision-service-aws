###############################################################################
# Deploy with docker
###############################################################################
SWARM_APP = fullstack
DECISION_SERVICE = $(SWARM_APP)_decision
DECISION_CONTAINER = decision_service
DECISION_DIR = decision_service
LOADTEST_SERVICE = $(SWARM_APP)_loadtest
LOADTEST_CONTAINER = loadtest_service
LOADTEST_DIR = loadtest_service
DATAFILE_SERVICE = $(SWARM_APP)_datafile
DATAFILE_CONTAINER = datafile_service
DATAFILE_DIR = datafile_service


### Docker Config


SSH_KEY_PATH = aws/fullstack-service-keypair.pem
TUNNEL_PORT = localhost:2374
MANAGER_PUBLIC_DNS = ec2-54-234-83-58.compute-1.amazonaws.com

# modify this variable to run docker commands remotely via ssh
# Remote execution requires running "tunnel" first
DOCKER = docker -H $(TUNNEL_PORT) # Use this command for remote execution
# DOCKER = docker 	 			  # Use this command for local execution



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
run:
	$(DOCKER) stack deploy -c docker-compose.yml $(SWARM_APP)
	$(DOCKER) service logs --follow $(LOADTEST_SERVICE)

# Stop the services described in docker-compose
stop:
	$(DOCKER) stack rm $(SWARM_APP)

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
	ssh -i $(SSH_KEY_PATH) -NL $(TUNNEL_PORT):/var/run/docker.sock docker@$(MANAGER_PUBLIC_DNS); echo "done"

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
