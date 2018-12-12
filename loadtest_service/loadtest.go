// A simple load-testing script for the decision service

package main

import (
  "fmt"
  vegeta "github.com/tsenart/vegeta/lib"
  "os"
  "strconv"
  "time"
)

type LoadTestParams struct {
  Debug        bool
  Duration     time.Duration   // The desired test duration
  NumUsers     int             // The desired number of unique user_ids to simulate
  Rate         int             // The desired number of requests to send per second
  Requests     []RequestParams // A slice of RequestParam objects to use in the test
  StartupDelay time.Duration   // Wait this long before starting load tests
  TargetServer string          // The decision service protocol (e.g. http)
  TestName     string          // The name of the test
}

type RequestParams struct {
  Method string // Request method (e.g. POST)
  Path   string // Request Path
  Body   string // Request Body (may be a template)
}

/**************************************************************
 *  Test Parameters
 *
 *  Set these environment variables to configure the test parameters:
 *
 *    DEBUG - If "True" write debug info to stdout
 *    DURATION - duration of the test, in seconds
 *    NUM_USERS - the number of unique user_ids to use in the test
 *    RATE - target number of requests to send each second
 *    STARTUP_DELAY - the number of seconds to wait before starting the test
 *    TARGET_SERVER - the target of the load test, e.g. localhost:9090
 *    TEST_NAME - Test name; this is not currently used
 */

// Maps environment variables to their default values
var ENVIRONMENT_VARIABLE_DEFAULTS = map[string]string{
  "DEBUG":         "true",
  "DURATION":      "10",
  "NUM_USERS":     "100",
  "RATE":          "10",
  "STARTUP_DELAY": "0",
  "TARGET_SERVER": "localhost:9090",
  "TEST_NAME":     "get_variation Test",
}

// Return the requested environment variable value, or the default if unset
func getEnv(variable string) string {
  val := os.Getenv(variable)
  if len(val) == 0 {
    val, _ = ENVIRONMENT_VARIABLE_DEFAULTS[variable]
  }
  return val
}

// Return the requested environment variable value, or the default if unset
func getEnvInt(variable string) int {
  val := os.Getenv(variable)
  if len(val) == 0 {
    val, _ = ENVIRONMENT_VARIABLE_DEFAULTS[variable]
  }
  intVal, err := strconv.Atoi(val)
  if err != nil {
    panic(err)
  }
  return intVal
}

// Initialize and return a LoadTestParams object
func getTestParams() LoadTestParams {

  return LoadTestParams{
    Debug: (getEnv("DEBUG") == "True"),
    Requests: []RequestParams{
      RequestParams{
        Method: "POST",
        Path:   "/rpc",
        Body:   "{ \"get_variation\": { \"datafile_key\":\"DjJKKrG8NnRhSLRVvX8VS8\", \"experiment_key\":\"simple_test\", \"user_id\":\"%d\", \"attributes\": {\"test_user\":\"true\"} } }",
      },
    },
    NumUsers:     getEnvInt("NUM_USERS"),
    Rate:         getEnvInt("RATE"),
    Duration:     time.Duration(getEnvInt("DURATION")) * time.Second,
    StartupDelay: time.Duration(getEnvInt("STARTUP_DELAY")) * time.Second,
    TargetServer: getEnv("TARGET_SERVER"),
    TestName:     getEnv("TEST_NAME"),
  }

}

/**************************************************************
 *  Running the test with Vegeta
 */

// Use vegeta to run the load test as specified in the passed parameters
func runLoadTest(testParams LoadTestParams) vegeta.Metrics {

  // Specify the rate of requests
  rate := vegeta.Rate{Freq: testParams.Rate, Per: time.Second}

  // Build a 'target' for each distinct user and method
  var targets []vegeta.Target
  for user_id := 0; user_id < testParams.NumUsers; user_id++ {
    for _, requestParams := range testParams.Requests {
      requestBody := fmt.Sprintf(requestParams.Body, user_id)
      if testParams.Debug {
        os.Stderr.WriteString(fmt.Sprintf("Request: %s\n", requestBody))
      }
      targets = append(targets, vegeta.Target{
        Method: requestParams.Method,
        URL:    fmt.Sprintf("http://%s%s", testParams.TargetServer, requestParams.Path),
        Body:   []byte(requestBody),
      })
    }
  }

  // Run the load test
  targeter := vegeta.NewStaticTargeter(targets...)
  attacker := vegeta.NewAttacker()

  var metrics vegeta.Metrics
  for res := range attacker.Attack(targeter, rate, testParams.Duration, "Decision service load test") {
    if testParams.Debug {
      os.Stderr.WriteString(fmt.Sprintf("Response: %s\n", res.Body))
    }

    metrics.Add(res)
  }
  metrics.Close()

  return metrics

}

/**************************************************************
 *  Displaying results
 */

// Display the test parameters
func displayTestParameters(testParams LoadTestParams) {
  fmt.Printf("  Service: http://%s\n", testParams.TargetServer)
  fmt.Printf("  Number of users: %d\n", testParams.NumUsers)
  fmt.Printf("  Target rate: %d/s\n", testParams.Rate)
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
  for code, count := range metrics.StatusCodes {
    fmt.Printf("    %s: %d\n", code, count)
  }
  fmt.Printf("  Errors:\n")
  for _, err := range metrics.Errors {
    fmt.Printf("    %s\n", err)
  }
}

/**************************************************************
 *  Main
 */

func main() {
  // Initialize the test parameters
  testParams := getTestParams()

  // Delay the test so that the decision service containers have time to spin up
  fmt.Printf("Waiting %s for decision service to start.\n", testParams.StartupDelay)
  time.Sleep(testParams.StartupDelay) // todo: be smarter about this

  // Print the test parameters
  fmt.Printf("Beginning load test (%s):\n", testParams.TestName)
  displayTestParameters(testParams)

  // Run the load test
  metrics := runLoadTest(testParams)

  // Print the results
  fmt.Printf("Completed load test (%s):\n", testParams.TestName)
  displayTestResults(metrics)
}
