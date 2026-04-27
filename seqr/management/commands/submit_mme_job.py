import os

from django.core.management.base import BaseCommand

from matchmaker.models import MatchmakerSubmission
from matchmaker.views.matchmaker_api import MME_NODES_BY_NAME, _search_node_matches
from seqr.views.utils.permissions_utils import user_is_data_manager
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = "Periodic MME refetch"

    def handle(self, *args, **options):
        system_user = User.objects.get(username=os.environ.get('MME_AUTO_SUBMIT_USER', 'system'))

        submissions = MatchmakerSubmission.objects.all()

        # Iterates through all submissions ie. all submissions in all projects
        for submission in submissions:
            try:
                # 1) Local search (creates incoming_query)
                _search_node_matches(
                    submission_guid=submission.guid,
                    node="Seqr Canada",
                    user=system_user,
                    is_local=True,
                )

                # 2) External searches
                for node in MME_NODES_BY_NAME.keys():
                    if node == "Seqr Canada":
                        continue
                    _search_node_matches(
                        submission_guid=submission.guid,
                        node=node,
                        user=system_user
                    )

            except Exception as e:
                self.stderr.write(
                    f"{submission.guid} failed: {e}"
                )