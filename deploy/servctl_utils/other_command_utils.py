import collections
from datetime import datetime

import logging
import os
import subprocess
import sys
import time

from deploy.servctl_utils.kubectl_utils import get_pod_name, run_in_pod, is_pod_running, \
    wait_for_resource, get_resource_name
from deploy.servctl_utils.yaml_settings_utils import load_settings
from deploy.servctl_utils.shell_utils import run

logging.basicConfig(format='%(asctime)s %(levelname)-8s %(message)s')
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def check_kubernetes_context(deployment_target, set_if_different=False):
    """
    Make sure the environment is configured correctly, so that kubectl and other commands
    are actually aimed at the given deployment target and not some other cluster.

    Args:
        deployment_target (string): value from DEPLOYMENT_TARGETS - eg. "gcloud-dev"
        set_if_different (bool): Update the context if the deployment_target doesn't match the current context.
    Return:
        string: The output of `kubectl config current-context`
    """
    try:
        cmd = 'kubectl config current-context'
        kubectl_current_context = subprocess.check_output(cmd, shell=True).strip()
    except subprocess.CalledProcessError as e:
        logger.error('Error while running "kubectl config current-context": %s', e)
        return

    context_is_different = False
    if deployment_target.startswith("gcloud"):
        suffix = "-%s" % deployment_target.split("-")[1]  # "dev" or "prod"
        if not kubectl_current_context.startswith('gke_') or suffix not in kubectl_current_context:
            logger.error(("'%(cmd)s' returned '%(kubectl_current_context)s' which doesn't match %(deployment_target)s. "
                          "To fix this, run:\n\n   "
                          "gcloud container clusters get-credentials <cluster-name>\n\n"
                          "Using one of these clusters: " + subprocess.check_output("gcloud container clusters list", shell=True) +
                          "\n\n") % locals())
            context_is_different = True
    else:
        raise ValueError("Unexpected value for deployment_target: %s" % deployment_target)

    if context_is_different:
        if set_if_different:
            set_environment(deployment_target)
        else:
            sys.exit(-1)

    return kubectl_current_context


def set_environment(deployment_target):
    """Configure the shell environment to point to the given deployment_target using 'gcloud config set-context' and other commands.

    Args:
        deployment_target (string): value from DEPLOYMENT_TARGETS - eg. "gcloud-dev", etc.
    """

    settings = collections.OrderedDict()
    load_settings([
        "deploy/kubernetes/shared-settings.yaml",
        "deploy/kubernetes/%(deployment_target)s-settings.yaml" % locals(),
        ], settings)

    if deployment_target.startswith("gcloud"):
        os.environ["KUBECONFIG"] = os.path.expanduser("~/.kube/config")
        run("gcloud config set core/project %(GCLOUD_PROJECT)s" % settings, print_command=True)
        run("gcloud config set compute/zone %(GCLOUD_ZONE)s" % settings, print_command=True)
        run("gcloud container clusters get-credentials --zone=%(GCLOUD_ZONE)s %(CLUSTER_NAME)s" % settings, print_command=True)
    else:
        raise ValueError("Unexpected deployment_target value: %s" % (deployment_target,))

    run("kubectl config set-context $(kubectl config current-context) --namespace=%(NAMESPACE)s" % settings)


def copy_files_to_or_from_pod(component, deployment_target, source_path, dest_path, direction=1):
    """Copy file(s) to or from the given component.

    Args:
        component (string): component label (eg. "seqr")
        deployment_target (string): value from DEPLOYMENT_TARGETS - eg. "gcloud-dev"
        source_path (string): source file path. If copying files to the component, it should be a local path. Otherwise, it should be a file path inside the component pod.
        dest_path (string): destination file path. If copying files from the component, it should be a local path. Otherwise, it should be a file path inside the component pod.
        direction (int): If > 0 the file will be copied to the pod. If < 0, then it will be copied from the pod.
    """
    full_pod_name = get_pod_name(component, deployment_target=deployment_target)
    if not full_pod_name:
        raise ValueError("No '%(pod_name)s' pods found. Is the kubectl environment configured in this terminal? and has this type of pod been deployed?" % locals())

    if direction < 0:  # copy from pod
        source_path = "%s:%s" % (full_pod_name, source_path)
    elif direction > 0: # copy to pod
        dest_path = "%s:%s" % (full_pod_name, dest_path)

    run("kubectl cp '%(source_path)s' '%(dest_path)s'" % locals())


def delete_component(component, deployment_target=None):
    """Runs kubectl commands to delete any running deployment, service, or pod objects for the given component(s).

    Args:
        component (string): component to delete (eg. 'postgres' or 'nginx').
        deployment_target (string): value from DEPLOYMENT_TARGETS - eg. "gcloud-dev"
    """
    if component == "cockpit":
        run("kubectl delete rc cockpit", errors_to_ignore=["not found"])
    elif component == 'elasticsearch':
        run('kubectl delete elasticsearch elasticsearch', errors_to_ignore=['not found'])
        # Deleting a released persistent volume does not delete the data on the underlying disk
        wait_for_resource(
            component, '{.items[0].status.phase}', 'Released', deployment_target=deployment_target, resource_type='pv')
        pv = get_resource_name(component, resource_type='pv', deployment_target=deployment_target)
        while pv:
            run('kubectl delete pv {}'.format(pv))
            pv = get_resource_name(component, resource_type='pv', deployment_target=deployment_target)
    elif component == 'kibana':
        run('kubectl delete kibana kibana', errors_to_ignore=['not found'])
    elif component == 'postgres':
        run('gcloud sql instances delete postgres-{}'.format(deployment_target.replace('gcloud-', '')))
    elif component == "nginx":
        raise ValueError("TODO: implement deleting nginx")

    run("kubectl delete deployments %(component)s" % locals(), errors_to_ignore=["not found"])
    run("kubectl delete services %(component)s" % locals(), errors_to_ignore=["not found"])

    pod_name = get_pod_name(component, deployment_target=deployment_target)
    if pod_name:
        run("kubectl delete pods %(pod_name)s" % locals(), errors_to_ignore=["not found"])

        logger.info("waiting for \"%s\" to exit Running status" % component)
        while is_pod_running(component, deployment_target):
            time.sleep(5)


    # print services and pods status
    run("kubectl get services" % locals(), verbose=True)
    run("kubectl get pods" % locals(), verbose=True)


def restore_local_db(db, deployment_target):
    deployment = deployment_target.replace('gcloud-', '')
    filename = '{db}_{deployment}_backup_{timestamp}.gz'.format(
        db=db, deployment=deployment, timestamp=datetime.now().strftime('%Y-%m-%d__%H-%M-%S'))
    gs_file = 'gs://seqr-backups/{}'.format(filename)
    run('gcloud sql export sql postgres-{deployment} {gs_file} --database={db} --offload'.format(
        deployment=deployment, gs_file=gs_file, db=db,
    ))
    run('gsutil mv {} .'.format(gs_file))
    run('psql postgres -c "DROP DATABASE {}"'.format(db))
    run('psql postgres -c "CREATE DATABASE {}"'.format(db))
    run('psql {} <  <(gunzip -c {})'.format(db, filename), executable='/bin/bash')


def delete_all(deployment_target):
    """Runs kubectl and gcloud commands to delete the given cluster and all objects in it.

    Args:
        deployment_target (string): value from DEPLOYMENT_TARGETS - eg. "gcloud-dev"

    """
    settings = {}

    load_settings([
        "deploy/kubernetes/shared-settings.yaml",
        "deploy/kubernetes/%(deployment_target)s-settings.yaml" % locals(),
    ], settings)

    run("gcloud container clusters delete --project %(GCLOUD_PROJECT)s --zone %(GCLOUD_ZONE)s --no-async %(CLUSTER_NAME)s" % settings, is_interactive=True)
    run('gcloud sql instances delete postgres-{}'.format(deployment_target.replace('gcloud-', '')))

    for disk_label in [d.strip() for d in settings['DISKS'].split(',') if d]:
        for disk_name in  get_disk_names(disk_label, settings):
            run('gcloud compute disks delete --zone {zone} {disk_name}'.format(
                zone=settings['GCLOUD_ZONE'], disk_name=disk_name), is_interactive=True)


def get_disk_names(disk, settings):
    num_disks = settings.get('{}_NUM_DISKS'.format(disk.upper().replace('-', '_'))) or 1
    return [
        '{cluster_name}-{disk}-disk{suffix}'.format(
            cluster_name=settings['CLUSTER_NAME'], disk=disk, suffix='-{}'.format(i + 1) if num_disks > 1 else '')
    for i in range(num_disks)]

