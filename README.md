Terraform for Syslog
========

The following two repos are used to deploy logstash using ECS fargate.
The logstash server will get forwarded logs from Cortex Data Lake and uploads to S3 bucket.

## Prerequisites:

* Terraform should be installed on the local machine (version > 1.0).
* Docker daemon should be running since we'll run docker file and upload it to ECR.
* Proper AWS credentials  with time limit left (> 30min). 
* S3 bucket to store terraform state should be created outside of terraform. For example "ta-terraform-states-377028479240"
* Pre-existing VPC with private subnets.
* Log group should be created outside of terraform because the terra does not have a permission to delete the log group.The name is “<app_name>-<container_name>”.


## How to use the templates
There are three files: main.tf (root modudle), variables.tf and outputs.tf (specific outputs we need to see or use)
To create any resources, we need to go into the folder and run terraform.

### terraform-iam:
This will create polocies,roles, and buckets for syslog upload and nlb access logs. Optionally, we can create a loggroup for the container via this terraform module.
Those resources should be created before creating ECS logstash.
* Change the S3 backend in main.tf (account name in the bucket name) and make sure the bucket should be create before any terraform runs.

```
terraform init
```
If it's the first time, this will ask if we want to use S3 as a remote state store. Select "yes".

```
terraform plan
terraform apply
```

### terraform-fargate-logstash:
This module creates ECS fargate for logstash including task definiation, service, and an ECS cluster. Also, it makes a docker image and uploads it to ECR.

* variables.tf - change the following: vpc_id, account, public_subnets, private_subnets, ssl_cert_arn, and docker_path.
* Check the credentials time limit left (> 30min). If “retry” message appears while uploading the image to ecr, it indicates credentials time out. Usually, the deploy takes ~15minutes.

```
terraform init
```
If it's the first time, this will ask if we want to use S3 as a remote state store. Select "yes".
Because of dependency of the resources (for the resource not known till apply), we need to create a nlb first:
```
terraform plan -target=aws_lb.nlb
terraform apply -target=aws_lb.nlb
```

Once the nlb is created, we can run the following:
```
terraform plan
terraform apply
```

## Debug:
* For some reasons, the ECR image uploading faces (due to timeout or else), we can run that specific resource:
```
terraform apply -replace="null_resource.push"
terraform apply -replace="aws_ecs_task_definition.td"
```
Note that we need to update the task definition. The service will automatically pick up the new task definition.

* To test the logstash, we can send a message either via via nlb's dns or fqdn:
```
echo "terraform message at $(date) from khong's mac" | openssl s_client -connect ssl-nlb-terraform-f323762e1de715f5.elb.us-west-2.amazonaws.com:6514 -ign_eof
```
or
```
echo "terraform message at $(date) from khong's mac" | openssl s_client -connect sl.tripactions.com:6514 -ign_eof
```
