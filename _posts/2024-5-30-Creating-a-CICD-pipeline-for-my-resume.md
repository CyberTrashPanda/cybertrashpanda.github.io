---
layout: default
title: Creating a CI/CD pipeline for my CV.
date: 2024-05-30
categories: devops
---

In this blogpost I will discuss how I build a CI/CD pipeline for my resume site.
The technologies used are the following:
- AWS S3 Buckets
- AWS CloudFront
- AWS Lambda
- AWS Route 53
- AWS Certificate Manager
- Github Actions


### 1) AWS IAM
Since we are gonna use our S3 bucket to read/write files. 
It is a good idea to create a new user with the **AmazonS3FullAccess** permission. 
I suggest using a group and creating a new user so we can use his **AWS_ACCESS_KEY_ID** and **AWS_SECRET_ACCESS_KEY** later to modify files in that bucket.

### 2) Creating a S3 bucket
Go ahead and create an S3 bucket with the name of your choosing (Don't forget to select the proper region you want your bucket to be.). 
Make sure you have the following things activated:
- Block all public access
- Disable static web hosting

### 3) CloudFront configuration
Create a new distribution. Point the property **origin domain** to our s3 bucket.
Set the origin access to **Origin access control settings**.
Set default root object to **index.html** or any other file that you wanna point your site to.
And set the **Redirect HTTP to HTTPS** option.

Go ahead and **Create Distribution** and once the distribution is created go ahead and head to the **Origins** tab and select the **Edit** option there you should see a button that says **Copy Policy** 

Go back to the S3 settings and head to the **permissions** tab and find the **bucket policy** section, paste the policy you just copied and save the settings.

That will ensure that our S3 bucket and the CloudFront service are synced and that only the CloudFront service can access our bucket.


### 4) Route 53
Now it is the time to find a suitable domain name for you resume. Mine was [teresume.com](https://teresume.com) . 

### 5) Certificate Manager
Once you are done with the domain registration, you should head to the AWS Certificate Manager to create your HTTPS certificates.
You should request the certificate for the following domains:
- mydomain.com
- `*`.mydomain.com
### 6) Route 53 part 2
Now that we have set up a domain and we have our certificates its time to create a **Hosted Zone** , point it to your domain name, it will act as a container for our DNS records.

Now go ahead and create two A record that points to the CloudFront domain.
One without a subdomain and one with the **www** subdomain.

### 7) CloudFront part 2
We should head back to our CloudFront distribution and hit the edit button.
Add the following CNAMEs to our distribution.
- mydomain.com
- www.mydomain.com
And make sure you have set up your custom SSL Certificate for your domain.
If everything is set up properly you should be able to access your site trough the https://mydomain.com

### 8) DynamoDB

Create a new table in the DynamoDB, this is used in my case to store the counter of visitors for my website.
After creating the table with the name **visitors** or **clicks** or whatever you want.
Select the **Explore items** option and set a new item named **views** and set it as integer with the value 1.

### 9) Lamda function
We now have to create a function that will increment the views counter we set on our DynamoDB, the code is rather simple, but first select the following options.
- Runtime -> Python3
- Enable function URL
- Configure cross-origin resource sharing (CORS)
Go to your Lamda function settings by clicking **Configure** and the IAM policy of **AmazonDynamoDBFullAccess**, and while you are in the configuration menu change the CORS value to  https://yoursite.com

The following code will be interacting with our DB to increase the viewers of the site.
```
import json
import boto3
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('visitors')
def lambda_handler(event, context):
    response = table.get_item(Key={
        'id':1
    })
    views = response['Item']['views']
    print(views)
    views = views + 1
    print(views)
    response = table.put_item(Item={
        'id':1,
        'views':views
    })
    
    return views
```

The following code will update the viewers on the site :
```
const counter = document.querySelector(".counter-number");  
async function updateCounter() {  
    let response = await fetch("Your-LambdaFunction-URL");  
    let data = await response.json();  
    counter.innerHTML = ` This page has ${data} Views!`;  
}  
  
updateCounter();
```

I included it as **index.js** and added the following HTML code ````<div class="counter-number"></div>```` on my site.

### 10) Github Actions

First I created a repository for my website. 
I pushed all the local files to the repository.
under the path **.gituhb/workflows/cicd.yml**, I added the following code:
```
name: Upload website to S3  
  
on:  
  push:  
    branches:  
      - main  
  
jobs:  
  deploy:  
    runs-on: ubuntu-latest  
    steps:  
      - uses: actions/checkout@master  
      - uses: jakejarvis/s3-sync-action@master  
        env:  
          AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}  
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}  
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}  
          AWS_REGION: 'eu-central-1'  
          SOURCE_DIR: '.'
```

Go to your github repository settings -> Secrets -> Secret and variables.
Click on **New repository secret** and add the AWS_S3_BUCKET, AWS_SECRET_ACCESS_KEY and AWS_ACCESS_KEY_ID.

### 11) Profit ???
Now the whole pipeline is ready, by pushing anything to the **main** branch on our github the code will automatically be deployed in the AWS Enviroment.
