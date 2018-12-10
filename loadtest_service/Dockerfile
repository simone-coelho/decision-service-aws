FROM golang

RUN go get github.com/tsenart/vegeta
RUN go install github.com/tsenart/vegeta

COPY . /go/src/loadtest
RUN go install loadtest

CMD go run loadtest