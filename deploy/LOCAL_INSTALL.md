## Prerequisites
- *Hardware:*  At least **16 Gb RAM**, **4 CPUs**, **50 Gb disk space**

- *Software:*
  - [docker](https://docs.docker.com/install/)

    - under Preferences > Resources > Advanced set the memory limit to at least 12 Gb

  - [docker-compose](https://docs.docker.com/compose/install/)

  - [gcloud](https://cloud.google.com/sdk/install)

- OS settings for elasticsearch:
  - **Linux only:** elasticsearch needs [higher-than-default virtual memory settings](https://www.elastic.co/guide/en/elasticsearch/reference/current/vm-max-map-count.html). To adjust this, run
  ```bash
  echo '
     vm.max_map_count=262144
  ' | sudo tee -a /etc/sysctl.conf

  sudo sysctl -w vm.max_map_count=262144
  ```
  This will prevent elasticsearch start up error: `max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]`


## Starting seqr

The steps below describe how to create a new empty seqr instance with a single Admin user account.

```bash
SEQR_DIR=$(pwd)

wget https://raw.githubusercontent.com/ccmbioinfo/seqr-cfi/master/docker-compose.yml
wget https://raw.githubusercontent.com/ccmbioinfo/seqr-cfi/master/deploy/postgres/initdb.sql
mv initdb.sql ./data/postgres_init/initdb.sql

docker compose up -d seqr   # start up the seqr docker image in the background after also starting other components it depends on (postgres, redis, elasticsearch). This may take 10+ minutes.
docker compose logs -f seqr  # (optional) continuously print seqr logs to see when it is done starting up or if there are any errors. Type Ctrl-C to exit from the logs.

docker compose exec seqr python manage.py update_all_reference_data --use-cached-omim  # Intialize reference data
docker compose exec seqr python manage.py createsuperuser  # create a seqr Admin user

open http://localhost     # open the seqr landing page in your browser. Log in to seqr using the email and password from the previous step
```

### Configuring Authentication for seqr

#### Username/password basic auth
This is the default authentication mechanism for seqr, and does not need any special steps for configuration.

#### Google OAuth2
Using Google OAuth2 for authentication requires setting up a Google Cloud project and configuring the seqr instance
with the project's client ID and secret by setting the following environment variables in the docker-compose file:
```yaml
  seqr:
    environment:
      - SOCIAL_AUTH_GOOGLE_OAUTH2_CLIENT_ID=your-client-id
      - SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET=your-client-secret
```
Note that user accounts do NOT need to be associated with this Google Cloud
project in order to have access to seqr. User's emails must explicitly be added to at least one seqr project for them to
gain any access to seqr, and any valid Gmail account can be used.

#### Azure OAuth2
Using Azure OAuth2 for authentication requires setting up an Azure tenant and configuring the seqr instance with the
tenant and it's client ID and secret by setting the following environment variables in the docker-compose file:
```yaml
  seqr:
    environment:
      - SOCIAL_AUTH_AZUREAD_V2_OAUTH2_CLIENT_ID=your-client-id
      - SOCIAL_AUTH_AZUREAD_V2_OAUTH2_SECRET=your-client-secret
      - SOCIAL_AUTH_AZUREAD_V2_OAUTH2_TENANT=your-tenant-id
```
Note that user accounts must be directly associated with the Azure tenant in order to access seqr. Anyone with access
to the tenant will automatically have access to seqr, although they will only be able to view those projects that they
have been added to.

## Updating seqr

Updating your local installation of seqr involves pulling the latest version of the seqr docker container, and then recreating the container.

```bash
# run this from the directory containing your docker-compose.yml file
docker compose pull
docker compose up -d seqr

docker compose logs -f seqr  # (optional) continuously print seqr logs to see when it is done starting up or if there are any errors. Type Ctrl-C to exit from the logs.
```

To update reference data in seqr, such as OMIM, HPO, etc., run the following
```bash
docker compose exec seqr ./manage.py update_all_reference_data --use-cached-omim --skip-gencode
```

Additionally, the [pipeline-runner](https://github.com/broadinstitute/seqr-loading-pipelines/blob/main/docker/bin/download_reference_data.sh) container has a script to download reference data for the specified genome build. To download Ensembl reference data for GRCh37 and GRCh38, run the following:
```bash
docker compose exec pipeline-runner /usr/local/bin/download_reference_data.sh 37
docker compose exec pipeline-runner /usr/local/bin/download_reference_data.sh 38
```
Note: These scripts take a long time to run. It is recommended to run them in the background using `tmux` or `screen`.


## Annotating and loading VCF callsets

### Option #1
#### Annotate on a Google Dataproc cluster, then load in to an on-prem seqr instance

Google Dataproc makes it easy to start a spark cluster which can be used to parallelize annotation across many machines.
The steps below describe how to annotate a callset and then load it into your on-prem elasticsearch instance.

1. authenticate into your google cloud account.
   ```bash
   gcloud auth application-default login
   ```

1. upload your .vcf.gz callset to a google bucket
   ```bash
   GS_BUCKET=gs://your-bucket       # your google bucket
   GS_FILE_PATH=data/GRCh38         # the desired file path. Good to include build version and/ or sample type to directory structure
   FILENAME=your-callset.vcf.gz     # the local file you want to load

   gsutil cp $FILENAME $GS_BUCKET/$GS_FILE_PATH
   ```

1. start a pipeline-runner container which has the necessary tools and environment for starting and submitting jobs to a Dataproc cluster.
   ```bash
   docker compose up -d pipeline-runner            # start the pipeline-runner container
   ```

1. if you haven't already, upload reference data to your own google bucket.
This should be done once per build version, and does not need to be repeated for subsequent loading jobs.
This is expected to take a while
   ```bash
   BUILD_VERSION=38                 # can be 37 or 38

   docker compose exec pipeline-runner copy_reference_data_to_gs.sh $BUILD_VERSION $GS_BUCKET

   ```
   Periodically, you may want to update the reference data in order to get the latest versions of these annotations.
To do this, run the following commands to update the data. All subsequently loaded data will then have the updated
annotations, but you will need to re-load previously loaded projects to get the updated annotations.
   ```bash
   GS_BUCKET=gs://your-bucket       # your google bucket
   BUILD_VERSION=38                 # can be 37 or 38

   # Update clinvar
   gsutil rm -r "${GS_BUCKET}/reference_data/GRCh${BUILD_VERSION}/clinvar.GRCh${BUILD_VERSION}.ht"
   gsutil rsync -r "gs://seqr-reference-data/GRCh${BUILD_VERSION}/clinvar/clinvar.GRCh${BUILD_VERSION}.ht" "${GS_BUCKET}/reference_data/GRCh${BUILD_VERSION}/clinvar.GRCh${BUILD_VERSION}.ht"

   # Update all other reference data
   gsutil rm -r "${GS_BUCKET}/reference_data/GRCh${BUILD_VERSION}/combined_reference_data_grch${BUILD_VERSION}.ht"
   gsutil rsync -r "gs://seqr-reference-data/GRCh${BUILD_VERSION}/all_reference_data/combined_reference_data_grch${BUILD_VERSION}.ht" "${GS_BUCKET}/reference_data/GRCh${BUILD_VERSION}/combined_reference_data_grch${BUILD_VERSION}.ht"
    ```

1. run the loading command in the pipeline-runner container. Adjust the arguments as needed
   ```bash
   BUILD_VERSION=38                 # can be 37 or 38
   SAMPLE_TYPE=WES                  # can be WES or WGS
   INDEX_NAME=your-dataset-name     # the desired index name to output. Will be used later to link the data to the corresponding seqr project

   INPUT_FILE_PATH=/${GS_FILE_PATH}/${FILENAME}

   docker compose exec pipeline-runner load_data_dataproc.sh $BUILD_VERSION $SAMPLE_TYPE $INDEX_NAME $GS_BUCKET $INPUT_FILE_PATH

   ```

### Option #2
#### Annotate and load on-prem

Annotating a callset with VEP and reference data can be very slow - as slow as several variants / sec per CPU, so although it is possible to run the pipeline on a single machine, it is recommended to use multiple machines.

The steps below describe how to annotate a callset and then load it into your on-prem elasticsearch instance.

1. create a directory for your vcf files. docker-compose will mount this directory into the pipeline-runner container.

   ```bash
   mkdir ./data/input_vcfs/

   FILE_PATH=GRCh38                 # the desired file path. Good to include build version and/ or sample type to directory structure
   FILENAME=your-callset.vcf.gz     # the local file you want to load. vcfs should be bgzip'ed

   cp $FILENAME ./data/input_vcfs/$FILE_PATH
   ```

1. start a pipeline-runner container
   ```bash
   docker compose up -d pipeline-runner            # start the pipeline-runner container
   ```

1. authenticate into your google cloud account.
This is required for hail to access buckets hosted on gcloud.
   ```bash
   docker compose exec pipeline-runner  gcloud auth application-default login
   ```

1. if you haven't already, download VEP and other reference data to the docker image's mounted directories.
This should be done once per build version, and does not need to be repeated for subsequent loading jobs.
This is expected to take a while
   ```bash
   BUILD_VERSION=38                 # can be 37 or 38

   docker compose exec pipeline-runner download_reference_data.sh $BUILD_VERSION

   ```
   Periodically, you may want to update the reference data in order to get the latest versions of these annotations.
To do this, run the following commands to update the data. All subsequently loaded data will then have the updated
annotations, but you will need to re-load previously loaded projects to get the updated annotations.
   ```bash
   BUILD_VERSION=38                 # can be 37 or 38

   # Update clinvar
   docker compose exec pipeline-runner rm -rf "/seqr-reference-data/GRCh${BUILD_VERSION}/clinvar.GRCh${BUILD_VERSION}.ht"
   docker compose exec pipeline-runner gsutil rsync -r "gs://seqr-reference-data/GRCh${BUILD_VERSION}/clinvar/clinvar.GRCh${BUILD_VERSION}.ht" "/seqr-reference-data/GRCh${BUILD_VERSION}/clinvar.GRCh${BUILD_VERSION}.ht"

   # Update all other reference data
   docker compose exec pipeline-runner rm -rf "/seqr-reference-data/GRCh${BUILD_VERSION}/combined_reference_data_grch${BUILD_VERSION}.ht"
   docker compose exec pipeline-runner gsutil rsync -r "gs://seqr-reference-data/GRCh${BUILD_VERSION}/all_reference_data/combined_reference_data_grch${BUILD_VERSION}.ht" "/seqr-reference-data/GRCh${BUILD_VERSION}/combined_reference_data_grch${BUILD_VERSION}.ht"
    ```

1. run the loading command in the pipeline-runner container. Adjust the arguments as needed
   ```bash
   BUILD_VERSION=38                 # can be 37 or 38
   SAMPLE_TYPE=WES                  # can be WES or WGS
   INDEX_NAME=your-dataset-name     # the desired index name to output. Will be used later to link the data to the corresponding seqr project

   INPUT_FILE_PATH=${FILE_PATH}/${FILENAME}

   docker compose exec pipeline-runner load_data.sh $BUILD_VERSION $SAMPLE_TYPE $INDEX_NAME $INPUT_FILE_PATH

   ```

### Adding a loaded dataset to a seqr project

After the dataset is loaded into elasticsearch, it can be added to your seqr project with these steps:

1. Go to the project page
1. Click on Edit Datasets
1. Enter the elasticsearch index name (the `$INDEX_NAME` argument you provided at loading time), and submit the form.

## Enable read viewing in the browser

To make .bam/.cram files viewable in the browser through igv.js, see **[ReadViz Setup Instructions](https://github.com/ccmbioinfo/seqr-cfi/blob/master/deploy/READVIZ_SETUP.md)**

## Loading RNASeq datasets

Currently, seqr has a preliminary integration for RNA data, which requires the use of publicly available
pipelines run outside of the seqr platform. After these pipelines are run, the output must be annotated with metadata
from seqr to ensure samples are properly associated with the correct seqr families. After calling is completed, it can
be added to seqr from the "Data Management" > "Rna Seq" page. You will need to provide the file path for the data and the
data type. Note that the file path can either be a gs:// path to a google bucket or as a local file any of the volumes
specified in the docker-compose file. The following data types are supported:

#### Gene Expression

seqr accepts normalized expression TPMs from STAR or RNAseqQC. TSV files should have the following columns:

- sample_id
- project
- gene_id
- TPM
- tissue

#### Expression Outliers

seqr accepts gene expression outliers from OUTRIDER.  TSV files should have the following columns:

- sampleID
- geneID
- pValue
- padjust
- zScore

#### IGV

Splice junctions (.junctions.bed.gz) and coverage (.bigWig) can be visualized in seqr using IGV.
See [ReadViz Setup Instructions](https://github.com/ccmbioinfo/seqr-cfi/blob/master/deploy/READVIZ_SETUP.md) for
instructions on adding this data, as the process is identical for all IGV tracks.
