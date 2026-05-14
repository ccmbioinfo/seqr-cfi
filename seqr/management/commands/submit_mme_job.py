import os

from django.core.management.base import BaseCommand
from django.core.mail.message import EmailMessage

from matchmaker.models import MatchmakerResult, MatchmakerSubmission
from matchmaker.views.matchmaker_api import MME_NODES_BY_NAME, _search_node_matches
from django.contrib.auth.models import User
class Command(BaseCommand):
    help = "Periodic MME refetch"

    def handle(self, *args, **options):
        system_user = User.objects.get(username=os.environ.get('MME_AUTO_SUBMIT_USER', 'system'))
        submissions = MatchmakerSubmission.objects.all()

        # Iterates through all submissions ie. all submissions in all projects
        for submission in submissions:
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
                    contact_email = submission.contact_href.replace('mailto:', '')

                    email_message = EmailMessage(
                        subject="Seqr Canada MME Matches found Notification",
                        body="This is a test body, new match was found!", # ********* TO DO: Populate body with match info (ie. for match in new_matches: match.result_data.{...})
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