from seqr.models import Sample
from seqr.utils.search.elasticsearch.es_utils import validate_index_metadata_and_get_samples
from seqr.views.utils.dataset_utils import match_and_update_search_samples, load_mapping_file


def add_new_search_samples(request_json, project, user, summary_template=False, expected_families=None):
    required_fields = ['elasticsearchIndex', 'datasetType']  # TODO
    if any(field not in request_json for field in required_fields):
        raise ValueError(f'request must contain fields: {", ".join(required_fields)}')

    dataset_type = request_json['datasetType']
    if dataset_type not in Sample.DATASET_TYPE_LOOKUP:
        raise ValueError(f'Invalid dataset type "{dataset_type}"')

    elasticsearch_index = request_json['elasticsearchIndex'].strip()
    dataset_type = request_json['datasetType']
    ignore_extra_samples = request_json.get('ignoreExtraSamplesInCallset')
    genome_version = request_json.get('genomeVersion')
    sample_id_to_individual_id_mapping = load_mapping_file(
        request_json['mappingFilePath'], user) if request_json.get('mappingFilePath') else {}

    sample_ids, sample_type = validate_index_metadata_and_get_samples(
        elasticsearch_index, project=project, dataset_type=dataset_type, genome_version=genome_version)
    if not sample_ids:
        raise ValueError('No samples found in the index. Make sure the specified caller type is correct')

    sample_data = {
        'elasticsearch_index': elasticsearch_index,
    }
    num_samples, matched_individual_ids, activated_sample_guids, inactivated_sample_guids, updated_family_guids = match_and_update_search_samples(
        project=project,
        user=user,
        sample_ids=sample_ids,
        sample_data=sample_data,
        sample_type=sample_type,
        dataset_type=dataset_type,
        expected_families=expected_families,
        sample_id_to_individual_id_mapping=sample_id_to_individual_id_mapping,
        raise_unmatched_error_template=None if ignore_extra_samples else 'Matches not found for ES sample ids: {sample_ids}. Uploading a mapping file for these samples, or select the "Ignore extra samples in callset" checkbox to ignore.'
    )

    updated_samples = Sample.objects.filter(guid__in=activated_sample_guids)

    summary_message = None
    if summary_template:
        updated_individuals = {sample.individual_id for sample in updated_samples}
        previous_loaded_individuals = {
            sample.individual_id for sample in Sample.objects.filter(
                individual__in=updated_individuals, sample_type=sample_type, dataset_type=dataset_type,
            ).exclude(elasticsearch_index=elasticsearch_index)}
        previous_loaded_individuals.update(matched_individual_ids)
        new_sample_ids = [
            sample.sample_id for sample in updated_samples if sample.individual_id not in previous_loaded_individuals]
        summary_message = summary_template.format(
            num_new_samples=len(new_sample_ids),
            new_sample_id_list=', '.join(new_sample_ids),
            sample_type=sample_type,
            dataset_type='' if dataset_type == Sample.DATASET_TYPE_VARIANT_CALLS else f' {dataset_type}',
        )

    return num_samples, inactivated_sample_guids, updated_family_guids, updated_samples, summary_message