# BrAve Forms Infrastructure as Code
# Multi-region AWS deployment with compliance requirements

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }
  
  backend "s3" {
    bucket = "brave-forms-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
    dynamodb_table = "brave-forms-terraform-locks"
  }
}

# Provider configurations
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "BrAve-Forms"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CostCenter  = "Engineering"
      Compliance  = "EPA-SWPPP"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr
  
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  
  availability_zones = data.aws_availability_zones.available.names
  
  enable_nat_gateway = var.environment == "production" ? true : false
  single_nat_gateway = var.environment != "production"
  
  tags = local.common_tags
}

# EKS Cluster
module "eks" {
  source = "./modules/eks"
  
  cluster_name    = "${var.project_name}-${var.environment}"
  cluster_version = var.eks_cluster_version
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
  
  node_groups = {
    general = {
      desired_size = var.environment == "production" ? 3 : 2
      min_size     = var.environment == "production" ? 3 : 1
      max_size     = var.environment == "production" ? 10 : 5
      
      instance_types = var.environment == "production" ? ["t3.large"] : ["t3.medium"]
      
      labels = {
        role = "general"
      }
      
      taints = []
      
      tags = local.common_tags
    }
  }
  
  enable_irsa = true
  
  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }
  
  tags = local.common_tags
}

# RDS PostgreSQL with TimescaleDB
module "rds" {
  source = "./modules/rds"
  
  identifier = "${var.project_name}-${var.environment}"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.environment == "production" ? "db.r6g.xlarge" : "db.t3.medium"
  
  allocated_storage     = var.environment == "production" ? 100 : 20
  max_allocated_storage = var.environment == "production" ? 1000 : 100
  
  database_name = "brave_forms"
  username      = "brave_admin"
  
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.private_subnet_ids
  allowed_security_groups = [module.eks.cluster_security_group_id]
  
  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  performance_insights_enabled = var.environment == "production"
  monitoring_interval         = var.environment == "production" ? 60 : 0
  
  tags = local.common_tags
}

# ElastiCache Redis
module "elasticache" {
  source = "./modules/elasticache"
  
  cluster_id = "${var.project_name}-${var.environment}"
  
  node_type = var.environment == "production" ? "cache.r7g.large" : "cache.t3.micro"
  
  num_cache_nodes = var.environment == "production" ? 2 : 1
  
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.private_subnet_ids
  allowed_security_groups = [module.eks.cluster_security_group_id]
  
  snapshot_retention_limit = var.environment == "production" ? 7 : 1
  
  tags = local.common_tags
}

# S3 Buckets
module "s3" {
  source = "./modules/s3"
  
  project_name = var.project_name
  environment  = var.environment
  
  buckets = {
    photos = {
      name = "${var.project_name}-photos-${var.environment}"
      versioning = true
      lifecycle_rules = [
        {
          id      = "archive-old-photos"
          enabled = true
          
          transition = [
            {
              days          = 90
              storage_class = "STANDARD_IA"
            },
            {
              days          = 365
              storage_class = "GLACIER"
            }
          ]
        }
      ]
    }
    
    backups = {
      name = "${var.project_name}-backups-${var.environment}"
      versioning = true
      lifecycle_rules = [
        {
          id      = "delete-old-backups"
          enabled = true
          
          expiration = {
            days = 90
          }
        }
      ]
    }
  }
  
  tags = local.common_tags
}

# CloudFront CDN
module "cloudfront" {
  source = "./modules/cloudfront"
  
  enabled = var.environment == "production"
  
  origin_domain = module.s3.bucket_regional_domain_names["photos"]
  origin_id     = "S3-${module.s3.bucket_ids["photos"]}"
  
  aliases = var.environment == "production" ? ["cdn.braveforms.com"] : []
  
  price_class = var.environment == "production" ? "PriceClass_All" : "PriceClass_100"
  
  tags = local.common_tags
}

# WAF
module "waf" {
  source = "./modules/waf"
  
  enabled = var.environment == "production"
  
  name  = "${var.project_name}-${var.environment}"
  scope = "CLOUDFRONT"
  
  rate_limit_requests = 10000
  
  ip_whitelist = var.waf_ip_whitelist
  
  tags = local.common_tags
}

# Locals
locals {
  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  )
}