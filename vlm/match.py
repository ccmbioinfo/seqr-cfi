from aiohttp.web import HTTPBadRequest
import hail as hl
import os

VLM_DATA_DIR = os.environ.get('VLM_DATA_DIR')
SEQR_BASE_URL = os.environ.get('SEQR_BASE_URL')
NODE_ID = os.environ.get('NODE_ID')

BEACON_HANDOVER_TYPE = {
    'id': NODE_ID,
    'label': f'{NODE_ID} browser'
}

BEACON_META = {
    'apiVersion': 'v1.0',
    'beaconId': 'com.gnx.beacon.v2',
    'returnedSchemas': [
        {
            'entityType': 'genomicVariant',
            'schema': 'ga4gh-beacon-variant-v2.0.0'
        }
    ]
}

QUERY_PARAMS = ['assemblyId', 'referenceName', 'start', 'referenceBases', 'alternateBases']

GENOME_VERSION_GRCh38 = 'GRCh38'
GENOME_VERSION_GRCh37 = 'GRCh37'
ASSEMBLY_LOOKUP = {
    GENOME_VERSION_GRCh37: GENOME_VERSION_GRCh37,
    GENOME_VERSION_GRCh38: GENOME_VERSION_GRCh38,
    'hg38': GENOME_VERSION_GRCh38,
    'hg19': GENOME_VERSION_GRCh37,
}

def get_variant_match(query: dict) -> dict:
    chrom, pos, ref, alt, genome_build = _parse_match_query(query)

    locus = hl.locus(chrom, pos, reference_genome=genome_build)
    interval = hl.eval(hl.interval(locus, locus, includes_start=True, includes_end=True))
    ht = hl.read_table(
        f'{VLM_DATA_DIR}/{genome_build}/SNV_INDEL/annotations.ht', _intervals=[interval], _filter_intervals=True,
    )
    ht = ht.filter(ht.alleles==hl.array([ref, alt]))
    counts = ht.aggregate(hl.agg.take(ht.gt_stats, 1))

    return _format_results(counts, genome_build, f'{chrom}-{pos}-{ref}-{alt}')


def _parse_match_query(query: dict) -> tuple[str, int, str, str, str]:
    missing_params = [key for key in QUERY_PARAMS if key not in query]
    if missing_params:
        raise HTTPBadRequest(reason=f'Missing required parameters: {", ".join(missing_params)}')

    genome_build = ASSEMBLY_LOOKUP.get(query['assemblyId'])
    if not genome_build:
        raise HTTPBadRequest(reason=f'Invalid assemblyId: {query["assemblyId"]}')

    chrom = query['referenceName'].replace('chr', '')
    if genome_build == GENOME_VERSION_GRCh38:
        chrom = f'chr{chrom}'
    if not hl.eval(hl.is_valid_contig(chrom, reference_genome=genome_build)):
        raise HTTPBadRequest(reason=f'Invalid referenceName: {query["referenceName"]}')

    start = query['start']
    if not start.isnumeric():
        raise HTTPBadRequest(reason=f'Invalid start: {start}')
    start = int(start)
    if not hl.eval(hl.is_valid_locus(chrom, start, reference_genome=genome_build)):
        raise HTTPBadRequest(reason=f'Invalid start: {start}')

    return chrom, start, query['referenceBases'], query['alternateBases'], genome_build


def _format_results(counts: hl.Struct, genome_build: str, variant_id: str) -> dict:
    result_sets = [
        ('Homozygous', counts[0].hom),
        ('Heterozygous', counts[0].AC - (counts[0].hom * 2)),
    ] if counts else []
    return {
        'beaconHandovers': [
            {
                'handoverType': BEACON_HANDOVER_TYPE,
                'url': f'{SEQR_BASE_URL}summary_data/variant_lookup?genomeVersion={genome_build.replace("GRCh", "")}&variantId={variant_id}',
            }
        ],
        'meta': BEACON_META,
        'responseSummary': {
            'exists': bool(counts),
            'total': (counts[0].AC - counts[0].hom) if counts else 0
        },
        'response': {
            'resultSets': [
                {
                    'exists': True,
                    'id': f'{NODE_ID} {label}',
                    'results': [],
                    'resultsCount': count,
                    'setType': 'genomicVariant'
                } for label, count in result_sets
            ]
        }
    }
