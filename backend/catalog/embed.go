package catalog

import _ "embed"

//go:embed actions.json
var ActionsJSON []byte

//go:embed roles.json
var RolesJSON []byte

//go:embed metrics.json
var MetricsJSON []byte
