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

## Updating / Migrating a  seqr Instance	

Instructions for updating an existing seqr instance to the latest version are found 
**[here](https://github.com/broadinstitute/seqr-helm?tab=readme-ov-file#updating-seqr)**

## Contributing to seqr

Refer to the upstream repository for any contribution efforts.

