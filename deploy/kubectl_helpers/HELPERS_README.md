## Using kubectl helpers

The `kubectl_helpers` directory contains a series of helper bash scripts designed to make accessing kubernetes 
resources a bit easier. 

**In order to use these scripts, kubectl must be configured locally. On production, locate the file ~/.kube/config and copy its contents to the same file path in your local dev environment. If this config file doesn't exist, create it.**

Most of these scripts take in 1 argument:

- `COMPONENT` specifies which of seqr's kubernetes components to access - valid options include `seqr`, `clickhouse`, and `redis`

Before running these scripts, you need to set the kubernetes context to the desired deployment target via the 
`set_env.sh` script.

```bash
./kubectl_helpers/set_env.sh
```

This script only has to be run once at the beginning of your session to set up the ssh tunnel to the production instance. 
After this, all kubectl helpers can be run. For example, to view the logs for redis in production, you would run the following

```bash
./kubectl_helpers/logs.sh redis
```
 