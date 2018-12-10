package main

import (
  "fmt"
  "time"

  vegeta "github.com/tsenart/vegeta/lib"
)

const DECISION_HOST = "decision"
const DECISION_PORT = "9090"

func main() {

  fmt.Println("Waiting for decision service to start.")
  time.Sleep(15 * time.Second) // todo: be smarter about this

  runDecisionLoadTest("get_variation",  // Full Stack Method
                      100,              // Number of distinct user_ids
                      1000,               // Rate of requests, in requests per second
                      10 * time.Second, // Duration of the load test
  )

}

func runDecisionLoadTest(fullstackMethod string,
                         numUsers, freqInReqPerSec int, 
                         duration time.Duration) {

  rate := vegeta.Rate{Freq: freqInReqPerSec, Per: time.Second}

  // Print the test parameters

  fmt.Printf("Beginning load test on %s:\n", fullstackMethod)
  fmt.Printf("  Number of users: %d\n", numUsers)
  fmt.Printf("  Target rate: %d/s\n", freqInReqPerSec)
  fmt.Printf("  Target duration: %s\n", duration)

  // Build a 'target' for each distinct user

  var targets []vegeta.Target
  for user_id := 0; user_id < numUsers; user_id++ {
    targets = append(targets, vegeta.Target{
      Method: "POST",
      URL:    fmt.Sprintf("http://%s:%s/rpc", DECISION_HOST, DECISION_PORT),
      Body:   []byte(fmt.Sprintf("{ \"%s\": { \"experiment_key\":\"simple_test\", \"user_id\":\"%d\", \"attributes\": {\"test_user\":\"true\"} } }", fullstackMethod, user_id)),
    })
  }

  // Run the load test

  targeter := vegeta.NewStaticTargeter(targets...)
  attacker := vegeta.NewAttacker()

  var metrics vegeta.Metrics
  for res := range attacker.Attack(targeter, rate, duration, "Big Bang!") {
    metrics.Add(res)
  }
  metrics.Close()

  // Print the results

  fmt.Printf("Completed load test on %s:\n", fullstackMethod)
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