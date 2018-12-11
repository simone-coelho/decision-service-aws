# Goal of this repo

My goal was to split Simone's decision services into multiple services so that it can be run in a distributed environment:
  1. A mostly-stateless decision service
  2. A stateful user profile service
  3. A stateful datafile service
  4. A stateful event dispatching service

# Here's what I've done so far:

- Completely removed the user profile service from the decision service
- Update the decision service config to point to my optimizely project, and remove some redundant project config options
- Added makefile commands for installing, runnning, and testing the decision service
- Dockerize the decision service and update the makefile
- Add a docker image for running load tests
- Add docker-compose.yml to run these containers in the same network
- Package up load tests into a single script with clear output (used a golang script + vegeta)
- updated to the latest version of simone's decision service
- deployed to aws with cloudformation
- [todo] figure out why loadtests are getting network errors
- [todo] update readme and docs
- [todo] scale event dispatcher
- [todo] scale userprofile servicex

# Load test times

      2018-12-09 Loadtest times on 2015 MBP (16GB ram, 3.1 GHz Intel Core i7, 2 cores)
           5000 activate calls, running locally:       2.516ms/call, 397.45rps
           5000 activate calls, in docker:             3.792ms/call, 263.73rps
           5000 get_variation calls, locally:          0.655ms/call, 1526.60rps
           5000 get_variation calls, in docker:        1.060ms/call, 943.44rps