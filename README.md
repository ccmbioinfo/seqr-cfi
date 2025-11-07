# seqr

seqr is a web-based tool for rare disease genomics.
This repository contains code that underlies the [Seqr Canada seqr instance](https://seqr.genomics4rd.ca) and other seqr deployments. To check for any active incidents occurring on the Seqr Canada seqr instance, check [here](/INCIDENTS.md)

## Technical Overview

seqr consists of the following components:
- postgres - SQL database used by seqr to store project metadata and user-generated content such as variant notes, etc.
- clickhouse - High-performance SQL database used to store variant data.
- redis - in-memory cache used to speed up request handling.
- seqr - the main client-server application built using react.js, python and django.
- pipeline-runner - server for running hail pipelines to annotate and load new datasets into clickhouse.

## Install

The seqr production instance runs on the HPC4Health infrastructure, which includes servers and hardware purchased by the CHEO-RI.

On-prem installs can be created using **[helm](deploy/LOCAL_INSTALL_HELM.md)**

To set up seqr for local development, see instructions **[here](deploy/LOCAL_DEVELOPMENT_INSTALL.md)**  

### Legacy installs

Historically, on-prem installs can use docker-compose to run a version of seqr with an elasticsearch backend.
This backend will be supported through **March 1, 2026**.
If you are setting up a new installation of seqr, do not use this method. However, if you have an existing installation 
you can find documentation for this method here:
 **[Local installs using docker-compose](deploy/LOCAL_INSTALL.md)**

## Updating / Migrating a  seqr Instance	

Instructions for updating an existing seqr instance to the latest version are found 
**[here](https://github.com/broadinstitute/seqr-helm?tab=readme-ov-file#updating-seqr)**

### Legacy installs

Instructions for migrating application data from a docker-compose installation to a helm installation are found
**[here](https://github.com/broadinstitute/seqr-helm?tab=readme-ov-file#migrating-application-data-from-docker-composeyaml)**

Instructions for updating a docker-compose installation to the latest version still using docker-compose are found
**[here](deploy/MIGRATE.md)**

## Contributing to seqr

Refer to the upstream repository for any contribution efforts.

