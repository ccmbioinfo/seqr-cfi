import json
import os

from django.core.management.base import BaseCommand
from django.core.mail.message import EmailMessage

from matchmaker.models import MatchmakerResult, MatchmakerSubmission
from matchmaker.views.matchmaker_api import MME_NODES_BY_NAME, _parse_mme_results, _search_node_matches
from django.contrib.auth.models import User

from seqr.models import Individual
class Command(BaseCommand):
    help = "Periodic MME refetch"

    def handle(self, *args, **options):
        system_user = User.objects.get(username=os.environ.get('MME_AUTO_SUBMIT_USER', 'system'))
        submissions = MatchmakerSubmission.objects.all()

        # Iterates through all submissions ie. all submissions in all projects
        for submission in submissions:
            if submission.deleted_date:
                continue
            pre_search_ids = set(MatchmakerResult.objects.filter(submission=submission).values_list("guid", flat=True))
            try:
                # 1) Search our own instance for matches
                _search_node_matches(
                    submission_guid=submission.guid,
                    node="Seqr Canada",
                    user=system_user,
                    is_local=True,
                )

                # 2) External searches to other nodes
                for node in MME_NODES_BY_NAME.keys():
                    if node == "Seqr Canada":
                        continue
                    _search_node_matches(
                        submission_guid=submission.guid,
                        node=node,
                        user=system_user
                    )
            
                # Populate if there are new matches
                new_matches = MatchmakerResult.objects.filter(submission=submission).exclude(guid__in=pre_search_ids)

                # New matches found, send email notification to submission contact
                if new_matches.exists() :
                    email_body = []
                    sub = (
                        Individual.objects
                        .select_related("family__project")
                        .get(individual_id=submission.label)
                    )
                    family_id = sub.family.family_id
                    project_name = sub.family.project.name

                    email_body.append(f"A new Matchmaker Exchange (MME) request was made for the following submission: \nIndividual: {submission.label} \nFamily: {family_id} \nProject: {project_name}\n\nThe following NEW matches were found:")

                    parsed_results = _parse_mme_results(submission, new_matches, system_user)
                    parsed_results = json.loads(parsed_results.content)

                    # Construct email body, each iteration represents each new match
                    for match in parsed_results["mmeResultsByGuid"].values():
                        email_body.append("--- New match ---")
                        
                        for i in range(len(match["geneVariants"])):
                            email_body.append(f"Gene: {parsed_results["genesById"][match["geneVariants"][i]["geneId"]]["geneSymbol"]}")
                            # variant info exists 
                            if "variant" in match["geneVariants"][0]:
                                variant_info = match["geneVariants"][i]["variant"]

                                # CASE 1: Representation of variant when REF and ALT are available ->   {geneid}: {chr}:{POS} {ref}>{alt} (assembly)
                                if variant_info["alt"] and variant_info["ref"]:
                                    variant = (f"{match["geneVariants"][i]["geneId"]}:{variant_info["chrom"]}:{variant_info["pos"]} {variant_info["ref"]}>{variant_info["alt"]} ({variant_info["genomeVersion"]})")
                                
                                # CASE 2: Representation of variant without REF and ALT ->   {gene ID}:{referenceName}-{pos} (assembly)
                                else:
                                    variant_features = match["patient"]["genomicFeatures"][i]
                                    variant = (f"{variant_features["gene"]["id"]}:{variant_features["variant"]["referenceName"]}-{variant_features["variant"]["start"]} ({variant_features["variant"]["assembly"]})")
                                
                                email_body.append(f"Variant: {variant}")
                        email_body.append(f"Phenotypes: {match["phenotypes"]}")
                        email_body.append(f"Contact: {match["patient"]["contact"]["name"]} ({match["patient"]["contact"]["href"].replace("mailto:", "")}) - {match["patient"]["contact"]["institution"]}")

                    contact_email = submission.contact_href.replace('mailto:', '')
                    email_body = "\n".join(email_body)

                    email_message = EmailMessage(
                        subject="Seqr Canada — New MME Match(es) Found!",
                        body=email_body,
                        to=[contact_email],
                        from_email="seqr@seqr.genomics4rd.ca",
                    )
                    try:
                        email_message.send()
                    except Exception as e:
                        message = str(e)
                        print(message)

            except Exception as e:
                self.stderr.write(
                    f"{submission.guid} failed: {e}"
                )