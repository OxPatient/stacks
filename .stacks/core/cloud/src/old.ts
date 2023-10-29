/* eslint-disable no-new */
// TODO: retire this file
import process from 'node:process'
import { ListBucketsCommand, S3 } from '@aws-sdk/client-s3'
import { config } from '@stacksjs/config'
import { env } from '@stacksjs/env'
import { string } from '@stacksjs/strings'
import type { StackProps } from 'aws-cdk-lib'
import {
  Duration,
  CfnOutput as Output,
  RemovalPolicy,
  SecretValue,
  Stack,
  Tags,
  aws_certificatemanager as acm,
  aws_dynamodb as dynamodb,
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_efs as efs,
  aws_elasticloadbalancingv2 as elbv2,
  aws_iam as iam,
  aws_kms as kms,
  aws_lambda as lambda,
  aws_logs as logs,
  aws_opensearchservice as opensearch,
  aws_route53 as route53,
  aws_s3 as s3,
  aws_s3_notifications as s3n,
  aws_ses as ses,
  aws_wafv2 as wafv2,
} from 'aws-cdk-lib'
import { IAMClient, ListRolesCommand } from '@aws-sdk/client-iam'
import type { Construct } from 'constructs'

const appEnv = config.app.env === 'local' ? 'dev' : config.app.env

function isProductionEnv(env: string) {
  return env === 'production' || env === 'prod'
}

export class StacksCloud extends Stack {
  domain!: string
  appName = config.app.name?.toLocaleLowerCase() || 'stacks'
  teamName = config.team.name.toLowerCase() || 'stacks'
  apiPrefix!: string
  apiVanityUrl!: string
  vanityUrl!: string
  websiteSource!: string
  privateSource!: string
  zone!: route53.IHostedZone
  compute!: {
    fargate: ecs.FargateService
  }

  redirectZones: route53.IHostedZone[] = []
  ec2Instance?: ec2.Instance

  vpc!: ec2.Vpc
  // encryptionKey!: kms.Key

  storage!: {
    // publicBucket: s3.Bucket | s3.IBucket
    // privateBucket: s3.Bucket | s3.IBucket
    // logBucket: s3.Bucket | s3.IBucket
    emailBucket: s3.Bucket | s3.IBucket
    accessPoint?: efs.AccessPoint | undefined
    fileSystem?: efs.FileSystem | undefined
  }

  certificate!: acm.Certificate
  firewall!: wafv2.CfnWebACL
  // cdn!: cloudfront.Distribution
  // originAccessIdentity!: cloudfront.OriginAccessIdentity
  // cdnCachePolicy!: cloudfront.CachePolicy
  // apiCachePolicy: cloudfront.CachePolicy | undefined

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)
  }

  async init() {
    // this is a noop function that is used to ensure the constructor is called
    // @ts-expect-error – by default this will be set
    this.storage = {}
    // @ts-expect-error – by default this will be set
    this.compute = {}

    if (!config.app.url)
      throw new Error('Your ./config app.url needs to be defined in order to deploy. You may need to adjust the APP_URL inside your .env file.')

    if (!config.team || Object.keys(config.team).length === 0)
      throw new Error('Your ./config team needs to at least have one member defined. Please set yourself as a team member and try deploying again.')

    if (isProductionEnv(appEnv || 'dev'))
      this.domain = config.app.url
    else
      this.domain = `${appEnv}.${config.app.url}`

    this.apiPrefix = config.api.prefix || 'api'
    // this.docsSource = '../../../storage/framework/docs'
    this.websiteSource = config.app.docMode ? this.docsSource : '../../../storage/public'
    this.privateSource = '../../../storage/private'
    this.apiVanityUrl = ''

    this.manageUsers()
    this.manageZone()
    this.manageNetwork()
    await this.manageEmailServer()
    this.manageCertificate()
    this.manageFileSystem()
    // this.manageCompute()
    // this.manageSearchEngine()
    // this.manageDns() // needs to run after the cdn is created because it links the distribution
    this.addOutputs()
  }

  // shouldDeployDocs() {
  //   return hasFiles(p.projectPath('docs'))
  // }

  // shouldDeployApi() {
  //   return config.cloud.deploy?.api
  // }

  // setApiCachePolicy() {
  //   if (this.apiCachePolicy)
  //     return this.apiCachePolicy

  //   this.apiCachePolicy = new cloudfront.CachePolicy(this, 'ApiCachePolicy', {
  //     comment: 'Stacks API Cache Policy',
  //     cachePolicyName: `${this.appName}-${appEnv}-api-cache-policy`,
  //     // minTtl: config.cloud.cdn?.minTtl ? Duration.seconds(config.cloud.cdn.minTtl) : undefined,
  //     defaultTtl: Duration.seconds(0),
  //     cookieBehavior: cloudfront.CacheCookieBehavior.none(),
  //     headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Accept', 'x-api-key', 'Authorization'),
  //     queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
  //   })

  //   return this.apiCachePolicy
  // }

  // deployApi() {
  //   const layer = new lambda.LayerVersion(this, 'BunLambdaLayer', {
  //     code: lambda.Code.fromAsset(p.projectStoragePath('framework/cloud/bun-lambda-layer.zip')),
  //     compatibleRuntimes: [lambda.Runtime.PROVIDED_AL2],
  //     compatibleArchitectures: [lambda.Architecture.ARM_64],
  //     license: 'MIT',
  //     description: 'Bun is an incredibly fast JavaScript runtime, bundler, transpiler, and package manager.',
  //   })

  //   const keysToRemove = ['_HANDLER', '_X_AMZN_TRACE_ID', 'AWS_REGION', 'AWS_EXECUTION_ENV', 'AWS_LAMBDA_FUNCTION_NAME', 'AWS_LAMBDA_FUNCTION_MEMORY_SIZE', 'AWS_LAMBDA_FUNCTION_VERSION', 'AWS_LAMBDA_INITIALIZATION_TYPE', 'AWS_LAMBDA_LOG_GROUP_NAME', 'AWS_LAMBDA_LOG_STREAM_NAME', 'AWS_ACCESS_KEY', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN', 'AWS_LAMBDA_RUNTIME_API', 'LAMBDA_TASK_ROOT', 'LAMBDA_RUNTIME_DIR', '_']
  //   keysToRemove.forEach(key => delete env[key as EnvKey])

  //   const secrets = new secretsmanager.Secret(this, 'StacksSecrets', {
  //     secretName: `${this.appName}-${appEnv}-secrets`,
  //     description: 'Secrets for the Stacks application',
  //     generateSecretString: {
  //       secretStringTemplate: JSON.stringify(env),
  //       generateStringKey: Object.keys(env).join(',').length.toString(),
  //     },
  //   })

  //   const functionName = `${this.appName}-${appEnv}-server`
  //   const serverFunction = new lambda.Function(this, 'StacksServer', {
  //     functionName,
  //     description: 'The Stacks Server',
  //     memorySize: 512,
  //     vpc: this.vpc,
  //     filesystem: lambda.FileSystem.fromEfsAccessPoint(this.storage.accessPoint!, '/mnt/efs'),
  //     timeout: Duration.seconds(30),
  //     tracing: lambda.Tracing.ACTIVE,
  //     code: lambda.Code.fromAsset(p.projectStoragePath('framework/cloud/api.zip'), {
  //       assetHash: this.node.tryGetContext('serverFunctionCodeHash'),
  //       assetHashType: AssetHashType.CUSTOM,
  //     }),
  //     handler: 'server.fetch',
  //     runtime: lambda.Runtime.PROVIDED_AL2,
  //     architecture: lambda.Architecture.ARM_64,
  //     layers: [layer],
  //   })

  //   secrets.grantRead(serverFunction)
  //   serverFunction.addEnvironment('SECRETS_ARN', secrets.secretArn)

  //   const api = new lambda.FunctionUrl(this, 'StacksServerUrl', {
  //     function: serverFunction,
  //     authType: lambda.FunctionUrlAuthType.NONE, // becomes a public API
  //     cors: {
  //       allowedOrigins: ['*'],
  //     },
  //   })

  //   this.apiVanityUrl = api.url
  // }

  // allowedMethodsFromString(methods?: 'ALL' | 'GET_HEAD' | 'GET_HEAD_OPTIONS'): cloudfront.AllowedMethods {
  //   if (!methods)
  //     return cloudfront.AllowedMethods.ALLOW_ALL

  //   switch (methods) {
  //     case 'ALL':
  //       return cloudfront.AllowedMethods.ALLOW_ALL
  //     case 'GET_HEAD':
  //       return cloudfront.AllowedMethods.ALLOW_GET_HEAD
  //     case 'GET_HEAD_OPTIONS':
  //       return cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS
  //     default:
  //       return cloudfront.AllowedMethods.ALLOW_ALL
  //   }
  // }

  // cachedMethodsFromString(methods?: 'GET_HEAD' | 'GET_HEAD_OPTIONS'): cloudfront.CachedMethods {
  //   if (!methods)
  //     return cloudfront.CachedMethods.CACHE_GET_HEAD

  //   switch (methods) {
  //     case 'GET_HEAD':
  //       return cloudfront.CachedMethods.CACHE_GET_HEAD
  //     case 'GET_HEAD_OPTIONS':
  //       return cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS
  //     default:
  //       return cloudfront.CachedMethods.CACHE_GET_HEAD
  //   }
  // }

  // getCookieBehavior(behavior: string | undefined): cloudfront.CacheCookieBehavior | undefined {
  //   switch (behavior) {
  //     case 'all':
  //       return cloudfront.CacheCookieBehavior.all()
  //     case 'none':
  //       return cloudfront.CacheCookieBehavior.none()
  //     case 'allowList':
  //       // If you have a list of cookies, replace `myCookie` with your cookie
  //       return cloudfront.CacheCookieBehavior.allowList(...config.cloud.cdn?.allowList.cookies || [])
  //     default:
  //       return undefined
  //   }
  // }

  // allowedMethods(): cloudfront.AllowedMethods {
  //   switch (config.cloud.cdn?.allowedMethods) {
  //     case 'ALL':
  //       return cloudfront.AllowedMethods.ALLOW_ALL
  //     case 'GET_HEAD':
  //       return cloudfront.AllowedMethods.ALLOW_GET_HEAD
  //     case 'GET_HEAD_OPTIONS':
  //       return cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS
  //     default:
  //       return cloudfront.AllowedMethods.ALLOW_ALL
  //   }
  // }

  // cachedMethods(): cloudfront.CachedMethods {
  //   switch (config.cloud.cdn?.cachedMethods) {
  //     case 'GET_HEAD':
  //       return cloudfront.CachedMethods.CACHE_GET_HEAD
  //     case 'GET_HEAD_OPTIONS':
  //       return cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS
  //     default:
  //       return cloudfront.CachedMethods.CACHE_GET_HEAD
  //   }
  // }

  manageCompute() {
    const vpc = this.vpc
    const fileSystem = this.storage.fileSystem

    if (!fileSystem)
      throw new Error('The file system is missing. Please make sure it was created properly.')

    const ecsCluster = new ecs.Cluster(this, 'DefaultEcsCluster', {
      clusterName: `${this.appName}-${appEnv}-ecs-cluster`,
      containerInsights: true,
      vpc,
    })

    fileSystem.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['elasticfilesystem:ClientMount'],
        principals: [new iam.AnyPrincipal()],
        conditions: {
          Bool: {
            'elasticfilesystem:AccessedViaMountTarget': 'true',
          },
        },
      }),
    )

    const cacheTable = new dynamodb.Table(this, 'CacheTable', {
      partitionKey: { name: 'counter', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    })

    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      inlinePolicies: {
        AccessToHitCounterTable: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['dynamodb:Get*', 'dynamodb:UpdateItem'],
              resources: [cacheTable.tableArn],
              conditions: {
                ArnLike: {
                  'aws:SourceArn': `arn:aws:ecs:${this.region}:${this.account}:*`,
                },
                StringEquals: {
                  'aws:SourceAccount': this.account,
                },
              },
            }),
          ],
        }),
      },
    })

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'FargateTaskDefinition', {
      memoryLimitMiB: 512, // TODO: make configurable in cloud.compute
      cpu: 256, // TODO: make configurable in cloud.compute
      volumes: [
        {
          name: 'stacks-efs',
          efsVolumeConfiguration: {
            fileSystemId: fileSystem.fileSystemId,
          },
        },
      ],
      taskRole,
      executionRole: new iam.Role(this, 'ExecutionRole', {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      }),
    })

    const containerDef = taskDefinition.addContainer('WebContainer', {
      containerName: `${this.appName}-${appEnv}-web-container`,
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/nginx:latest'),
      logging: new ecs.AwsLogDriver({
        streamPrefix: `${this.appName}-${appEnv}-web`,
        logGroup: new logs.LogGroup(this, 'LogGroup'),
      }),
      // gpuCount: 0,
    })

    containerDef.addMountPoints(
      {
        sourceVolume: 'stacks-efs',
        containerPath: '/mnt/efs',
        readOnly: false,
      },
    )

    containerDef.addPortMappings({ containerPort: 3000 })

    const serviceSecurityGroup = new ec2.SecurityGroup(this, 'ServiceSecurityGroup', {
      vpc,
      description: 'Security group for service',
    })

    const publicLoadBalancerSG = new ec2.SecurityGroup(this, 'PublicLoadBalancerSG', {
      vpc,
      description: 'Access to the public facing load balancer',
    })

    // Assuming serviceSecurityGroup and publicLoadBalancerSG are already defined
    serviceSecurityGroup.addIngressRule(publicLoadBalancerSG, ec2.Port.allTraffic(), 'Ingress from the public ALB')

    const serviceTargetGroup = new elbv2.ApplicationTargetGroup(this, 'ServiceTargetGroup', {
      vpc,
      targetType: elbv2.TargetType.IP,
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 80,
      healthCheck: {
        interval: Duration.seconds(6),
        path: '/',
        timeout: Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 10,
      },
    })

    publicLoadBalancerSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.allTraffic())

    const lb = new elbv2.ApplicationLoadBalancer(this, 'ApplicationLoadBalancer', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      internetFacing: true,
      idleTimeout: Duration.seconds(30),
      securityGroup: publicLoadBalancerSG,
    })

    const listener = lb.addListener('PublicLoadBalancerListener', {
      port: 80,
    })

    const service = new ecs.FargateService(this, 'WebService', {
      serviceName: `${this.appName}-${appEnv}-web-service`,
      cluster: ecsCluster,
      taskDefinition,
      desiredCount: 2,
      assignPublicIp: true,
      minHealthyPercent: 75,
      securityGroups: [serviceSecurityGroup],
    })

    this.compute.fargate = service

    listener.addTargets('ECS', {
      port: 80,
      targets: [service],
    })

    // Setup AutoScaling policy
    // TODO: make this configurable in cloud.compute
    const scaling = this.compute.fargate.autoScaleTaskCount({ maxCapacity: 2 })
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 50,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    })
    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 60,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    })

    // this.compute.fargate.targetGroup.setAttribute('deregistration_delay.timeout_seconds', '0')

    // Allow access to EFS from Fargate ECS
    fileSystem.grantRootAccess(this.compute.fargate.taskDefinition.taskRole.grantPrincipal)
    fileSystem.connections.allowDefaultPortFrom(this.compute.fargate.connections)
  }

  async manageSearchEngine() {
    const vpc = this.vpc

    // Security Group
    const bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      securityGroupName: `${this.appName}-${appEnv}-bastion-sg`,
    })

    const opensearchSecurityGroup = new ec2.SecurityGroup(this, 'OpenSearchSecurityGroup', {
      vpc,
      securityGroupName: `${this.appName}-${appEnv}-opensearch-sg`,
    })

    opensearchSecurityGroup.addIngressRule(bastionSecurityGroup, ec2.Port.tcp(443))

    // Service-linked role that Amazon OpenSearch Service will use
    const iamClient = new IAMClient({})
    const response = await iamClient.send(
      new ListRolesCommand({
        PathPrefix: '/aws-service-role/opensearchservice.amazonaws.com/',
      }),
    )

    // Only if the role for OpenSearch Service doesn't exist, it will be created.
    if (response.Roles && response.Roles?.length === 0) {
      new iam.CfnServiceLinkedRole(this, 'OpenSearchServiceLinkedRole', {
        awsServiceName: 'es.amazonaws.com',
      })
    }

    // Bastion host to access Opensearch Dashboards
    new ec2.BastionHostLinux(this, 'BastionHost', {
      vpc,
      securityGroup: bastionSecurityGroup,
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(10, {
            encrypted: true,
          }),
        },
      ],
    })

    // OpenSearch domain
    const domain = new opensearch.Domain(this, 'OpenSearchDomain', {
      version: opensearch.EngineVersion.OPENSEARCH_2_9,
      nodeToNodeEncryption: true,
      enforceHttps: true,
      encryptionAtRest: {
        enabled: true,
      },
      vpc,
      // unsure if there are "better" ways to do this
      vpcSubnets: [
        { subnetGroupName: `${this.appName}-${appEnv}-private-subnet-1` },
        { subnetGroupName: `${this.appName}-${appEnv}-private-subnet-2` },
      ],

      capacity: {
        masterNodes: 2,
        dataNodes: 2,
        multiAzWithStandbyEnabled: true,
      },
      ebs: {
        volumeSize: 10,
        volumeType: ec2.EbsDeviceVolumeType.GP3, // or opensearch.EbsVolumeType.IO1
      },
      removalPolicy: RemovalPolicy.DESTROY,
      zoneAwareness: {
        enabled: true,
        availabilityZoneCount: 2,
      },
      securityGroups: [opensearchSecurityGroup],
    })

    domain.addAccessPolicies(
      new iam.PolicyStatement({
        principals: [new iam.AnyPrincipal()],
        actions: ['es:ESHttp*'],
        resources: [`${domain.domainArn}/*`],
      }),
    )

    // // Lambda
    // const dataIndexFunction = PythonFunction(this, 'DataIndex', {
    //   runtime: lambda.Runtime.PYTHON_3_10,
    //   entry: 'lambda',
    //   vpc,
    //   environment: {
    //     OPENSEARCH_HOST: domain.domainEndpoint,
    //   },
    // })

    // domain.connections.allowFrom(dataIndexFunction, Port.tcp(443))

    // Outputs
    new Output(this, 'OpenSearchDomainHost', {
      value: domain.domainEndpoint,
    })

    // new Output(this, 'IndexingFunctionName', {
    //   value: dataIndexFunction.functionName,
    // })
  }

  // manageDns() {
  //   // Create a Route53 record pointing to the CloudFront distribution

  // }

  manageUsers() {
    const teamName = config.team.name
    const users = config.team.members
    const password = env.AWS_DEFAULT_PASSWORD || string.random()

    for (const userName in users) {
      // const userEmail = users[userName]
      const name = `User${string.pascalCase(teamName)}${string.pascalCase(userName)}`
      const user = new iam.User(this, name, {
        userName,
        password: SecretValue.unsafePlainText(password),
        passwordResetRequired: true,
      })

      user.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'))

      // TODO: email the userEmail their credentials
    }
  }

  manageZone() {
    // lets see if the zone already exists
    this.zone = route53.PublicHostedZone.fromLookup(this, 'AppUrlHostedZone', {
      domainName: this.domain,
    })

    // TODO: fix this – redirects do not work yet
    // config.dns.redirects?.forEach((redirect) => {
    //   const slug = redirect.split('.').map((part, index) => index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join('') // creates a CamelCase slug from the redirect
    //   const hostedZone = route53.HostedZone.fromLookup(this, `RedirectHostedZone${slug}`, { domainName: redirect })
    //   this.redirectZones.push(hostedZone)
    // })
  }

  manageCertificate() {
    this.certificate = new acm.Certificate(this, 'Certificate', {
      domainName: this.domain,
      validation: acm.CertificateValidation.fromDns(this.zone),
      subjectAlternativeNames: [`www.${this.domain}`],
    })
  }

  // async manageStorage() {
  //   // the bucketName should not contain the domainName because when the APP_URL is changed,
  //   // we want it to deploy properly, and this way we would not force a recreation of the
  //   // resources that contain the domain name
  //   this.storage.publicBucket = await this.getOrCreateBucket()
  //   // for each redirect, create a bucket & redirect it to the APP_URL
  //   config.dns.redirects?.forEach((redirect) => {
  //     // TODO: use string-ts function here instead
  //     const slug = redirect.split('.').map((part, index) => index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join('') // creates a CamelCase slug from the redirect
  //     const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', { domainName: redirect })
  //     const redirectBucket = new s3.Bucket(this, `RedirectBucket${slug}`, {
  //       bucketName: `${redirect}-redirect`,
  //       websiteRedirect: {
  //         hostName: this.domain,
  //         protocol: s3.RedirectProtocol.HTTPS,
  //       },
  //       removalPolicy: RemovalPolicy.DESTROY,
  //       autoDeleteObjects: true,
  //     })
  //     new route53.CnameRecord(this, `RedirectRecord${slug}`, {
  //       zone: hostedZone,
  //       recordName: 'redirect',
  //       domainName: redirectBucket.bucketWebsiteDomainName,
  //     })
  //   })

  //   this.storage.privateBucket = await this.getOrCreateBucket('private')
  //   const bucketPrefix = `${this.appName}-${appEnv}`

  //   this.storage.logBucket = new s3.Bucket(this, 'LogsBucket', {
  //     bucketName: `${bucketPrefix}-logs-${partialAppKey}`,
  //     removalPolicy: RemovalPolicy.DESTROY,
  //     autoDeleteObjects: true,
  //     blockPublicAccess: new s3.BlockPublicAccess({
  //       blockPublicAcls: false,
  //       ignorePublicAcls: true,
  //       blockPublicPolicy: true,
  //       restrictPublicBuckets: true,
  //     }),
  //     objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
  //   })
  //   Tags.of(this.storage.logBucket).add('daily-backup', 'true')

  //   const backupRole = this.createBackupRole()

  //   // Daily 35 day retention
  //   const vault = new backup.BackupVault(this, 'BackupVault', {
  //     backupVaultName: `${this.appName}-${appEnv}-daily-backup-vault`,
  //     encryptionKey: this.encryptionKey,
  //     removalPolicy: RemovalPolicy.DESTROY,
  //   })
  //   const plan = backup.BackupPlan.daily35DayRetention(this, 'BackupPlan', vault)

  //   plan.addSelection('Selection', {
  //     role: backupRole,
  //     resources: [backup.BackupResource.fromTag('daily-backup', 'true')],
  //   })

  //   this.storage = {
  //     publicBucket: this.storage.publicBucket,
  //     privateBucket: this.storage.privateBucket,
  //     emailBucket: this.storage.emailBucket,
  //     logBucket: this.storage.logBucket,
  //   }
  // }

  manageNetwork() {
    this.vpc = new ec2.Vpc(this, 'Network', {
      vpcName: `${this.appName}-${appEnv}-vpc`,
      // ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2, // Maximum number of availability zones to use
      // subnetConfiguration: [
      //   {
      //     cidrMask: 19, // Size of the subnet in CIDR notation
      //     name: `${this.appName}-${appEnv}-public-subnet-1`,
      //     subnetType: ec2.SubnetType.PUBLIC,
      //   },
      //   {
      //     cidrMask: 19,
      //     name: `${this.appName}-${appEnv}-public-subnet-2`,
      //     subnetType: ec2.SubnetType.PUBLIC,
      //   },
      //   {
      //     cidrMask: 19,
      //     name: `${this.appName}-${appEnv}-private-subnet-1`,
      //     subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      //   },
      //   {
      //     cidrMask: 19,
      //     name: `${this.appName}-${appEnv}-private-subnet-2`,
      //     subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      //   },
      // ],
    })
  }

  manageFileSystem() {
    this.storage.fileSystem = new efs.FileSystem(this, 'FileSystem', {
      fileSystemName: `${this.appName}-${appEnv}-efs`,
      vpc: this.vpc,
      removalPolicy: RemovalPolicy.DESTROY,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_7_DAYS,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING,
      enableAutomaticBackups: true, // TODO: ensure this is documented
      encrypted: true,
    })

    const role = new iam.Role(this, 'JumpBoxInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    })

    // this instance needs to be created once to mount the EFS & clone the Stacks repo
    this.ec2Instance = new ec2.Instance(this, 'JumpBox', {
      vpc: this.vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage(),
      role,
      userData: ec2.UserData.custom(`
      #!/bin/bash
      yum update -y
      yum install -y amazon-efs-utils
      yum install -y git
      yum install -y https://s3.us-east-1.amazonaws.com/amazon-ssm-us-east-1/latest/linux_amd64/amazon-ssm-agent.rpm
      mkdir /mnt/efs
      mount -t efs ${this.storage.fileSystem.fileSystemId}:/ /mnt/efs
      git clone https://github.com/stacksjs/stacks.git /mnt/efs
    `),
    })

    this.storage.accessPoint = new efs.AccessPoint(this, 'FileSystemAccessPoint', {
      fileSystem: this.storage.fileSystem,
      path: '/',
      posixUser: {
        uid: '1000',
        gid: '1000',
      },
    })
  }

  async manageEmailServer() {
    this.storage.emailBucket = await this.getOrCreateBucket('email')

    const sesPrincipal = new iam.ServicePrincipal('ses.amazonaws.com')
    const ruleSetName = `${this.appName}-${appEnv}-email-receipt-rule-set`
    const receiptRuleName = `${this.appName}-${appEnv}-email-receipt-rule`

    const ruleSet = new ses.CfnReceiptRuleSet(this, 'SESReceiptRuleSet', {
      ruleSetName,
    })

    this.storage.emailBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowSESPuts',
        effect: iam.Effect.ALLOW,
        principals: [sesPrincipal],
        actions: [
          's3:PutObject',
        ],
        resources: [
          `${this.storage.emailBucket.bucketArn}/*`,
        ],
        conditions: {
          StringEquals: {
            'aws:SourceAccount': Stack.of(this).account,
          },
          ArnLike: {
            'aws:SourceArn': `arn:aws:ses:${this.region}:${Stack.of(this).account}:receipt-rule-set/${ruleSetName}:receipt-rule/${receiptRuleName}`,
          },
        },
      }),
    )

    new ses.CfnReceiptRule(this, 'SESReceiptRule', {
      ruleSetName: ruleSet.ref,
      rule: {
        name: receiptRuleName,
        enabled: true,
        actions: [
          {
            s3Action: {
              bucketName: this.storage.emailBucket.bucketName,
              objectKeyPrefix: 'tmp/email_in/',
            },
          },
        ],
        recipients: config.email.server?.mailboxes || [],
        scanEnabled: config.email.server?.scan || true,
        tlsPolicy: 'Require',
      },
    })

    const iamGroup = new iam.Group(this, 'IAMGroup', {
      groupName: `${this.appName}-${appEnv}-email-management-s3-group`,
    })

    const listBucketsPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:ListAllMyBuckets'],
      resources: ['*'],
    })

    const policyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:ListBucket',
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:GetObjectAcl',
        's3:GetObjectVersionAcl',
        's3:PutObjectAcl',
        's3:PutObjectVersionAcl',
      ],
      resources: [
        this.storage.emailBucket.bucketArn,
        `${this.storage.emailBucket.bucketArn}/*`,
      ],
    })

    const policy = new iam.Policy(this, 'EmailAccessPolicy', {
      policyName: `${this.appName}-${appEnv}-email-management-s3-policy`,
      statements: [policyStatement, listBucketsPolicyStatement],
    })

    iamGroup.attachInlinePolicy(policy)

    // Create a SES domain identity
    const sesIdentity = new ses.CfnEmailIdentity(this, 'DomainIdentity', {
      emailIdentity: this.domain,

      dkimSigningAttributes: {
        nextSigningKeyLength: 'RSA_2048_BIT',
      },

      dkimAttributes: {
        signingEnabled: true,
      },

      mailFromAttributes: {
        behaviorOnMxFailure: 'USE_DEFAULT_VALUE',
        mailFromDomain: `mail.${this.domain}`,
      },

      feedbackAttributes: {
        emailForwardingEnabled: true,
      },
    })

    // Create a Route53 records for the SES domain identity
    // https://github.com/aws/aws-cdk/issues/21306
    new route53.CfnRecordSet(this, 'DkimRecord1', {
      hostedZoneName: `${this.zone.zoneName}.`,
      name: sesIdentity.attrDkimDnsTokenName1,
      type: 'CNAME',
      resourceRecords: [sesIdentity.attrDkimDnsTokenValue1],
      ttl: '1800',
    })

    new route53.CfnRecordSet(this, 'DkimRecord2', {
      hostedZoneName: `${this.zone.zoneName}.`,
      name: sesIdentity.attrDkimDnsTokenName2,
      type: 'CNAME',
      resourceRecords: [sesIdentity.attrDkimDnsTokenValue2],
      ttl: '1800',
    })

    new route53.CfnRecordSet(this, 'DkimRecord3', {
      hostedZoneName: `${this.zone.zoneName}.`,
      name: sesIdentity.attrDkimDnsTokenName3,
      type: 'CNAME',
      resourceRecords: [sesIdentity.attrDkimDnsTokenValue3],
      ttl: '1800',
    })

    new route53.MxRecord(this, 'MxRecord', {
      zone: this.zone,
      recordName: 'mail',
      values: [{
        priority: 10,
        hostName: 'feedback-smtp.us-east-1.amazonses.com',
      }],
    })

    new route53.TxtRecord(this, 'TxtSpfRecord', {
      zone: this.zone,
      recordName: 'mail',
      values: ['v=spf1 include:amazonses.com ~all'],
    })

    new route53.TxtRecord(this, 'TxtDmarcRecord', {
      zone: this.zone,
      recordName: '_dmarc',
      values: [`v=DMARC1;p=quarantine;pct=25;rua=mailto:dmarcreports@${this.domain}`],
    })

    const lambdaEmailOutboundRole = new iam.Role(this, 'LambdaEmailOutboundRole', {
      roleName: `${this.appName}-${appEnv}-email-outbound`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    })

    const lambdaEmailOutbound = new lambda.Function(this, 'LambdaEmailOutbound', {
      functionName: `${this.appName}-${appEnv}-email-outbound`,
      description: 'Take the JSON and convert it in to an raw email.',
      code: lambda.Code.fromInline('exports.handler = async (event) => {return true;};'), // this needs to be updated with the real lambda code
      handler: 'index.handler',
      memorySize: 256,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(60),
      environment: {
        BUCKET: this.storage.emailBucket.bucketName,
      },
      role: lambdaEmailOutboundRole,
    })

    lambdaEmailOutboundRole.addToPolicy(policyStatement)

    const sesPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ses:SendRawEmail'],
      resources: ['*'],
    })

    lambdaEmailOutboundRole.addToPolicy(sesPolicyStatement)

    const lambdaEmailInboundRole = new iam.Role(this, 'LambdaEmailInboundRole', {
      roleName: `${this.appName}-${appEnv}-email-inbound`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    })

    const lambdaEmailInbound = new lambda.Function(this, 'LambdaEmailInbound', {
      functionName: `${this.appName}-${appEnv}-email-inbound`,
      description: 'This Lambda organizes all the incoming emails based on the From and To field.',
      code: lambda.Code.fromInline('exports.handler = async (event) => {return true;};'), // this needs to be updated with the real lambda code
      handler: 'index.handler',
      memorySize: 256,
      role: lambdaEmailInboundRole,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(60),
      environment: {
        BUCKET: this.storage.emailBucket.bucketName,
      },
    })

    new lambda.CfnPermission(this, 'S3InboundPermission', {
      action: 'lambda:InvokeFunction',
      functionName: lambdaEmailInbound.functionName,
      principal: 's3.amazonaws.com',
    })

    const inboundS3PolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:*'],
      resources: [
        this.storage.emailBucket.bucketArn,
        `${this.storage.emailBucket.bucketArn}/*`,
      ],
    })

    lambdaEmailInboundRole.addToPolicy(inboundS3PolicyStatement)

    const sesInboundPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ses:ListIdentities'],
      resources: ['*'],
    })

    lambdaEmailInboundRole.addToPolicy(sesInboundPolicyStatement)

    const lambdaEmailConverterRole = new iam.Role(this, 'LambdaEmailConverterRole', {
      roleName: `${this.appName}-${appEnv}-email-converter`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    })

    const lambdaEmailConverter = new lambda.Function(this, 'LambdaEmailConverter', {
      functionName: `${this.appName}-${appEnv}-email-converter`,
      description: 'This Lambda converts raw emails files in to HTML and text.',
      code: lambda.Code.fromInline('exports.handler = async (event) => {console.log("hello world email converter");return true;};'), // this needs to be updated with the real lambda code
      handler: 'index.handler',
      memorySize: 256,
      role: lambdaEmailConverterRole,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(60),
      environment: {
        BUCKET: this.storage.emailBucket.bucketName,
      },
    })

    const converterS3PolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:*'],
      resources: [
        this.storage.emailBucket.bucketArn,
        `${this.storage.emailBucket.bucketArn}/*`,
      ],
    })

    new lambda.CfnPermission(this, 'S3ConverterPermission', {
      action: 'lambda:InvokeFunction',
      functionName: lambdaEmailConverter.functionName,
      principal: 's3.amazonaws.com',
    })

    lambdaEmailConverterRole.addToPolicy(converterS3PolicyStatement)

    this.storage.emailBucket.addEventNotification(s3.EventType.OBJECT_CREATED_PUT, new s3n.LambdaDestination(lambdaEmailInbound), { prefix: 'tmp/email_in/' })
    this.storage.emailBucket.addEventNotification(s3.EventType.OBJECT_CREATED_PUT, new s3n.LambdaDestination(lambdaEmailOutbound), { prefix: 'tmp/email_out/json/' })
    this.storage.emailBucket.addEventNotification(s3.EventType.OBJECT_CREATED_COPY, new s3n.LambdaDestination(lambdaEmailConverter), { prefix: 'sent/' })
    this.storage.emailBucket.addEventNotification(s3.EventType.OBJECT_CREATED_COPY, new s3n.LambdaDestination(lambdaEmailConverter), { prefix: 'inbox/' })
    this.storage.emailBucket.addEventNotification(s3.EventType.OBJECT_CREATED_COPY, new s3n.LambdaDestination(lambdaEmailConverter), { prefix: 'today/' })
  }

  addOutputs(): void {
    new Output(this, 'AppUrl', {
      value: `https://${this.domain}`,
      description: 'The URL of the deployed application',
    })

    new Output(this, 'AppVanityUrl', {
      value: this.vanityUrl,
      description: 'The vanity URL of the deployed application',
    })

    new Output(this, 'ApiUrl', {
      value: `https://${this.domain}/${this.apiPrefix}`,
      description: 'The URL of the deployed application',
    })

    if (this.apiVanityUrl) {
      new Output(this, 'ApiVanityUrl', {
        value: this.apiVanityUrl,
        description: 'The vanity URL of the deployed Stacks server.',
      })
    }

    if (this.ec2Instance?.instanceId) {
      new Output(this, 'JumpBoxInstanceId', {
        value: this.ec2Instance.instanceId,
        description: 'The ID of the EC2 instance that can be used to SSH into the Stacks Cloud.',
      })
    }
  }

  handleEmailBucket(bucketPrefix: string): s3.Bucket {
    const bucket = new s3.Bucket(this, 'EmailServerBucket', {
      bucketName: `${bucketPrefix}-email-${partialAppKey}`,
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: '24h',
          enabled: true,
          expiration: Duration.days(1),
          noncurrentVersionExpiration: Duration.days(1),
          prefix: 'today/',
        },
        {
          id: 'Intelligent transition for Inbox',
          enabled: true,
          prefix: 'inbox/',
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: Duration.days(0),
            },
          ],
        },
        {
          id: 'Intelligent transition for Sent',
          enabled: true,
          prefix: 'sent/',
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: Duration.days(0),
            },
          ],
        },
      ],
    })

    Tags.of(bucket).add('daily-backup', 'true')

    return bucket
  }
}

export async function getExistingBucketNameByPrefix(prefix: string): Promise<string | undefined | null> {
  const s3 = new S3({ region: 'us-east-1' })

  try {
    const response = await s3.send(new ListBucketsCommand({}))
    const bucket = response.Buckets?.find(bucket => bucket.Name?.startsWith(prefix))

    return bucket ? bucket.Name : null
  }
  catch (error) {
    console.error('Error fetching buckets', error)
    return `${prefix}-${partialAppKey}`
  }
}
