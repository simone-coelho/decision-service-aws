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
DATAFILE_DIR = $(DECISION_DIR)/datafile_manager


### Starting and stopping the dockerized load test


# Run this command once to initialize a docker swarm
start-swarm:
	docker swarm init

# Build all containers
build-containers:
	docker build -t $(DECISION_CONTAINER) $(DECISION_DIR) 
	docker build -t $(LOADTEST_CONTAINER) $(LOADTEST_DIR) 

# Deploy the services described in docker-compose
run: build-containers
	docker stack deploy -c docker-compose.yml $(SWARM_APP)
	docker service logs --follow $(LOADTEST_SERVICE)

# Stop the services described in docker-compose
stop:
	docker stack rm $(SWARM_APP)

# Leave the docker swarm (and stop it)
stop-swarm:
	docker swarm leave --force


### Logs


# Get the loadtest results
loadtest-logs:
	docker service logs --follow $(LOADTEST_SERVICE)

# Follow the decision service logs
decision-logs:
	docker service logs --follow --tail 20 $(DECISION_SERVICE)


###############################################################################
# Decision Service
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
	docker build -t $(LOADTEST_CONTAINER) $(LOADTEST_DIR)
