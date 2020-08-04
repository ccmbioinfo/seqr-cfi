import mock
import responses
import tempfile

from reference_data.models import dbNSFPGene

from django.core.management import call_command
from django.test import TestCase

dbNSFP_HEADER = "Gene_name	Ensembl_gene	chr	Gene_old_names	Gene_other_names	Uniprot_acc(HGNC/Uniprot)	Uniprot_id(HGNC/Uniprot)	Entrez_gene_id	CCDS_id	Refseq_id	ucsc_id	MIM_id	OMIM_id	Gene_full_name	Pathway(Uniprot)	Pathway(BioCarta)_short	Pathway(BioCarta)_full	Pathway(ConsensusPathDB)	Pathway(KEGG)_id	Pathway(KEGG)_full	Function_description	Disease_description	MIM_phenotype_id	MIM_disease	Orphanet_disorder_id	Orphanet_disorder	Orphanet_association_type	Trait_association(GWAS)	GO_biological_process	GO_cellular_component	GO_molecular_function	Tissue_specificity(Uniprot)	Expression(egenetics)	Expression(GNF/Atlas)	Interactions(IntAct)	Interactions(BioGRID)	Interactions(ConsensusPathDB)	P(HI)	HIPred_score	HIPred	GHIS	P(rec)	Known_rec_info	RVIS_EVS	RVIS_percentile_EVS	LoF-FDR_ExAC	RVIS_ExAC	RVIS_percentile_ExAC	ExAC_pLI	ExAC_pRec	ExAC_pNull	ExAC_nonTCGA_pLI	ExAC_nonTCGA_pRec	ExAC_nonTCGA_pNull	ExAC_nonpsych_pLI	ExAC_nonpsych_pRec	ExAC_nonpsych_pNull	gnomAD_pLI	gnomAD_pRec	gnomAD_pNull	ExAC_del.score	ExAC_dup.score	ExAC_cnv.score	ExAC_cnv_flag	GDI	GDI-Phred	Gene damage prediction (all disease-causing genes)	Gene damage prediction (all Mendelian disease-causing genes)	Gene damage prediction (Mendelian AD disease-causing genes)	Gene damage prediction (Mendelian AR disease-causing genes)	Gene damage prediction (all PID disease-causing genes)	Gene damage prediction (PID AD disease-causing genes)	Gene damage prediction (PID AR disease-causing genes)	Gene damage prediction (all cancer disease-causing genes)	Gene damage prediction (cancer recessive disease-causing genes)	Gene damage prediction (cancer dominant disease-causing genes)	LoFtool_score	SORVA_LOF_MAF0.005_HetOrHom	SORVA_LOF_MAF0.005_HomOrCompoundHet	SORVA_LOF_MAF0.001_HetOrHom	SORVA_LOF_MAF0.001_HomOrCompoundHet	SORVA_LOForMissense_MAF0.005_HetOrHom	SORVA_LOForMissense_MAF0.005_HomOrCompoundHet	SORVA_LOForMissense_MAF0.001_HetOrHom	SORVA_LOForMissense_MAF0.001_HomOrCompoundHet	Essential_gene	Essential_gene_CRISPR	Essential_gene_CRISPR2	Essential_gene_gene-trap	Gene_indispensability_score	Gene_indispensability_pred	MGI_mouse_gene	MGI_mouse_phenotype	ZFIN_zebrafish_gene	ZFIN_zebrafish_structure	ZFIN_zebrafish_phenotype_quality	ZFIN_zebrafish_phenotype_tag\n"

dbNSFP_GENE_DATA = [ dbNSFP_HEADER,
    "OR4F5	ENSG00000186092	1	.	.	Q8NH21	OR4F5_HUMAN	79501	CCDS30547	NM_001005484	uc001aal.1	.	618355	olfactory receptor family 4 subfamily F member 5	.	.	.	Olfactory transduction - Homo sapiens (human);Olfactory receptor activity;Signaling by GPCR;Signal Transduction;Olfactory Signaling Pathway;G alpha (s) signalling events;GPCR downstream signalling	hsa04740	Olfactory transduction	FUNCTION: Odorant receptor. {ECO:0000305}.; 	.	.	.	.	.	.	.	G protein-coupled receptor signaling pathway;detection of chemical stimulus involved in sensory perception of smell	plasma membrane;integral component of membrane	G protein-coupled receptor activity;olfactory receptor activity	.	.	.	1	1	1	0.06092	0.186891868710518	N	.	0.07159	.	.	.	0.9905209	.	.	0.176329298172162	0.644086264144236	0.179584437683602	0.550302420215064	0.39663970580189	0.0530578739830465	0.179613130021276	0.623408532464667	0.196978337514057	3.0650e-02	6.1116e-01	3.5819e-01	.	.	.	.	113.16669	2.31572	Medium	Medium	Medium	Medium	Medium	Medium	Medium	Medium	Medium	Medium	.	3.9936102236421724E-4	0.0	3.9936102236421724E-4	0.0	0.022763578274760384	0.00439297124600639	0.008386581469648562	0.001996805111821086	.	.	.	N	0.114371359811310	N	.	.	.	.	.	.\n",
    "INVALID-GENE-NO-ID	.	.	.	.	.	107985730	.	XR_001737835	.	.	618355	MIR1302-2 host gene	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	1	1	1	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	0.0	0.0	0.0	0.0	0.0	0.0	0.0	0.0	.	.	.	.	.	.	.	.	.	.	.	.\n",
    "INVALID_GENE-UNKNOWN\xe2	ENSG00000268895	19	NCRNA00181;A1BGAS;A1BG-AS	FLJ23569	.	.	503538	.	NR_015380	uc002qse.3	.	.	A1BG antisense RNA 1	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	1	1	1	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	.	7.987220447284345E-4	0.0	7.987220447284345E-4	0.0	0.02875399361022364	0.0	0.017172523961661343	0.0	.	.	.	.	.	.	.	.	.	.	.	.\n"
]


class UpdateDbNsfpGeneTest(TestCase):
    fixtures = ['users', 'reference_data']
    multi_db = True

    @responses.activate
    @mock.patch('reference_data.management.commands.utils.update_utils.logger')
    @mock.patch('reference_data.management.commands.utils.download_utils.tempfile')
    def test_update_dbnsfp_gene_command(self, mock_tempfile, mock_logger):
        tmp_dir = tempfile.gettempdir()
        mock_tempfile.gettempdir.return_value = tmp_dir
        tmp_file = '{}/dbNSFP4.0_gene'.format(tmp_dir)

        url = 'http://storage.googleapis.com/seqr-reference-data/dbnsfp/dbNSFP4.0_gene'
        responses.add(responses.HEAD, url, headers={"Content-Length": "1024"})
        responses.add(responses.GET, url, body=''.join(dbNSFP_GENE_DATA))

        # test without a file_path parameter
        call_command('update_dbnsfp_gene')

        calls = [
            mock.call('Deleting 3 existing dbNSFPGene records'),
            mock.call('Parsing file'),
            mock.call('Creating 1 dbNSFPGene records'),
            mock.call('Done'),
            mock.call('Loaded 1 dbNSFPGene records from {}. Skipped 1 records with unrecognized genes.'.format(tmp_file)),
            mock.call('Running ./manage.py update_gencode to update the gencode version might fix missing genes')
        ]
        mock_logger.info.assert_has_calls(calls)

        self.assertEqual(dbNSFPGene.objects.count(), 1)
        record = dbNSFPGene.objects.get(gene_names = 'OR4F5')
        self.assertEqual(record.gene.gene_id, 'ENSG00000186092')

        # test with a file_path parameter
        mock_logger.reset_mock()
        responses.remove(responses.GET, url)
        call_command('update_dbnsfp_gene', tmp_file)
        calls = [
            mock.call('Deleting 1 existing dbNSFPGene records'),
            mock.call('Parsing file'),
            mock.call('Creating 1 dbNSFPGene records'),
            mock.call('Done'),
            mock.call('Loaded 1 dbNSFPGene records from {}. Skipped 1 records with unrecognized genes.'.format(tmp_file)),
            mock.call('Running ./manage.py update_gencode to update the gencode version might fix missing genes')
        ]
        mock_logger.info.assert_has_calls(calls)
