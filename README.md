Terraform for Syslog
========

The repository is used to deploy **logstash** using ECS fargate.
The logstash server will get forwarded **syslogs** from **Cortex Data Lake** and uploads the logs to **S3** bucket.


## Prerequisites:

* **Terraform** should be installed on the local machine (version > 1.0).
* **Docker** daemon should be running since we'll run Dockerfile and upload it to ECR.
* Proper **AWS credentials**  with time limit left (> 30min). 
* **S3** bucket to store **terraform state** should be created outside terraform. For example "ta-terraform-states-[accoun-number]"
* Pre-existing **VPC** with both **public and private subnets**.
* **Log group** for fargate task should be created outside terraforms because the terraform does not have a permission to delete((terraform destroy) the log group. The name is “<app_name>-<container_name>”.
* For Docker image with logstash configuration, clone a repo, [https://git-codecommit.us-west-2.amazonaws.com/v1/repos/ta-docker-mod](https://git-codecommit.us-west-2.amazonaws.com/v1/repos/ta-docker-mod). The source files for **Dockerfile** and the logstash configuration are located in "ta-docker-mod/tripactions-logstash-cortex".


## How to use the templates
There are three files: main.tf (root module), variables.tf (variables to use main.tf) and outputs.tf (specific outputs we need to see or use)
To create any resources, we need to go into the folder and run terraform.

### Required pre-existing Resource
The following resources should be created before before we create ECS fargate logstash.
* aws_vpc
* aws_subnet - pub/priv subnets
* aws_caller_identity - to get account ID, User ID, and ARN
* aws_elb_service_account - to get the account ID of the Load Balancing Service Account in a given region for the purpose of permitting in S3 bucket policy
* aws_iam_role - role for a task and task-exec roles
* aws_network_interfaces / aws_network_interface - used to get pub ips of nlb
* aws_s3_bucket - syslog upload S3 bucket

### Resource to be created by terraform
* aws_ecr_repository - ECR repo
* null_resource - push.sh to create Docker image and push it to ECR
* aws_ecs_cluster
* aws_ecs_service
* aws_security_group - sg for the ecs service
* aws_ecs_task_definition
* aws_s3_bucket - nlb access log
* aws_s3_bucket_public_access_block - public access acls
* aws_lb - network load balancer
* aws_lb_target_group - target group for the nlb (tcp)
* aws_lb_listener listener for the nlb (tls)

### Running terraform
* Input (variables.tf)
 - **vpc_id**
 - region
 - **account number**
 - **environment**
 - **public_subnets / private_subnets**
 - cortex_cidr
 - **ssl_cert_arn**
 - **s3_upload_bucket_name**
 - s3_size_file - S3 uploading file size in bytes
 - s3_time_file - S3 uploading time interval in minutes

* Input (main.tf)
 - **terraform state S3 bucket**, for example, ta-terraform-states-account


### terraform-fargate-logstash:
Now that the policies and roles for fargate task are in place, we can create the ECS fargate task and service.

This module creates ECS fargate for logstash including task definition, service, and an ECS cluster. Also, it makes a docker image and uploads it to ECR.

* variables.tf - change the following: vpc_id, account, public_subnets, private_subnets, ssl_cert_arn, and docker_path.
* Check the credentials time limit left (> 30min). If “retry” message appears while uploading the image to ecr, it indicates credentials time out. Usually, the deploy takes ~15minutes.

```
terraform init
```
If it's the first time, this will ask if we want to use S3 as a remote state store. Select "yes". Then, continue...

```
terraform plan
terraform apply
```


## Debug:
* For some reasons, if the ECR image uploading fails (due to timeout or due to something else), we can run that specific resource using a "-replace" flag:
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

* Logs for tasks

To see the logs of ECS fargate task, we can either check CloudWatch
Log groups
```
CloudWatch> Log groups > ecs/cortex-logstash-container-terraform
```
or 
select the "Logs" tab under a specific task.

* Logs for NLB

The access log is available from S3 bucket, for example, "nlb-log-terraform". This is useful when we have an issue between the Cortex Data Lake and our AWS NLB. Info: [Access logs for your Network Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-access-logs.html).


## Technical notes

### TLS/TCP
```
* Client (Cortex DL) —> NLB (sl.tripactions.com) TLS listener———> Target group (TCP listener, logstash) ---> S3
```
Since the backend target group listener is TCP, TLS offloading happens at NLB level and unencrypted traffic is forwarded to backends. Otherwise (if target group  were TLS), the traffic message would get encrypted into a coded message before being directed to target group which has TLS listeners.

### NLB and security group
Because we cannot attach a security group to NLB, a security group on the target group is used. For Ingress, only the traffic from the cidr_blk (165.1.213.17/32 - cortex log forwarder) and private ips of NLB (for health check) are allowed.

### NLB and client ip preservation
The client IP preservation is enablqed by setting the following in "aws_lb_target_group" resource:
```
preserve_client_ip = true
```

### Docker image creating and uploading it to ECR
The "terraform-fargate-logstash/push.sh" script is run via terraform's "null_resource" using "local-exec" provisioner.  The script is doing the following job:
```
$ cd "$source_path" && docker build -t "$image_name"

$ aws --region us-west-2 ecr get-login-password \                                         
    | docker login --password-stdin --username AWS $account_arn
        
$ docker tag "$image_name" "$repository_url":"$tag"

$ docker push "$repository_url":"$tag" 
```


## Links
* [Forward Logs from Cortex Data Lake to a Syslog Server](https://docs.paloaltonetworks.com/cortex/cortex-data-lake/cortex-data-lake-getting-started/get-started-with-log-forwarding-app/forward-logs-from-logging-service-to-syslog-server.html) - How to configure Cortex Data Lake to forward all logs or a subset of logs to a syslog receiver. It has information about the cidr range as well.
* [Access logs for your Network Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-access-logs.html) - Information about the fields of the access log.
