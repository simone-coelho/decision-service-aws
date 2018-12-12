// A simple load-testing script for the decision service

package main

import (
  "fmt"
  "io/ioutil"
  "strconv"
  "time"
  "os"
  vegeta "github.com/tsenart/vegeta/lib"
)

const DECISION_SERVER_ENV = "DECISION_SERVER"
const DEBUG_ENV = "DEBUG"
const RATE_ENV = "RATE"
const STARTUP_DELAY_ENV = "STARTUP_DELAY"
const DURATION_ENV = "LOADTEST_DURATION_SEC"
const TEST_NAME_ENV = "TEST_NAME"

const DEFAULT_LOADTEST_DELAY = 60
const DEFAULT_DECISION_SERVER = "localhost:9090"
const DEFAULT_RATE = 100
const DEFAULT_DURATION = 60
const DEFAULT_TEST_NAME = "get_variation"

type GlobalParams struct {
  StartupDelay time.Duration      // Wait this long before starting load tests
  TargetServer string             // The decision service protocol (e.g. http)
  Debug bool
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
  rate := DEFAULT_RATE
  overrideRateStr := os.Getenv(RATE_ENV)
  if len(overrideRateStr) > 0 {
    overrideRateInt, err := strconv.Atoi(overrideRateStr)
    if err != nil {
      fmt.Printf("Ignoring request to set rate to non-integer %s\n", overrideRateStr)
    } else {
      rate = overrideRateInt
    }
  }

  duration := DEFAULT_DURATION
  durationEnvValue := os.Getenv(DURATION_ENV)
  if len(durationEnvValue) > 0 {
    durationInt, err := strconv.Atoi(durationEnvValue)
    if err != nil {
      fmt.Printf("Ignoring request to set rate to non-integer %s\n", durationEnvValue)
    } else {
      duration = durationInt
    }
  }

  testName := DEFAULT_TEST_NAME
  testNameEnvValue := os.Getenv(TEST_NAME_ENV)
  if len(testNameEnvValue) > 0 {
    testName = testNameEnvValue
  }
  b, err := ioutil.ReadFile(fmt.Sprintf("/res/tests/%s.json", testName))
  if err != nil {
    panic(err)
  }
  body := string(b)

  testParams := LoadTestParams{
    Requests: []RequestParams{
                  RequestParams{
                    Method: "POST",
                    Path: "/rpc",
                    Body: body,
                  },
    },
    NumUsers: 50,
    RequestsPerSecond: rate,
    Duration: time.Duration(duration) * time.Second,
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
  globalParams := GlobalParams{
    StartupDelay: DEFAULT_LOADTEST_DELAY * time.Second,
    TargetServer: DEFAULT_DECISION_SERVER,
    Debug: false,
  }

  startupDelayEnvValue := os.Getenv(STARTUP_DELAY_ENV)
  if len(startupDelayEnvValue) > 0 {
    overrideStartupDelay, err := strconv.Atoi(startupDelayEnvValue)
    if err != nil {
      fmt.Printf("Failed to parse STARTUP_DELAY_ENV to int: %s\n", startupDelayEnvValue)
    } else {
      globalParams.StartupDelay = time.Duration(overrideStartupDelay) * time.Second
    }
  }

  targetServerValue := os.Getenv(DECISION_SERVER_ENV)
  if len(targetServerValue) > 0 {
    globalParams.TargetServer = targetServerValue
  }

  debugEnvValue := os.Getenv(DEBUG_ENV)
  if debugEnvValue == "1" {
    globalParams.Debug = true
  }

  return globalParams

}

// Use vegeta to run the load test as specified in the passed parameters
func runLoadTest(testParams LoadTestParams, globalParams GlobalParams) vegeta.Metrics {

  // Specify the rate of requests
  rate := vegeta.Rate{Freq: testParams.RequestsPerSecond, Per: time.Second}

  // Build a 'target' for each distinct user and method
  var targets []vegeta.Target
  for user_id := 0; user_id < testParams.NumUsers; user_id++ {
    for _, requestParams := range testParams.Requests {
      requestBody := fmt.Sprintf(requestParams.Body, user_id)
      if globalParams.Debug {
        os.Stderr.WriteString(fmt.Sprintf("Request: %s\n", requestBody))
      }
      targets = append(targets, vegeta.Target{
        Method: requestParams.Method,
        URL:    fmt.Sprintf("http://%s%s", globalParams.TargetServer, requestParams.Path),
        Body:   []byte(requestBody),
      })
    }
  }

  // Run the load test
  targeter := vegeta.NewStaticTargeter(targets...)
  attacker := vegeta.NewAttacker()

  var metrics vegeta.Metrics
  for res := range attacker.Attack(targeter, rate, testParams.Duration, "Decision service load test") {
    if globalParams.Debug {
      os.Stderr.WriteString(fmt.Sprintf("Response: %s\n", res.Body))
    }

    metrics.Add(res)
  }
  metrics.Close()

  return metrics

}

// Display the test parameters
func displayTestParameters(testParams LoadTestParams, globalParams GlobalParams) {
  fmt.Printf("  Service: http://%s\n", globalParams.TargetServer)
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
