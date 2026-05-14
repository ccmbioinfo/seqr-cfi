# seqr local development set up

Instructions for setting up seqr on a local machine for development

## Install dependencies

Before installing, always check first to see if a dependency is already installed.

- [python 3](https://www.python.org/downloads/)

- [gcloud](https://cloud.google.com/sdk/install)

- [postgres](https://www.postgresql.org/download/)
  - Note: if you use homebrew to install postgres, it may not create the correct superuser. 
After installation, run `psql -l` and if there is no user named `postgres`, run the following:
  `$POSTGRES_INSTALL_PATH/bin/createuser -s postgres`

- [clickhouse](https://clickhouse.com/docs/install)
- [redis](https://redis.io/topics/quickstart)

- [node/npm <14](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
  - Note: more recent versions of `node` may not function are not officially supported.
For certain npm installations on mac, you may run into issues running this version of npm in your terminal - 
see [this post](https://stackoverflow.com/a/67254340) for a workaround.

Additionally, you will need to install all the infrastructure components required for the 
[helm deployment](https://github.com/broadinstitute/seqr-helm?tab=readme-ov-file#instructions-for-initial-deployment)


## Install seqr

```bash
git clone https://github.com/broadinstitute/seqr.git
    
cd ./seqr
pip install -r requirements-dev.txt
pip install -r requirements.txt
    
cd ./ui/
npm install
```

### Setup postgres database

Copy the production database to your local database so the data looks comparable. You will want to periodically
re-run this to keep in sync.

```bash
./deploy/kubectl_helpers/set_env.sh
./deploy/kubectl_helpers/restore_local_db.sh seqrdb
./deploy/kubectl_helpers/restore_local_db.sh reference_data_db
```

#### Stand alone seqr instance
If you are developing seqr locally without access to an existing instance
(i.e. you want to add a feature but don't otherwise host your own seqr), run the following

```bash
psql -U postgres -c 'CREATE DATABASE reference_data_db';
psql -U postgres -c 'CREATE DATABASE seqrdb';    
    
./manage.py migrate
./manage.py migrate --database=reference_data
./manage.py check
./manage.py loaddata variant_tag_types
./manage.py loaddata variant_searches
./manage.py update_all_reference_data --use-cached-omim
./manage.py createsuperuser
```

## Run seqr

In order to run seqr, you need to have 2 servers running simultaneously, one for the client-side javascript and onefor the server-side python

### Prerequisites
Before running seqr, make sure the following are currently running/ started:

- postgres (run using docker-compose.dev.yml)

- clickhouse (optional, only needed when actively developing search or saved variant functionality) 
  - Since seqr accesses clickhouse as read-only, it is safe to tunnel to production data during local development. 
  This is the easiest approach if you want representative data.

  Tunneling to production:

  1. Create an alias representing the production machine, in your local ssh config file (~/.ssh/config).
  ```bash
  Host seqr-prod
    HostName <hostname>
    User <user>
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
  ```
  where IdentityFile is the location of your public ssh key.

  2. Source necessary environment variables.
  ```bash
  # Clickhouse configurations (find password from k8s secret in production)
  export CLICKHOUSE_SERVICE_HOSTNAME=localhost
  export CLICKHOUSE_READER_USER=seqr_clickhouse_reader
  export CLICKHOUSE_READER_PASSWORD=

  # Kubernetes credentials (K8S_PROD_HOST_ALIAS is the alias we made in the previous step.)
  export K8S_PROD_CLICKHOUSE_SERVICE_NAME=svc/seqr-clickhouse
  export K8S_PROD_HOST_ALIAS=seqr-prod
  export K8S_PROD_API_PORT=
  ```
  3. Create the ssh tunnel to the production instance.
  ```bash
  ./deploy/kubectl_helpers/set_env.sh
  ```
  No output here is fine, and means the tunnel has been created to the production server.
  We can now connect to clickhouse:
  ```bash
  ./deploy/kubectl_helpers/connect_to.sh clickhouse
  ```

### Run ui asset server
Run asset server for javascript and css
```bash
cd ./ui
npm run start
```
 
### Run python/ django server
```bash
./manage.py runserver
```

### Run unit tests

Unit tests are run automatically when code is PR'd to seqr. To run locally, run
```bash
# Server side tests
./manage.py test -p '*_tests.py' reference_data seqr matchmaker panelapp
  
# Client side tests
cd ./ui
npm run test
```
