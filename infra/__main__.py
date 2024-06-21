"""Python Pulumi program for creating Google Cloud Functions.

Create a single Google Cloud Function. The deployed application will calculate
the estimated travel time to a given location, sending the results via SMS.
"""

import time
import os
import pulumi

from pulumi_gcp import storage
from pulumi_gcp import cloudfunctions


# File path to where the Cloud Function's source code is located.
PATH_TO_SOURCE_CODE = "./app"

# Get values from Pulumi config to use as environment variables in our Cloud Function.
config = pulumi.Config(name=None)
config_values = {}

# We will store the source code to the Cloud Function in a Google Cloud Storage bucket.
bucket = storage.Bucket("recalc_cloud_fn_bucket", location="US")

# The Cloud Function source code itself needs to be zipped up into an
# archive, which we create using the pulumi.AssetArchive primitive.
assets = {}
for file in os.listdir(PATH_TO_SOURCE_CODE):
    location = os.path.join(PATH_TO_SOURCE_CODE, file)
    if os.path.isdir(location):
        continue

    asset = pulumi.FileAsset(path=location)
    assets[file] = asset

archive = pulumi.AssetArchive(assets=assets)

# Create the single Cloud Storage object, which contains all of the function's
# source code. ("main.py" and "requirements.txt".)
source_archive_object = storage.BucketObject(
    "recalc_cloud_fn_bucket",
    name="main.py-%f" % time.time(),
    bucket=bucket.name,
    source=archive,
)

# Create the Cloud Function, deploying the source we just uploaded to Google
# Cloud Storage.
fxn = cloudfunctions.Function(
    "recalc_entrypoint_fn",
    entry_point="entrypoint",
    environment_variables=config_values,
    region="us-central1",
    runtime="python37",
    source_archive_bucket=bucket.name,
    source_archive_object=source_archive_object.name,
    trigger_http=True,
)

invoker = cloudfunctions.FunctionIamMember(
    "invoker",
    project=fxn.project,
    region=fxn.region,
    cloud_function=fxn.name,
    role="roles/cloudfunctions.invoker",
    member="allUsers",
)

# Export the DNS name of the bucket and the cloud function URL.
pulumi.export("bucket_name", bucket.url)
pulumi.export("fxn_url", fxn.https_trigger_url)
