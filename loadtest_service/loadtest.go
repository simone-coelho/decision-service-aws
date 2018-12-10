// A simple load-testing script for the decision service

package main

import (
  "fmt"
  "time"

  vegeta "github.com/tsenart/vegeta/lib"
)

const DELAY_IN_SECONDS = 5    
const DECISION_PROTOCOL = "http"  
const DECISION_HOST = "decision" 
const DECISION_PORT = "9090"

type GlobalParams struct {
  StartupDelay time.Duration      // Wait this long before starting load tests
  ServiceProtocol string          // The decision service protocol (e.g. http)
  ServiceHost string              // The decision service host 
  ServicePort string              // The decision service port
}

type LoadTestParams struct {
  Requests []RequestParams        // A slice of RequestParam objects to use in the test
  NumUsers int                    // The desired number of unique user_ids to simulate
  RequestsPerSecond int           // The desired number of requests to send per second
  Duration time.Duration          // The desired test duration
}

type RequestParams struct {
  Method string                   // Request method (e.g. POST)
  Path string                     // Request Path
  Body string                     // Request Body (may be a template)
}

func main() {

  // Initialize the global parameters
  globalParams := getGlobalParams()

  // Delay the test so that the decision service containers have time to spin up
  fmt.Printf("Waiting %s for decision service to start.\n", globalParams.StartupDelay)
  time.Sleep(globalParams.StartupDelay) // todo: be smarter about this

  // Initialize the load test parameters
  testParams := LoadTestParams{
    Requests: []RequestParams{
                  RequestParams{
                    Method: "POST",
                    Path: "/rpc",
                    Body: "{ \"get_variation\": { \"experiment_key\":\"simple_test\", \"user_id\":\"%d\", \"attributes\": {\"test_user\":\"true\"} } }",
                  },
    },
    NumUsers: 50,
    RequestsPerSecond: 10,
    Duration: 10 * time.Second,
  }

  // Print the test parameters
  fmt.Printf("Beginning load test:\n")
  displayTestParameters(testParams, globalParams)

  // Run the load test
  metrics := runLoadTest(testParams, globalParams)

  // Print the results
  fmt.Printf("Completed load test:\n")
  displayTestResults(metrics)

}

// Initialize and return a GlobalParams object
func getGlobalParams() GlobalParams {
  return GlobalParams{
    StartupDelay: DELAY_IN_SECONDS * time.Second,
    ServiceProtocol: DECISION_PROTOCOL,
    ServiceHost: DECISION_HOST,
    ServicePort: DECISION_PORT,
  }
}

// Use vegeta to run the load test as specified in the passed parameters
func runLoadTest(testParams LoadTestParams, globalParams GlobalParams) vegeta.Metrics {

  // Specify the rate of requests
  rate := vegeta.Rate{Freq: testParams.RequestsPerSecond, Per: time.Second}

  // Build a 'target' for each distinct user and method
  var targets []vegeta.Target
  for user_id := 0; user_id < testParams.NumUsers; user_id++ {
    for _, requestParams := range testParams.Requests {
      targets = append(targets, vegeta.Target{
        Method: requestParams.Method,
        URL:    fmt.Sprintf("%s://%s:%s%s", globalParams.ServiceProtocol,
                                            globalParams.ServiceHost,
                                            globalParams.ServicePort,
                                            requestParams.Path),
        Body:   []byte(fmt.Sprintf(requestParams.Body, user_id)),
      })
    }
  }

  // Run the load test
  targeter := vegeta.NewStaticTargeter(targets...)
  attacker := vegeta.NewAttacker()

  var metrics vegeta.Metrics
  for res := range attacker.Attack(targeter, rate, testParams.Duration, "Decision service load test") {
    metrics.Add(res)
  }
  metrics.Close()

  return metrics

}

// Display the test parameters
func displayTestParameters(testParams LoadTestParams, globalParams GlobalParams) {
  fmt.Printf("  Service: %s://%s:%s\n", globalParams.ServiceProtocol, globalParams.ServiceHost, globalParams.ServicePort)
  fmt.Printf("  Number of users: %d\n", testParams.NumUsers)
  fmt.Printf("  Target rate: %d/s\n", testParams.RequestsPerSecond)
  fmt.Printf("  Target duration: %s\n", testParams.Duration)
}

// Display the results of the load test
func displayTestResults(metrics vegeta.Metrics) {
  fmt.Printf("  Requests: %d\n", metrics.Requests)
  fmt.Printf("  Duration: %s\n", metrics.Duration)
  fmt.Printf("  Rate: %f\n", metrics.Rate)
  fmt.Printf("  Latency [Mean, 50, 95, 99]: %s %s %s %s\n", 
            metrics.Latencies.Mean,
            metrics.Latencies.P50,
            metrics.Latencies.P95,
            metrics.Latencies.P99)
  fmt.Printf("  Success rate: %f\n", metrics.Success)
  fmt.Printf("  Status Codes:\n")
  for code,count := range metrics.StatusCodes {
    fmt.Printf("    %s: %d\n", code, count)
  }
  fmt.Printf("  Errors:\n")
  for _,err := range metrics.Errors {
    fmt.Printf("    %s\n", err)
  }
}

