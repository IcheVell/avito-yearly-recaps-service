package service

import "net/http"

type HTTPError struct {
	status int
	code   string
	msg    string
}

func (e HTTPError) Error() string {
	return e.msg
}

func (e HTTPError) StatusCode() int {
	return e.status
}

func (e HTTPError) ErrorCode() string {
	return e.code
}

func notFound(code, msg string) HTTPError {
	return HTTPError{status: http.StatusNotFound, code: code, msg: msg}
}
