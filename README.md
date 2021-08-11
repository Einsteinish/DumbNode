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
Now that the policies and roles are in place, we can create our ECS fargate task and service.

This module creates ECS fargate for logstash including task definiation, service, and an ECS cluster. Also, it makes a docker image and uploads it to ECR.

* variables.tf - change the following: vpc_id, account, public_subnets, private_subnets, ssl_cert_arn, and docker_path.
* Check the credentials time limit left (> 30min). If “retry” message appears while uploading the image to ecr, it indicates credentials time out. Usually, the deploy takes ~15minutes.

```
terraform init
```
If it's the first time, this will ask if we want to use S3 as a remote state store. Select "yes".

Because the "count" value (to get private ips of nlb) depends on resource attributes that cannot be determined until apply, we need to create the nlb resource first:
```
terraform plan -target=aws_lb.nlb
terraform apply -target=aws_lb.nlb
```

Once the nlb is in place, we can create the rest of the resources:
```
terraform plan
terraform apply
```


## Debug:
* For some reasons, if the ECR image uploading fails (due to timeout or else), we can run that specific resource:
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


## Technical notes

### TLS
```
* Client (Cortex DL) —> NLB (sl.tripactions.com) TLS listener———> Target group (TCP listener, logstash) ---> S3
```
Since the backend target group listener is TCP, TLS offloading happens at NLB level and unencrypted traffic is forwarded to backends. Otherwise (if target group  were TLS), the traffic message would get encrypted into a coded message before being directed to target group which has TLS listeners.

### NLB and security group
Because we cannot attach a security group to NLB, a security group on the target group is used. For Ingress, only the traffic from the cidr_blk (165.1.213.17/32 - cortex log forwarder) and private ips of NLB (for health check) are allowed.

### Docker image creating and uploading it to ECR
The "terraform-fargate-logstash/push.sh" script is run via terraform's "null_resource" using "local-exec" provisioner.  The script is doing the following job:
```
$ cd "$source_path" && docker build -t "$image_name"

$ aws --region us-west-2 ecr get-login-password \                                         
    | docker login --password-stdin --username AWS $account_arn
        
$ docker tag "$image_name" "$repository_url":"$tag"

$ docker push "$repository_url":"$tag" 
```
